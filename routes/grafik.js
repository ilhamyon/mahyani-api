import express from "express";
import db from "../db.js";
import { authenticate } from "./auth.js";

const router = express.Router();

const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

/**
 * 📊 GET /api/grafik/summary
 * Ringkasan jumlah data dari pendataan dan zkup
 */
router.get("/summary", authenticate, async (req, res) => {
  try {
    let whereClause = "";
    const values = [];

    // Filter untuk user non-admin
    if (req.user.role !== "admin") {
      whereClause = "WHERE pengusul = ?";
      values.push(req.user.pengusul);
    }

    const [pendataan] = await query(
      `SELECT COUNT(*) AS total FROM pendataan ${whereClause}`,
      values
    );
    const [zkup] = await query(
      `SELECT COUNT(*) AS total FROM zkup ${whereClause}`,
      values
    );

    res.json({
      data: {
        pendataan: pendataan.total,
        zkup: zkup.total,
        total: pendataan.total + zkup.total,
      },
      isSuccess: true,
    });
  } catch (err) {
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

/**
 * 📈 GET /api/grafik/perKabupaten
 * Agregasi jumlah data per kabupaten
 */
router.get("/perKabupaten", authenticate, async (req, res) => {
  try {
    let whereClause = "";
    const values = [];

    if (req.user.role !== "admin") {
      whereClause = "WHERE pengusul = ?";
      values.push(req.user.pengusul);
    }

    const pendataan = await query(
      `SELECT kabupaten, COUNT(*) AS jumlah FROM pendataan ${whereClause} GROUP BY kabupaten`,
      values
    );

    const zkup = await query(
      `SELECT kabupaten, COUNT(*) AS jumlah FROM zkup ${whereClause} GROUP BY kabupaten`,
      values
    );

    res.json({
      data: { pendataan, zkup },
      isSuccess: true,
    });
  } catch (err) {
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

/**
 * 🗓️ GET /api/grafik/perTahun
 * Data berdasarkan tahun realisasi
 */
router.get("/perTahun", authenticate, async (req, res) => {
  try {
    let whereClause = "";
    const values = [];

    if (req.user.role !== "admin") {
      whereClause = "WHERE pengusul = ?";
      values.push(req.user.pengusul);
    }

    const pendataan = await query(
      `SELECT tahun_realisasi AS tahun, COUNT(*) AS jumlah 
       FROM pendataan ${whereClause} GROUP BY tahun_realisasi ORDER BY tahun_realisasi`,
      values
    );

    const zkup = await query(
      `SELECT periode AS tahun, COUNT(*) AS jumlah 
       FROM zkup ${whereClause} GROUP BY periode ORDER BY periode`,
      values
    );

    res.json({
      data: { pendataan, zkup },
      isSuccess: true,
    });
  } catch (err) {
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

/**
 * ✅ GET /api/grafik/perStatus
 * Jumlah data berdasarkan status (disetujui, ditolak, menunggu)
 */
router.get("/perStatus", authenticate, async (req, res) => {
  try {
    let whereClause = "";
    const values = [];

    if (req.user.role !== "admin") {
      whereClause = "WHERE pengusul = ?";
      values.push(req.user.pengusul);
    }

    const pendataan = await query(
      `SELECT status, COUNT(*) AS jumlah FROM pendataan ${whereClause} GROUP BY status`,
      values
    );
    const zkup = await query(
      `SELECT status, COUNT(*) AS jumlah FROM zkup ${whereClause} GROUP BY status`,
      values
    );

    res.json({
      data: { pendataan, zkup },
      isSuccess: true,
    });
  } catch (err) {
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

export default router;
