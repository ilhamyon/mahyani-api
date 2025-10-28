import express from "express";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import db from "../db.js";

const router = express.Router();

// === LOGIN ===
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  const users = await db.query("SELECT * FROM users WHERE email = ?", [email]);
  const user = users[0];

  if (!user) return res.status(401).json({ message: "Email tidak ditemukan" });

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ message: "Password salah" });

  const token = jwt.sign(
    { id: user.id, role: user.role, pengusul: user.pengusul },
    process.env.JWT_SECRET,
    { expiresIn: "1d" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      username: user.username,
      name: user.name,
      email: user.email,
      role: user.role,
      pengusul: user.pengusul,
    },
  });
});

// === AUTH MIDDLEWARE ===
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ message: "Token tidak ada" });

  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Token tidak valid" });
    req.user = user;
    next();
  });
};

export default router;
