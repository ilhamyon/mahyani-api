const express = require("express");
const cors = require("cors");
const app = express();
const pendataanRoutes = require("./routes/pendataan");

app.use(cors({
  origin: "https://mahyani.amayor.id", // frontend URL
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

app.use(express.json());
app.use("/api/pendataan", pendataanRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
