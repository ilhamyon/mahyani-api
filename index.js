const express = require("express");
const cors = require("cors");
const app = express();
const pendataanRoutes = require("./routes/pendataan");
const zkupRoutes = require("./routes/zkup");

// app.use(cors({
//   origin: [
//     "http://localhost:5173",         // frontend lokal
//     "https://mahyani.amayor.id"      // frontend production (jika ada)
//   ],
//   methods: ["GET", "POST", "PUT", "DELETE"],
//   credentials: true
// }));

app.use(cors()); // Mengizinkan semua origin (jangan dipakai di production)

app.use(express.json());
app.use("/api/pendataan", pendataanRoutes);
app.use("/api/zkup", zkupRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
