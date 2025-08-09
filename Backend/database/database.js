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

  db.run("PRAGMA foreign_keys = ON;", (err) => {
    if (err) {
      console.error("Failed to enable foreign keys:", err.message);
    } else {
      console.log("Foreign key enforcement is ON.");
    }
  });
});

export default db;
