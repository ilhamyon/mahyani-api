const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const db = require("../db.js");
const express = require("express");
const router = express.Router();

// Helper query (promise wrapper) using db.query
const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

// === LOGIN ===
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Cek user di database
    const users = await query("SELECT * FROM users WHERE email = ?", [email]);
    const user = users && users[0];

    if (!user) {
      return res.status(401).json({ message: "Email tidak ditemukan" });
    }

    // Cek password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({ message: "Password salah" });
    }

    // Generate token JWT
    const token = jwt.sign(
      { id: user.id, role: user.role, pengusul: user.pengusul },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        name: user.name,
        email: user.email,
        role: user.role,
        pengusul: user.pengusul,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Terjadi kesalahan pada server" });
  }
});

// === AUTH MIDDLEWARE ===
const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return res.status(401).json({ message: "Token tidak ada" });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: "Token tidak valid" });
    }

    req.user = user;
    next();
  });
};

// Ekspor router dan middleware
module.exports = { router, authenticate };
