const express = require("express");
const mysql = require("mysql2/promise");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const crypto = require("crypto");
require("dotenv").config();

const app = express();
app.use(express.json());
app.use(cors());

// Database Configuration
const dbConfig = {
  host: "localhost",
  user: "root",
  password: "root", // Change if needed
  database: "vys",
};

// 🔹 Initialize MySQL Connection
async function initializeDatabase() {
  try {
    const connection = await mysql.createConnection({
      host: dbConfig.host,
      user: dbConfig.user,
      password: dbConfig.password,
    });

    // Create database if it doesn't exist
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${dbConfig.database}`);
    console.log(`✅ Database '${dbConfig.database}' checked/created.`);

    // Connect to the database
    const db = await mysql.createConnection(dbConfig);

    // 🔹 Create Users Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        role ENUM('user', 'admin') NOT NULL DEFAULT 'user',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Ensure an admin account exists
    const [admin] = await db.query("SELECT * FROM users WHERE role = 'admin'");
    if (admin.length === 0) {
      const hashedPassword = await bcrypt.hash("admin@123", 10);
      await db.query("INSERT INTO users (name, email, password, role) VALUES ('Admin', 'admin@gmail.com', ?, 'admin')", [hashedPassword]);
      console.log("✅ Default Admin Created: admin@gmail.com / admin@123");
    }

    // 🔹 Create Products Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS products (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        price DECIMAL(10,2) NOT NULL,
        stock INT NOT NULL,
        category VARCHAR(50),
        image VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 🔹 Create Cart Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS cart (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        product_id INT NOT NULL,
        quantity INT NOT NULL DEFAULT 1,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
      );
    `);

    // 🔹 Create Orders Table
    await db.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id INT AUTO_INCREMENT PRIMARY KEY,
        user_id INT NOT NULL,
        total_price DECIMAL(10,2) NOT NULL,
        payment_method ENUM('Credit Card', 'Debit Card', 'PayPal', 'UPI', 'Cash on Delivery') NOT NULL,
        status ENUM('Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Processing',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
      );
    `);

    console.log("✅ All tables checked/created successfully.");
    return db;
  } catch (error) {
    console.error("❌ Database Initialization Error:", error);
    process.exit(1);
  }
}

// 🔹 Start Database Initialization
let db;
initializeDatabase().then((database) => {
  db = database;
  startServer();
});

// Middleware to Verify JWT Token
const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ error: "Access Denied. No token provided." });

  jwt.verify(token.split(" ")[1], process.env.JWT_SECRET || "defaultsecret", (err, decoded) => {
    if (err) return res.status(401).json({ error: "Invalid Token" });
    req.user = decoded;
    next();
  });
};

// Middleware to Verify Admin
const verifyAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Unauthorized. Admin access only." });
  next();
};

// 🔹 Start Express Server and APIs
function startServer() {
  // ✅ Login API
  app.post("/api/login", async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: "Email and password are required" });
  
      const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
      if (users.length === 0) return res.status(401).json({ error: "Invalid email or password" });
  
      const user = users[0];
      let passwordMatch = false;
  
      if (user.email === "admin@gmail.com") {
        // 🔹 Bypass bcrypt for admin (Compare directly)
        passwordMatch = password === user.password;
      } else {
        // 🔹 Use bcrypt for all other users
        passwordMatch = await bcrypt.compare(password, user.password);
      }
  
      if (!passwordMatch) return res.status(401).json({ error: "Invalid email or password" });
  
      // 🔹 Generate JWT Token
      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET || "defaultsecret", { expiresIn: "1h" });
  
      res.json({ message: "Login successful", token, role: user.role });
    } catch (error) {
      console.error("❌ Login Error:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

 
// Email Transporter Setup (Use your email credentials)
const transporter = nodemailer.createTransport({
  service: "Gmail", // Or use SMTP service like SendGrid
  auth: {
    user: "abhi.63044562@gmail.com", // Replace with your email
    pass: "jxeu myyy nvcx cdjg", // Use an App Password for security
  },
});

app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const [users] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(404).json({ error: "User not found" });

    const user = users[0];

    // Generate Reset Token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const expiryTime = new Date(Date.now() + 3600000); // 1 hour expiry

    // Save Reset Token in Database
    await db.query("UPDATE users SET reset_token = ?, reset_token_expiry = ? WHERE email = ?", 
      [resetToken, expiryTime, email]);

    // Send Reset Email
    const resetLink = `http://localhost:3000/reset-password/${resetToken}`;
    await transporter.sendMail({
      from: "your-email@gmail.com",
      to: email,
      subject: "Password Reset Request",
      html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link is valid for 1 hour.</p>`,
    });

    res.json({ message: "Reset password link sent to email" });
  } catch (error) {
    console.error("❌ Forgot Password Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});

app.post("/api/reset-password", async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) return res.status(400).json({ error: "Invalid request. Token and password are required." });

    const [users] = await db.query("SELECT * FROM users WHERE reset_token = ? AND reset_token_expiry > NOW()", [token]);
    if (users.length === 0) return res.status(400).json({ error: "Invalid or expired reset token." });

    const user = users[0];

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password and clear reset token
    await db.query("UPDATE users SET password = ?, reset_token = NULL, reset_token_expiry = NULL WHERE id = ?", 
      [hashedPassword, user.id]);

    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("❌ Reset Password Error:", error);
    res.status(500).json({ error: "Server error" });
  }
});




  // ✅ Register New User API
app.post("/api/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if email already exists
    const [existingUser] = await db.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existingUser.length > 0) {
      return res.status(400).json({ error: "Email is already registered" });
    }

    // Hash the password before storing it
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into database
    await db.query("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, 'user')", 
      [name, email, hashedPassword]);

    res.json({ message: "User registered successfully" });
  } catch (error) {
    console.error("❌ Registration Error:", error);
    res.status(500).json({ error: "Database error" });
  }
});



  // ✅ Get All Users (Admin Only)
  app.get("/api/users", verifyToken, verifyAdmin, async (req, res) => {
    try {
      const [users] = await db.query("SELECT id, name, email, role FROM users");
      res.json(users);
    } catch (error) {
      console.error("❌ Error Fetching Users:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // ✅ Delete User (Admin Only)
  app.delete("/api/users/:id", verifyToken, verifyAdmin, async (req, res) => {
    try {
      const userId = req.params.id;
      await db.query("DELETE FROM users WHERE id = ?", [userId]);
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("❌ Error Deleting User:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // ✅ Fetch All Products
  app.get("/api/products", async (req, res) => {
    try {
      const [products] = await db.query("SELECT * FROM products");
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
      await db.query(
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
      await db.query("DELETE FROM products WHERE id = ?", [req.params.id]);
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      console.error("❌ Error Deleting Product:", error);
      res.status(500).json({ error: "Database error" });
    }
  });

  // Start Server
  const PORT = process.env.PORT || 5000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
  });
}
