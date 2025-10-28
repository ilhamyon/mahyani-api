const express = require("express");
const db = require("../db.js");
const { authenticate } = require("./auth.js");
const router = express.Router();

// Helper untuk query async
const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

/**
 * 📋 GET /api/laporan/pendataan
 * Laporan lengkap dari tabel pendataan (dapat difilter)
 */
router.get("/pendataan", authenticate, async (req, res) => {
  try {
    const { kabupaten, status, tahun } = req.query;
    const filters = [];
    const values = [];

    // 🔒 Role-based filtering
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
      `
      SELECT id, nama, nik, telepon, desa, kecamatan, kabupaten, pengusul, tahun_realisasi, status
      FROM pendataan
      ${whereClause}
      ORDER BY tahun_realisasi DESC, kabupaten ASC
      `,
      values
    );

    res.json({
      source: "pendataan",
      total: results.length,
      data: results,
      isSuccess: true,
    });
  } catch (err) {
    console.error("Error /laporan/pendataan:", err);
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

/**
 * 📋 GET /api/laporan/zkup
 * Laporan lengkap dari tabel ZKUP (dapat difilter)
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
      `
      SELECT id, nama, nik, telepon, desa, kecamatan, kabupaten, pengusul, periode, status
      FROM zkup
      ${whereClause}
      ORDER BY periode DESC, kabupaten ASC
      `,
      values
    );

    res.json({
      source: "zkup",
      total: results.length,
      data: results,
      isSuccess: true,
    });
  } catch (err) {
    console.error("Error /laporan/zkup:", err);
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

/**
 * 📑 GET /api/laporan/combined
 * Gabungan Pendataan & ZKUP untuk laporan total
 */
router.get("/combined", authenticate, async (req, res) => {
  try {
    const filtersPendataan = [];
    const filtersZkup = [];
    const valuesPendataan = [];
    const valuesZkup = [];

    // Filter by role
    if (req.user.role !== "admin") {
      filtersPendataan.push("pengusul = ?");
      filtersZkup.push("pengusul = ?");
      valuesPendataan.push(req.user.pengusul);
      valuesZkup.push(req.user.pengusul);
    }

    const wherePendataan = filtersPendataan.length ? `WHERE ${filtersPendataan.join(" AND ")}` : "";
    const whereZkup = filtersZkup.length ? `WHERE ${filtersZkup.join(" AND ")}` : "";

    const [pendataan, zkup] = await Promise.all([
      query(
        `
        SELECT 'Pendataan' AS sumber, id, nama, nik, telepon, desa, kecamatan, kabupaten,
               pengusul, tahun_realisasi AS periode, status
        FROM pendataan
        ${wherePendataan}
        ORDER BY tahun_realisasi DESC
        `,
        valuesPendataan
      ),
      query(
        `
        SELECT 'ZKUP' AS sumber, id, nama, nik, telepon, desa, kecamatan, kabupaten,
               pengusul, periode, status
        FROM zkup
        ${whereZkup}
        ORDER BY periode DESC
        `,
        valuesZkup
      ),
    ]);

    const combinedData = [...pendataan, ...zkup].sort((a, b) =>
      (b.periode || "").localeCompare(a.periode || "")
    );

    res.json({
      data: combinedData,
      total: combinedData.length,
      isSuccess: true,
    });
  } catch (err) {
    console.error("Error /laporan/combined:", err);
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

module.exports = router;
