import db from "./database/database.js";

db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, rows) => {
  if (err) {
    console.error("Error listing tables:", err.message);
    process.exit(1);
  }
  console.log("Tables in DB:");
  rows.forEach((row) => console.log("-", row.name));
  process.exit(0);
});
// This script lists all tables in the SQLite database
