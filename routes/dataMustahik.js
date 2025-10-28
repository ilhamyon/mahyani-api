const db = require("../db.js");
const { authenticate } = require("./auth.js");
const express = require("express");
const router = express.Router();

// Helper query (promise wrapper)
const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

/**
 * 📍 GET /api/data-mustahik/pendataan
 * Ambil daftar mustahik dari tabel pendataan
 */
router.get("/pendataan", authenticate, async (req, res) => {
  try {
    let sql = `
      SELECT id, nama, nik, telepon, desa, kecamatan, kabupaten, pengusul
      FROM pendataan
    `;

    const values = [];
    if (req.user.role !== "admin") {
      sql += " WHERE pengusul = ?";
      values.push(req.user.pengusul);
    }

    const results = await query(sql, values);
    res.status(200).json({ data: results, isSuccess: true });
  } catch (err) {
    console.error("Error fetching pendataan:", err);
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

/**
 * 📍 GET /api/data-mustahik/zkup
 * Ambil daftar mustahik dari tabel zkup
 */
router.get("/zkup", authenticate, async (req, res) => {
  try {
    let sql = `
      SELECT id, nama, nik, telepon, desa, kecamatan, kabupaten, pengusul
      FROM zkup
    `;

    const values = [];
    if (req.user.role !== "admin") {
      sql += " WHERE pengusul = ?";
      values.push(req.user.pengusul);
    }

    const results = await query(sql, values);
    res.status(200).json({ data: results, isSuccess: true });
  } catch (err) {
    console.error("Error fetching zkup:", err);
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

module.exports = router;
