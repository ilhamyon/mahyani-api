const express = require("express");
const router = express.Router();
const db = require("../db");

// GET all
router.get("/", (req, res) => {
  db.query("SELECT * FROM pendataan", (err, results) => {
    if (err) return res.status(500).json({ data: null, errorMessage: err.message, isSuccess: false });
    res.json({ data: results, errorMessage: null, isSuccess: true });
  });
});

// GET by ID
router.get("/:id", (req, res) => {
  db.query("SELECT * FROM pendataan WHERE id = ?", [req.params.id], (err, result) => {
    if (err) return res.status(500).json({ data: null, errorMessage: err.message, isSuccess: false });
    res.json({ data: result[0], errorMessage: null, isSuccess: true });
  });
});

function generateId(callback) {
  const newId = Math.floor(1000 + Math.random() * 9000).toString();
  db.query("SELECT id FROM pendataan WHERE id = ?", [newId], (err, result) => {
    if (err) return callback(err);
    if (result.length > 0) {
      generateId(callback); // Ulangi jika sudah dipakai
    } else {
      callback(null, newId);
    }
  });
}

// POST create
router.post("/", (req, res) => {
  const data = req.body;
  generateId((err, newId) => {
    if (err) return res.status(500).json({ data: null, errorMessage: err.message, isSuccess: false });

    const payload = { id: newId, ...data };
    db.query("INSERT INTO pendataan SET ?", payload, (err, result) => {
      if (err) return res.status(500).json({ data: null, errorMessage: err.message, isSuccess: false });
      res.json({ data: payload, errorMessage: null, isSuccess: true });
    });
  });
});

// PUT update
router.put("/:id", (req, res) => {
  const data = req.body;
  db.query("UPDATE pendataan SET ? WHERE id = ?", [data, req.params.id], (err) => {
    if (err) return res.status(500).json({ data: null, errorMessage: err.message, isSuccess: false });
    res.json({ data: { id: req.params.id, ...data }, errorMessage: null, isSuccess: true });
  });
});

// DELETE
router.delete("/:id", (req, res) => {
  db.query("DELETE FROM pendataan WHERE id = ?", [req.params.id], (err) => {
    if (err) return res.status(500).json({ data: null, errorMessage: err.message, isSuccess: false });
    res.json({ data: null, errorMessage: null, isSuccess: true });
  });
});

module.exports = router;