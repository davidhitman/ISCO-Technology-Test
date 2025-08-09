// set up and export a connection to SQLite database with foreign key constraints enabled.
import sqlite3Pkg from "sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const sqlite3 = sqlite3Pkg.verbose();
const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH || join(__dirname, "job_board.db");

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) return console.error("DB connection error:", err.message);
  console.log("Connected to the SQLite database:", DB_PATH);

  db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON;");
    db.run("PRAGMA journal_mode = WAL;");
    db.run("PRAGMA busy_timeout = 5000;");
  });

  // Initialize the database schema from schema.sql
  try {
    const schemaPath = new URL("./schema.sql", import.meta.url);
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");

    db.exec(schemaSQL, (schemaErr) => {
      if (schemaErr) {
        console.error("Schema initialization failed:", schemaErr.message);
      } else {
        console.log("Schema initialized (schema.sql executed).");
      }
    });
  } catch (readErr) {
    console.error("Could not read schema.sql:", readErr.message);
  }
});

export default db;
