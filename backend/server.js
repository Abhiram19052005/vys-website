const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
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

// Admin & User Login API
app.post("/api/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const sql = "SELECT * FROM users WHERE email = ?";
  db.query(sql, [email], (err, results) => {
    if (err) {
      console.error("Database error:", err);
      return res.status(500).json({ error: "Database error" });
    }

    if (results.length === 0) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const user = results[0];

    // Verify the password (plain-text check for now)
    if (password !== user.password) {
      return res.status(401).json({ error: "Invalid email or password" });
    }

    const role = user.role;  // Retrieve role from DB

    // Generate JWT Token
    const token = jwt.sign({ id: user.id, email: user.email, role }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Login successful", token, role });
  });
});

// Start Server
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
