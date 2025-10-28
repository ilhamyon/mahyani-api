const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");

dotenv.config();
const app = express();

// === Middleware dasar ===
app.use(cors());
app.use(express.json());

// === Import route modules ===
const pendataanRoutes = require("./routes/pendataan");
const zkupRoutes = require("./routes/zkup");
const userRoutes = require("./routes/users");
const dataMustahikRoutes = require("./routes/dataMustahik");
const grafikRoutes = require("./routes/grafik");
const laporanRoutes = require("./routes/laporan");
const { router: authRouter, authenticate } = require("./routes/auth");

// === ROUTES ===

// 🔓 Public route
app.use("/api/auth", authRouter);

// 🔐 Protected routes (each route file should use authenticate internally where needed)
app.use("/api/pendataan", authenticate, pendataanRoutes);
app.use("/api/zkup", authenticate, zkupRoutes);
app.use("/api/users", authenticate, userRoutes);
app.use("/api/data-mustahik", authenticate, dataMustahikRoutes);
app.use("/api/grafik", authenticate, grafikRoutes);
app.use("/api/laporan", authenticate, laporanRoutes);

// === SERVER START ===
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
