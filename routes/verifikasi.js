const express = require("express");
const router = express.Router();
const db = require("../db.js");
const { authenticate } = require("./auth.js");

// Helper query async
const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

/**
 * 🟡 GET /api/verifikasi/menunggu
 * Menampilkan semua data berstatus "Menunggu"
 */
router.get("/menunggu", authenticate, async (req, res) => {
  try {
    let whereClause = "WHERE status = 'Menunggu'";
    const values = [];

    if (req.user.role !== "admin") {
      whereClause += " AND pengusul = ?";
      values.push(req.user.pengusul);
    }

    const pendataan = await query(
      `SELECT id, nama, nik, kabupaten, pengusul, status, tahun_realisasi, created_at AS tanggal, 'pendataan' AS sumber
       FROM pendataan ${whereClause}`,
      values
    );

    const zkup = await query(
      `SELECT id, nama, nik, kabupaten, pengusul, status, periode, created_at AS tanggal, 'zkup' AS sumber
       FROM zkup ${whereClause}`,
      values
    );

    // Gabung dan urutkan berdasarkan tanggal terbaru
    const data = [...pendataan, ...zkup].sort(
      (a, b) => new Date(b.tanggal) - new Date(a.tanggal)
    );

    res.json({
      total: data.length,
      data,
      isSuccess: true,
    });
  } catch (err) {
    console.error("Error /verifikasi/menunggu:", err);
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

/**
 * 🟢 PATCH /api/verifikasi/update-status
 * Mengubah status verifikasi data (pendataan / zkup)
 * Body: { sumber: "pendataan"|"zkup", id: number, status: "Disetujui"|"Ditolak"|"Menunggu" }
 */
router.patch("/update-status", authenticate, async (req, res) => {
  try {
    const { data } = req.body;

    if (!Array.isArray(data) || data.length === 0) {
      return res.status(400).json({ message: "Data tidak boleh kosong", isSuccess: false });
    }

    let totalUpdated = 0;

    for (const item of data) {
      const { sumber, ids, status } = item;

      // Validasi sumber
      if (!["pendataan", "zkup"].includes(sumber)) continue;

      // Validasi status
      if (!["Disetujui", "Ditolak", "Menunggu"].includes(status)) continue;

      // Validasi IDs
      if (!Array.isArray(ids) || ids.length === 0) continue;

      const placeholders = ids.map(() => "?").join(",");
      const sql = `UPDATE ${sumber} SET status = ? WHERE id IN (${placeholders})`;
      const result = await query(sql, [status, ...ids]);

      totalUpdated += result.affectedRows;
    }

    if (totalUpdated === 0) {
      return res.status(404).json({ message: "Tidak ada data yang diubah", isSuccess: false });
    }

    res.json({
      message: `Berhasil memperbarui status ${totalUpdated} data`,
      updatedCount: totalUpdated,
      isSuccess: true,
    });
  } catch (err) {
    console.error("Error /verifikasi/update-status:", err);
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

module.exports = router;
