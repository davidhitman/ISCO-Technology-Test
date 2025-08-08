-- This file defines the database schema for the application.
-- It includes tables for users, jobs, and applications with necessary fields and constraints.

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  fullName TEXT NOT NULL,
  username TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  phoneNumber TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'user'))
);

CREATE TABLE IF NOT EXISTS jobs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  location TEXT NOT NULL,
  company TEXT NOT NULL,
  employmentType TEXT NOT NULL,
  postedAt TEXT DEFAULT CURRENT_TIMESTAMP
);


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

