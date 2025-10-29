const express = require("express");
const router = express.Router();
const db = require("../db");

// Helper: Promise wrapper untuk query MySQL
const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

// Fungsi generate ID unik 4-digit
const generateId = async () => {
    const newId = Math.floor(1000 + Math.random() * 9000).toString();
    const result = await query("SELECT id FROM zkup WHERE id = ?", [newId]);
    return result.length ? generateId() : newId;
};

// ✅ GET semua data (dengan filter role)
router.get("/", async (req, res) => {
  try {
    res.set("Cache-Control", "no-store");
    let sql = "SELECT * FROM zkup";
    let values = [];

    // Kalau bukan admin → hanya tampilkan data berdasarkan pengusul login
    if (req.user.role !== "admin") {
      sql += " WHERE pengusul = ?";
      values.push(req.user.pengusul);
    }

    sql += " ORDER BY created_at DESC";

    const results = await query(sql, values);
    res.status(200).json({ data: results, errorMessage: null, isSuccess: true });
  } catch (err) {
    res.status(500).json({ data: null, errorMessage: err.message, isSuccess: false });
  }
});

// ✅ GET by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await query("SELECT * FROM zkup WHERE id = ?", [req.params.id]);
    if (result.length === 0) {
      return res.status(404).json({ data: null, errorMessage: "Data tidak ditemukan", isSuccess: false });
    }

    // Jika user bukan admin, pastikan data miliknya sendiri
    if (req.user.role !== "admin" && result[0].pengusul !== req.user.pengusul) {
      return res.status(403).json({ data: null, errorMessage: "Akses ditolak", isSuccess: false });
    }

    res.status(200).json({ data: result[0], errorMessage: null, isSuccess: true });
  } catch (err) {
    res.status(500).json({ data: null, errorMessage: err.message, isSuccess: false });
  }
});

// ✅ POST tambah data baru
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ data: null, errorMessage: "Payload kosong", isSuccess: false });
    }

    const newId = await generateId();
    const payload = {
      id: newId,
      ...data,
      pengusul: req.user.pengusul, // otomatis isi dari user login
      status: "Menunggu", // default status
    };

    await query("INSERT INTO zkup SET ?", payload);
    res.status(201).json({ data: payload, errorMessage: null, isSuccess: true });
  } catch (err) {
    res.status(500).json({ data: null, errorMessage: err.message, isSuccess: false });
  }
});

// ✅ PUT update data
router.put("/:id", async (req, res) => {
  try {
    const data = req.body;
    const result = await query("SELECT * FROM zkup WHERE id = ?", [req.params.id]);

    if (result.length === 0) {
      return res.status(404).json({ data: null, errorMessage: "Data tidak ditemukan", isSuccess: false });
    }

    // Operator hanya bisa edit datanya sendiri
    if (req.user.role !== "admin" && result[0].pengusul !== req.user.pengusul) {
      return res.status(403).json({ data: null, errorMessage: "Akses ditolak", isSuccess: false });
    }

    await query("UPDATE zkup SET ? WHERE id = ?", [data, req.params.id]);
    res.status(200).json({ data: { id: req.params.id, ...data }, errorMessage: null, isSuccess: true });
  } catch (err) {
    res.status(500).json({ data: null, errorMessage: err.message, isSuccess: false });
  }
});

// ✅ DELETE data
router.delete("/:id", async (req, res) => {
  try {
    const result = await query("SELECT * FROM zkup WHERE id = ?", [req.params.id]);
    if (result.length === 0) {
      return res.status(404).json({ data: null, errorMessage: "Data tidak ditemukan", isSuccess: false });
    }

    if (req.user.role !== "admin" && result[0].pengusul !== req.user.pengusul) {
      return res.status(403).json({ data: null, errorMessage: "Akses ditolak", isSuccess: false });
    }

    await query("DELETE FROM zkup WHERE id = ?", [req.params.id]);
    res.status(200).json({ data: null, errorMessage: null, isSuccess: true });
  } catch (err) {
    res.status(500).json({ data: null, errorMessage: err.message, isSuccess: false });
  }
});

module.exports = router;
