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

    // Jika user bukan admin → hanya data miliknya
    if (req.user.role !== "admin") {
      whereClause += " AND pengusul = ?";
      values.push(req.user.pengusul);
    }

    const pendataan = await query(
      `SELECT id, nama, nik, kabupaten, pengusul, status, tahun_realisasi AS tahun, 'pendataan' AS sumber
       FROM pendataan ${whereClause}`,
      values
    );

    const zkup = await query(
      `SELECT id, nama, nik, kabupaten, pengusul, status, periode AS tahun, 'zkup' AS sumber
       FROM zkup ${whereClause}`,
      values
    );

    const data = [...pendataan, ...zkup];

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
 * Body: { sumber: "pendataan"|"zkup", id: number, status: "Disetujui"|"Ditolak" }
 */
router.patch("/update-status", authenticate, async (req, res) => {
  try {
    const { sumber, id, status } = req.body;

    // Validasi input
    if (!["pendataan", "zkup"].includes(sumber)) {
      return res.status(400).json({ message: "Sumber tidak valid", isSuccess: false });
    }

    if (!["Disetujui", "Ditolak", "Menunggu"].includes(status)) {
      return res.status(400).json({ message: "Status tidak valid", isSuccess: false });
    }

    const result = await query(
      `UPDATE ${sumber} SET status = ? WHERE id = ?`,
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Data tidak ditemukan", isSuccess: false });
    }

    res.json({
      message: "Status verifikasi berhasil diperbarui",
      updated: { sumber, id, status },
      isSuccess: true,
    });
  } catch (err) {
    console.error("Error /verifikasi/update-status:", err);
    res.status(500).json({ message: err.message, isSuccess: false });
  }
});

module.exports = router;
