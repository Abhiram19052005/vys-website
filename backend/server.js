const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Database Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "root", // Change if needed
  database: "vys",
});

db.connect((err) => {
  if (err) {
    console.error("❌ MySQL Connection Error:", err);
    return;
  }
  console.log("✅ MySQL Connected...");
});

// 🔐 Middleware to Verify JWT Token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ error: "Access Denied. No token provided." });

  jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid Token" });
    req.user = decoded;
    next();
  });
};

// 🔐 Middleware to Verify Admin Access
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized. Admin access only." });
  next();
};

// 🔐 Register New User
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: "All fields are required" });

    // Check if email is already registered
    const [existingUser] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await db.promise().query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')", 
      [name, email, hashedPassword]);

    res.json({ message: "User registered successfully" });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// 🔐 Login (Admin & Users)
app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

    const [users] = await db.promise().query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(401).json({ error: "Invalid email or password" });

    const user = users[0];

    let passwordMatch = false;

    // If password is already hashed, use bcrypt compare
    if (user.password.startsWith("$2a$")) {
      passwordMatch = await bcrypt.compare(password, user.password);
    } else {
      // For old plaintext passwords, compare directly
      passwordMatch = password === user.password;
    }

    if (!passwordMatch) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token, role: user.role });
  } catch (error) {
    console.error("❌ Login Error:", error);
    res.status(500).json({ error: "Database error" });
  }
});


// ✅ Fetch All Products
app.get("/api/products", async (req, res) => {
  try {
    const [products] = await db.promise().query("SELECT * FROM products");
    res.json(products);
  } catch (error) {
    console.error("❌ Error Fetching Products:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Add New Product (Admin Only)
app.post("/api/products", verifyToken, verifyAdmin, async (req, res) => {
  try {
    const { name, description, price, stock, category, image } = req.body;
    await db.promise().query(
      "INSERT INTO products (name, description, price, stock, category, image) VALUES (?, ?, ?, ?, ?, ?)",
      [name, description, price, stock, category, image]
    );
    res.json({ message: "Product added successfully" });
  } catch (error) {
    console.error("❌ Error Adding Product:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Delete Product (Admin Only)
app.delete("/api/products/:id", verifyToken, verifyAdmin, async (req, res) => {
  try {
    await db.promise().query("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ message: "Product deleted successfully" });
  } catch (error) {
    console.error("❌ Error Deleting Product:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Add to Cart
app.post("/api/cart", verifyToken, async (req, res) => {
  try {
    const { product_id, quantity } = req.body;
    await db.promise().query(
      "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
      [req.user.id, product_id, quantity]
    );
    res.json({ message: "Product added to cart" });
  } catch (error) {
    console.error("❌ Error Adding to Cart:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Get User Cart Items
app.get("/api/cart", verifyToken, async (req, res) => {
  try {
    const [cartItems] = await db.promise().query(
      "SELECT cart.id, products.name, products.price, cart.quantity FROM cart INNER JOIN products ON cart.product_id = products.id WHERE cart.user_id = ?",
      [req.user.id]
    );
    res.json(cartItems);
  } catch (error) {
    console.error("❌ Error Fetching Cart Items:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Place Order
app.post("/api/orders", verifyToken, async (req, res) => {
  try {
    const { total_price, payment_method } = req.body;
    await db.promise().query(
      "INSERT INTO orders (user_id, total_price, payment_method, status) VALUES (?, ?, ?, 'Processing')",
      [req.user.id, total_price, payment_method]
    );
    res.json({ message: "Order placed successfully" });
  } catch (error) {
    console.error("❌ Error Placing Order:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// ✅ Get User Orders
app.get("/api/orders", verifyToken, async (req, res) => {
  try {
    const [orders] = await db.promise().query("SELECT * FROM orders WHERE user_id = ?", [req.user.id]);
    res.json(orders);
  } catch (error) {
    console.error("❌ Error Fetching Orders:", error);
    res.status(500).json({ error: "Database error" });
  }
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
