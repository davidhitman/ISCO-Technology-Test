// set up and export a connection to SQLite database with foreign key constraints enabled.

// Backend/database/database.js
import sqlite3Pkg from "sqlite3";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const sqlite3 = sqlite3Pkg.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Heroku: DB_PATH should be /tmp/job_board.db
const DB_PATH = process.env.DB_PATH || path.join(__dirname, "job_board.db");
console.log("[DB] Using DB_PATH:", DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("[DB] Connection error:", err.message);
    return;
  }
  console.log("[DB] Connected OK");

  db.serialize(() => {
    db.run("PRAGMA foreign_keys = ON;");
    db.run("PRAGMA journal_mode = WAL;");
    db.run("PRAGMA busy_timeout = 5000;");
  });

  // === SCHEMA LOAD with loud logging
  try {
    // database.js is in Backend/database → schema is in Backend/sql/schema.sql
    const schemaPath = path.join(__dirname, "..", "sql", "schema.sql");
    const exists = fs.existsSync(schemaPath);
    console.log("[DB] schema.sql exists?", exists, "path:", schemaPath);

    if (!exists)
      return console.error("[DB] schema.sql NOT FOUND (not in slug?)");

    let sql = fs.readFileSync(schemaPath, "utf8");
    console.log(
      "[DB] schema bytes:",
      Buffer.byteLength(sql),
      "preview:",
      sql.slice(0, 160).replace(/\n/g, " ")
    );

    // Convert any '#' comments to '--' (safety)
    sql = sql.replace(/^\s*#.*$/gm, "--");

    db.exec(sql, (schemaErr) => {
      if (schemaErr) {
        console.error("[DB] Schema init FAILED:", schemaErr.message);
      } else {
        console.log("[DB] Schema init OK (schema.sql executed).");

        // List tables to prove they exist
        db.all(
          `SELECT name FROM sqlite_master WHERE type='table'`,
          (e, rows) => {
            if (e) console.error("[DB] List tables error:", e.message);
            else
              console.log(
                "[DB] Tables now:",
                rows.map((r) => r.name)
              );
          }
        );
      }
    });
  } catch (readErr) {
    console.error("[DB] Could not read schema.sql:", readErr.message);
  }
  // === /SCHEMA LOAD
});

export default db;
