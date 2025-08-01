const express = require("express");
const router = express.Router();
const db = require("../db");

// Helper: Query wrapper pakai Promise
const query = (sql, values = []) =>
  new Promise((resolve, reject) => {
    db.query(sql, values, (err, results) => {
      if (err) reject(err);
      else resolve(results);
    });
  });

// Helper: Generate 4-digit unique ID
const generateId = async () => {
  const newId = Math.floor(1000 + Math.random() * 9000).toString();
  const result = await query("SELECT id FROM zkup WHERE id = ?", [newId]);
  return result.length ? generateId() : newId;
};

// GET all
router.get("/", async (req, res) => {
  try {
    const results = await query("SELECT * FROM zkup");
    res.status(200).json({ data: results, errorMessage: null, isSuccess: true });
  } catch (err) {
    res.status(500).json({ data: null, errorMessage: err.message, isSuccess: false });
  }
});

// GET by ID
router.get("/:id", async (req, res) => {
  try {
    const result = await query("SELECT * FROM zkup WHERE id = ?", [req.params.id]);
    if (result.length === 0) {
      return res.status(404).json({ data: null, errorMessage: "Data tidak ditemukan", isSuccess: false });
    }
    res.status(200).json({ data: result[0], errorMessage: null, isSuccess: true });
  } catch (err) {
    res.status(500).json({ data: null, errorMessage: err.message, isSuccess: false });
  }
});

// POST create
router.post("/", async (req, res) => {
  try {
    const data = req.body;
    if (!data || Object.keys(data).length === 0) {
      return res.status(400).json({ data: null, errorMessage: "Payload kosong", isSuccess: false });
    }

    const newId = await generateId();
    const payload = { id: newId, ...data };
    await query("INSERT INTO zkup SET ?", payload);
    res.status(201).json({ data: payload, errorMessage: null, isSuccess: true });
  } catch (err) {
    res.status(500).json({ data: null, errorMessage: err.message, isSuccess: false });
  }
});

// PUT update
router.put("/:id", async (req, res) => {
  try {
    const data = req.body;
    const result = await query("SELECT * FROM zkup WHERE id = ?", [req.params.id]);
    if (result.length === 0) {
      return res.status(404).json({ data: null, errorMessage: "Data tidak ditemukan", isSuccess: false });
    }
    await query("UPDATE zkup SET ? WHERE id = ?", [data, req.params.id]);
    res.status(200).json({ data: { id: req.params.id, ...data }, errorMessage: null, isSuccess: true });
  } catch (err) {
    res.status(500).json({ data: null, errorMessage: err.message, isSuccess: false });
  }
});

// DELETE
router.delete("/:id", async (req, res) => {
  try {
    const result = await query("SELECT * FROM zkup WHERE id = ?", [req.params.id]);
    if (result.length === 0) {
      return res.status(404).json({ data: null, errorMessage: "Data tidak ditemukan", isSuccess: false });
    }
    await query("DELETE FROM zkup WHERE id = ?", [req.params.id]);
    res.status(200).json({ data: null, errorMessage: null, isSuccess: true });
  } catch (err) {
    res.status(500).json({ data: null, errorMessage: err.message, isSuccess: false });
  }
});

module.exports = router;
