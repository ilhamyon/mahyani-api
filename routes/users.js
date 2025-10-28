const express = require("express");
const bcrypt = require("bcryptjs");
const db = require("../db");
const router = express.Router();

// Helper query
const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

// Middleware cek role admin
const checkAdmin = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ isSuccess: false, errorMessage: "Akses ditolak. Hanya admin." });
  }
  next();
};

// ✅ GET semua user
router.get("/", checkAdmin, async (req, res) => {
  try {
    const users = await query("SELECT id, username, name, email, role, pengusul, created_at FROM users");
    res.json({ data: users, isSuccess: true });
  } catch (err) {
    res.status(500).json({ errorMessage: err.message, isSuccess: false });
  }
});

// ✅ GET user by ID
router.get("/:id", checkAdmin, async (req, res) => {
  try {
    const users = await query("SELECT id, username, name, email, role, pengusul, created_at FROM users WHERE id = ?", [req.params.id]);
    if (users.length === 0) return res.status(404).json({ errorMessage: "User tidak ditemukan" });
    res.json({ data: users[0], isSuccess: true });
  } catch (err) {
    res.status(500).json({ errorMessage: err.message, isSuccess: false });
  }
});

// ✅ POST tambah user baru
router.post("/", checkAdmin, async (req, res) => {
  try {
    const { username, name, email, password, role = "user", pengusul = null } = req.body;

    if (!username || !name || !email || !password) {
      return res.status(400).json({ errorMessage: "Semua field wajib diisi" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const payload = {
      username,
      name,
      email,
      password: hashedPassword,
      role,
      pengusul,
    };

    await query("INSERT INTO users SET ?", payload);
    res.status(201).json({ data: { username, name, email, role, pengusul }, isSuccess: true });
  } catch (err) {
    if (err.code === "ER_DUP_ENTRY") {
      res.status(400).json({ errorMessage: "Username atau email sudah digunakan", isSuccess: false });
    } else {
      res.status(500).json({ errorMessage: err.message, isSuccess: false });
    }
  }
});

// ✅ PUT update user
router.put("/:id", checkAdmin, async (req, res) => {
  try {
    const { username, name, email, password, role, pengusul } = req.body;
    const updateData = {};

    if (username) updateData.username = username;
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (role) updateData.role = role;
    if (pengusul) updateData.pengusul = pengusul;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    await query("UPDATE users SET ? WHERE id = ?", [updateData, req.params.id]);
    res.json({ data: { id: req.params.id, ...updateData }, isSuccess: true });
  } catch (err) {
    res.status(500).json({ errorMessage: err.message, isSuccess: false });
  }
});

// ✅ DELETE user
router.delete("/:id", checkAdmin, async (req, res) => {
  try {
    await query("DELETE FROM users WHERE id = ?", [req.params.id]);
    res.json({ message: "User dihapus", isSuccess: true });
  } catch (err) {
    res.status(500).json({ errorMessage: err.message, isSuccess: false });
  }
});

module.exports = router;
