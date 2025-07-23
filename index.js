const express = require("express");
const app = express();
const pendataanRoutes = require("./routes/pendataan");

app.use(express.json());
app.use("/api/pendataan", pendataanRoutes);

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});