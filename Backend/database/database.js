// set up and export a connection to SQLite database with foreign key constraints enabled.

import sqlite3Pkg from "sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import bcrypt from "bcrypt";

const sqlite3 = sqlite3Pkg.verbose();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DB_PATH = process.env.DB_PATH || path.join(__dirname, "job_board.db");
console.log("Database using DB_PATH:", DB_PATH);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error("Database Connection error:", err.message);
    return;
  }
  console.log("Database Connected OK");

  db.serialize(async () => {
    db.run("PRAGMA foreign_keys = ON;");
    db.run("PRAGMA journal_mode = WAL;");
    db.run("PRAGMA busy_timeout = 5000;");

    // Create tables if not exists
    db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        fullName TEXT NOT NULL,
        username TEXT NOT NULL UNIQUE,
        email TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        phoneNumber TEXT NOT NULL,
        role TEXT NOT NULL CHECK (role IN ('admin', 'user'))
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        location TEXT NOT NULL,
        company TEXT NOT NULL,
        employmentType TEXT NOT NULL,
        postedAt TEXT DEFAULT CURRENT_TIMESTAMP
      );
    `);

    db.run(`
      CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jobId INTEGER NOT NULL,
        userId INTEGER NOT NULL,
        coverLetter TEXT NOT NULL,
        cvLink TEXT NOT NULL,
        status TEXT DEFAULT 'applied',
        appliedAt TEXT DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (jobId) REFERENCES jobs(id),
        FOREIGN KEY (userId) REFERENCES users(id)
      );
    `);

    // Seed admin user if not exists
    const adminEmail = "david@gmail.com";
    const adminPassword = await bcrypt.hash("david123", 10);

    db.get("SELECT * FROM users WHERE email = ?", [adminEmail], (err, row) => {
      if (err) {
        console.error("Error checking admin:", err.message);
      } else if (!row) {
        db.run(
          `INSERT INTO users (fullName, username, email, password, phoneNumber, role)
             VALUES (?, ?, ?, ?, ?, ?)`,
          [
            "David Hitimana",
            "david",
            adminEmail,
            adminPassword,
            "+250788123456",
            "admin",
          ],
          (err) => {
            if (err) {
              console.error("Error inserting admin:", err.message);
            } else {
              console.log("Admin user created:", adminEmail);
            }
          }
        );
      } else {
        console.log("Admin user already exists:", adminEmail);
      }
    });

    // Print tables to confirm
    db.all(`SELECT name FROM sqlite_master WHERE type='table'`, (err, rows) => {
      if (err) {
        console.error("[DB] Error listing tables:", err.message);
      } else {
        console.log(
          "Tables in the database:",
          rows.map((r) => r.name)
        );
      }
    });
  });
});

export default db;
