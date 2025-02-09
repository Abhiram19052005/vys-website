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
  password: "root",  // Change if needed
  database: "vys",
});

db.connect((err) => {
  if (err) {
    console.error("MySQL Connection Error: ", err);
    return;
  }
  console.log("✅ MySQL Connected...");
});

// 🔐 Middleware to Verify JWT Token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ error: "Access Denied" });

  jwt.verify(token.split(" ")[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid Token" });
    req.user = decoded;
    next();
  });
};

// 🔐 Middleware to Verify Admin Access
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized" });
  next();
};

// 🔐 Register New User
app.post("/api/register", async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) return res.status(400).json({ error: "All fields are required" });

  const hashedPassword = await bcrypt.hash(password, 10);
  db.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')", 
    [name, email, hashedPassword], 
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ message: "User registered successfully" });
    }
  );
});

// 🔐 Login (Admin & Users)
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "Email and password are required" });

  db.query("SELECT * FROM users WHERE email = ?", [email], async (err, results) => {
    if (err) return res.status(500).json({ error: "Database error" });
    if (results.length === 0) return res.status(401).json({ error: "Invalid email or password" });

    const user = results[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ error: "Invalid email or password" });

    const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: "1h" });
    res.json({ message: "Login successful", token, role: user.role });
  });
});

// ✅ Fetch All Products
app.get("/api/products", (req, res) => {
  db.query("SELECT * FROM products", (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(result);
  });
});

// ✅ Add New Product (Admin Only)
app.post("/api/products", verifyToken, verifyAdmin, (req, res) => {
  const { name, description, price, stock, category, image } = req.body;
  db.query(
    "INSERT INTO products (name, description, price, stock, category, image) VALUES (?, ?, ?, ?, ?, ?)",
    [name, description, price, stock, category, image],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ message: "Product added successfully" });
    }
  );
});

// ✅ Delete Product (Admin Only)
app.delete("/api/products/:id", verifyToken, verifyAdmin, (req, res) => {
  db.query("DELETE FROM products WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "Product deleted successfully" });
  });
});

// ✅ Add to Cart
app.post("/api/cart", verifyToken, (req, res) => {
  const { product_id, quantity } = req.body;
  db.query(
    "INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)",
    [req.user.id, product_id, quantity],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ message: "Product added to cart" });
    }
  );
});

// ✅ Get User Cart Items
app.get("/api/cart", verifyToken, (req, res) => {
  db.query(
    "SELECT cart.id, products.name, products.price, cart.quantity FROM cart INNER JOIN products ON cart.product_id = products.id WHERE cart.user_id = ?",
    [req.user.id],
    (err, result) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json(result);
    }
  );
});

// ✅ Remove Item from Cart
app.delete("/api/cart/:id", verifyToken, (req, res) => {
  db.query("DELETE FROM cart WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "Item removed from cart" });
  });
});

// ✅ Place Order
app.post("/api/orders", verifyToken, (req, res) => {
  const { total_price, payment_method } = req.body;
  db.query(
    "INSERT INTO orders (user_id, total_price, payment_method, status) VALUES (?, ?, ?, 'Processing')",
    [req.user.id, total_price, payment_method],
    (err) => {
      if (err) return res.status(500).json({ error: "Database error" });
      res.json({ message: "Order placed successfully" });
    }
  );
});

// ✅ Get User Orders
app.get("/api/orders", verifyToken, (req, res) => {
  db.query("SELECT * FROM orders WHERE user_id = ?", [req.user.id], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(result);
  });
});

// ✅ Update Profile
app.put("/api/profile", verifyToken, (req, res) => {
  const { name, email } = req.body;
  db.query("UPDATE users SET name = ?, email = ? WHERE id = ?", [name, email, req.user.id], (err) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json({ message: "Profile updated successfully" });
  });
});

// ✅ Get User Profile
app.get("/api/profile", verifyToken, (req, res) => {
  db.query("SELECT id, name, email, role FROM users WHERE id = ?", [req.user.id], (err, result) => {
    if (err) return res.status(500).json({ error: "Database error" });
    res.json(result[0]);
  });
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
