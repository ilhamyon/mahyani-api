const db = require("../db.js");
const { authenticate } = require("./auth.js");
const express = require("express");
const router = express.Router();

// Helper query dengan Promise
const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

/**
 * 📊 GET /api/grafik/summary
 * Ringkasan total data dari pendataan dan zkup
 */
router.get("/summary", authenticate, async (req, res) => {
  try {
    let whereClause = "";
    const values = [];

    // Filter jika user bukan admin
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
        pendataan: pendataan.total || 0,
        zkup: zkup.total || 0,
        total: (pendataan.total || 0) + (zkup.total || 0),
      },
      isSuccess: true,
    });
  } catch (err) {
    console.error("Error in /summary:", err);
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

/**
 * 📈 GET /api/grafik/perKabupaten
 * Agregasi jumlah data per kabupaten dari pendataan & zkup
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

    // Gabungkan berdasarkan kabupaten
    const combined = {};
    for (const row of pendataan) {
      combined[row.kabupaten] = { kabupaten: row.kabupaten, pendataan: row.jumlah, zkup: 0 };
    }
    for (const row of zkup) {
      if (!combined[row.kabupaten])
        combined[row.kabupaten] = { kabupaten: row.kabupaten, pendataan: 0, zkup: row.jumlah };
      else combined[row.kabupaten].zkup = row.jumlah;
    }

    res.json({
      data: Object.values(combined),
      isSuccess: true,
    });
  } catch (err) {
    console.error("Error in /perKabupaten:", err);
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

/**
 * 🗓️ GET /api/grafik/perTahun
 * Agregasi berdasarkan tahun realisasi (pendataan) & periode (zkup)
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
       FROM pendataan ${whereClause} 
       GROUP BY tahun_realisasi 
       ORDER BY tahun_realisasi`,
      values
    );

    const zkup = await query(
      `SELECT periode AS tahun, COUNT(*) AS jumlah 
       FROM zkup ${whereClause} 
       GROUP BY periode 
       ORDER BY periode`,
      values
    );

    // Gabungkan hasil berdasarkan tahun
    const combined = {};
    for (const row of pendataan) {
      combined[row.tahun] = { tahun: row.tahun, pendataan: row.jumlah, zkup: 0 };
    }
    for (const row of zkup) {
      if (!combined[row.tahun])
        combined[row.tahun] = { tahun: row.tahun, pendataan: 0, zkup: row.jumlah };
      else combined[row.tahun].zkup = row.jumlah;
    }

    res.json({
      data: Object.values(combined),
      isSuccess: true,
    });
  } catch (err) {
    console.error("Error in /perTahun:", err);
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

    // Gabungkan status agar bisa tampil di chart
    const allStatus = {};
    for (const row of pendataan) {
      allStatus[row.status] = { status: row.status, pendataan: row.jumlah, zkup: 0 };
    }
    for (const row of zkup) {
      if (!allStatus[row.status])
        allStatus[row.status] = { status: row.status, pendataan: 0, zkup: row.jumlah };
      else allStatus[row.status].zkup = row.jumlah;
    }

    res.json({
      data: Object.values(allStatus),
      isSuccess: true,
    });
  } catch (err) {
    console.error("Error in /perStatus:", err);
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

/**
 * 👥 GET /api/grafik/perPengusul
 * Jumlah data per pengusul dari pendataan dan zkup
 */
router.get("/perPengusul", authenticate, async (req, res) => {
  try {
    let whereClause = "";
    const values = [];

    // Jika user bukan admin, hanya tampilkan data miliknya
    if (req.user.role !== "admin") {
      whereClause = "WHERE pengusul = ?";
      values.push(req.user.pengusul);
    }

    const pendataan = await query(
      `SELECT pengusul, COUNT(*) AS jumlah FROM pendataan ${whereClause} GROUP BY pengusul`,
      values
    );

    const zkup = await query(
      `SELECT pengusul, COUNT(*) AS jumlah FROM zkup ${whereClause} GROUP BY pengusul`,
      values
    );

    // Gabungkan berdasarkan pengusul
    const combined = {};
    for (const row of pendataan) {
      combined[row.pengusul] = { pengusul: row.pengusul, pendataan: row.jumlah, zkup: 0 };
    }
    for (const row of zkup) {
      if (!combined[row.pengusul])
        combined[row.pengusul] = { pengusul: row.pengusul, pendataan: 0, zkup: row.jumlah };
      else combined[row.pengusul].zkup = row.jumlah;
    }

    res.json({
      data: Object.values(combined),
      isSuccess: true,
    });
  } catch (err) {
    console.error("Error in /perPengusul:", err);
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

module.exports = router;
