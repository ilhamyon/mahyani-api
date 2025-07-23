const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "rumah_layak_huni",
});

db.connect((err) => {
  if (err) throw err;
  console.log("Connected to MySQL");
});

module.exports = db;