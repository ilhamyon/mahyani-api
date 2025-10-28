import express from "express";
import db from "../db.js";
import { authenticate } from "./auth.js";

const router = express.Router();

// Fungsi helper query
const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

/**
 * 📋 GET /api/laporan/pendataan
 * Laporan lengkap pendataan (bisa difilter)
 */
router.get("/pendataan", authenticate, async (req, res) => {
  try {
    const { kabupaten, status, tahun } = req.query;
    const filters = [];
    const values = [];

    // Role-based filter (operator hanya lihat data pengusul-nya)
    if (req.user.role !== "admin") {
      filters.push("pengusul = ?");
      values.push(req.user.pengusul);
    }

    if (kabupaten) {
      filters.push("kabupaten = ?");
      values.push(kabupaten);
    }

    if (status) {
      filters.push("status = ?");
      values.push(status);
    }

    if (tahun) {
      filters.push("tahun_realisasi = ?");
      values.push(tahun);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const results = await query(
      `SELECT id, nama, nik, telepon, desa, kecamatan, kabupaten, pengusul, tahun_realisasi, status 
       FROM pendataan ${whereClause} ORDER BY tahun_realisasi DESC`,
      values
    );

    res.json({
      data: results,
      total: results.length,
      isSuccess: true,
    });
  } catch (err) {
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

/**
 * 📋 GET /api/laporan/zkup
 * Laporan lengkap ZKUP (bisa difilter)
 */
router.get("/zkup", authenticate, async (req, res) => {
  try {
    const { kabupaten, status, periode } = req.query;
    const filters = [];
    const values = [];

    if (req.user.role !== "admin") {
      filters.push("pengusul = ?");
      values.push(req.user.pengusul);
    }

    if (kabupaten) {
      filters.push("kabupaten = ?");
      values.push(kabupaten);
    }

    if (status) {
      filters.push("status = ?");
      values.push(status);
    }

    if (periode) {
      filters.push("periode = ?");
      values.push(periode);
    }

    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

    const results = await query(
      `SELECT id, nama, nik, telepon, desa, kecamatan, kabupaten, pengusul, periode, status 
       FROM zkup ${whereClause} ORDER BY periode DESC`,
      values
    );

    res.json({
      data: results,
      total: results.length,
      isSuccess: true,
    });
  } catch (err) {
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

/**
 * 📑 GET /api/laporan/combined
 * Gabungan Pendataan & ZKUP untuk laporan total
 */
router.get("/combined", authenticate, async (req, res) => {
  try {
    let whereClausePendataan = "";
    let whereClauseZkup = "";
    const values = [];

    if (req.user.role !== "admin") {
      whereClausePendataan = "WHERE pengusul = ?";
      whereClauseZkup = "WHERE pengusul = ?";
      values.push(req.user.pengusul);
    }

    const pendataan = await query(
      `SELECT 'Pendataan' AS sumber, id, nama, nik, telepon, desa, kecamatan, kabupaten, pengusul, tahun_realisasi AS periode, status 
       FROM pendataan ${whereClausePendataan}`,
      values
    );

    const zkup = await query(
      `SELECT 'ZKUP' AS sumber, id, nama, nik, telepon, desa, kecamatan, kabupaten, pengusul, periode, status 
       FROM zkup ${whereClauseZkup}`,
      values
    );

    res.json({
      data: [...pendataan, ...zkup],
      total: pendataan.length + zkup.length,
      isSuccess: true,
    });
  } catch (err) {
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

export default router;
