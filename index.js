const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const app = express();

dotenv.config();

const pendataanRoutes = require("./routes/pendataan");
const zkupRoutes = require("./routes/zkup");
const userRoutes = require("./routes/users");
const dataMustahikRoutes = ("./routes/dataMustahik.js");
const grafikRoutes = ("./routes/grafik.js");
const laporanRoutes = ("./routes/laporan.js");
const authRouter = require("./routes/auth").default || require("./routes/auth");
const { authenticate } = require("./routes/auth");

app.use(cors());
app.use(express.json());

// Public
app.use("/api/auth", authRouter);

// Protected
app.use("/api/pendataan", authenticate, pendataanRoutes);
app.use("/api/zkup", authenticate, zkupRoutes);
app.use("/api/users", authenticate, userRoutes);
app.use("/api/data-mustahik", dataMustahikRoutes);
app.use("/api/grafik", grafikRoutes);
app.use("/api/laporan", laporanRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
