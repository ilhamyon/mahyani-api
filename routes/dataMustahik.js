import express from "express";
import db from "../db.js";
import { authenticate } from "./auth.js";

const router = express.Router();

// Helper query
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

    // Kalau user bukan admin, filter berdasarkan pengusul
    const values = [];
    if (req.user.role !== "admin") {
      sql += " WHERE pengusul = ?";
      values.push(req.user.pengusul);
    }

    const results = await query(sql, values);
    res.status(200).json({ data: results, isSuccess: true });
  } catch (err) {
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

    // Filter untuk user (bukan admin)
    const values = [];
    if (req.user.role !== "admin") {
      sql += " WHERE pengusul = ?";
      values.push(req.user.pengusul);
    }

    const results = await query(sql, values);
    res.status(200).json({ data: results, isSuccess: true });
  } catch (err) {
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

export default router;
