// this file initializes the database schema for the job board application
import fs from "fs";
import db from "../database/database.js";

try {
  const schemaSQL = fs.readFileSync(
    new URL("../sql/schema.sql", import.meta.url),
    "utf8"
  );
  db.exec(schemaSQL, (err) => {
    if (err) {
      console.error("Schema init FAILED:", err.message);
      process.exit(1);
    } else {
      console.log("Schema init OK: tables created/ensured.");
      process.exit(0);
    }
  });
} catch (e) {
  console.error("Could not read schema.sql:", e.message);
  process.exit(1);
}
// Ensure foreign key constraints are enabled
db.run("PRAGMA foreign_keys = ON;", (err) => {
  if (err) {
    console.error("Failed to enable foreign keys:", err.message);
  } else {
    console.log("Foreign key enforcement is ON.");
  }
});
