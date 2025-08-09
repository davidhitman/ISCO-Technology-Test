// set up and export a connection to SQLite database with foreign key constraints enabled.

import sqlite3Pkg from "sqlite3";
import { join, dirname } from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const sqlite3 = sqlite3Pkg.verbose();
const __dirname = dirname(fileURLToPath(import.meta.url));

const DB_PATH = process.env.DB_PATH || join(__dirname, "job_board.db");
const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("DB connection error:", err.message);
    return;
  }
  console.log("Connected to SQLite:", DB_PATH);

  // Enable foreign keys
  db.run("PRAGMA foreign_keys = ON;");

  // Auto-run schema.sql to ensure tables exist
  try {
    const schemaPath = join(__dirname, "../sql/schema.sql");
    const schemaSQL = fs.readFileSync(schemaPath, "utf8");
    db.exec(schemaSQL, (err) => {
      if (err) {
        console.error("Schema init FAILED:", err.message);
      } else {
        console.log("Schema initialized.");
      }
    });
  } catch (e) {
    console.error("Could not read schema.sql:", e.message);
  }
});

export default db;
