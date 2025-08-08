import express from "express";
import db from "../database/database.js";
import { authenticate, authorizeRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route to create a new job posting
router.post("/", authenticate, authorizeRole("admin"), (req, res) => {
  const { title, description, location, company, employmentType } = req.body;

  if (!title || !description || !location || !company || !employmentType) {
    return res.status(400).json({ message: "All fields are required" });
  }

  const sql = `INSERT INTO jobs (title, description, location, company, employmentType) VALUES (?, ?, ?, ?, ?)`;
  const params = [title, description, location, company, employmentType];

  db.run(sql, params, function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Database error", error: err.message });
    }
    res.status(201).json({ message: "Job created successfully" });
  });
});

// Route to update a job posting
router.put("/:id", authenticate, authorizeRole("admin"), (req, res) => {
  const jobId = req.params.id;
  const { title, description, location, company, employmentType } = req.body;
  if (!title || !description || !location || !company || !employmentType) {
    return res.status(400).json({ message: "All fields are required" });
  }
  const sql = `UPDATE jobs SET title = ?, description = ?, location = ?, company = ?, employmentType = ? WHERE id = ?`;
  const params = [title, description, location, company, employmentType, jobId];
  db.run(sql, params, function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Database error", error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.status(200).json({ message: "Job updated successfully" });
  });
});

// Route to delete a job posting
router.delete("/:id", authenticate, authorizeRole("admin"), (req, res) => {
  const jobId = req.params.id;
  const sql = `DELETE FROM jobs WHERE id = ?`;
  db.run(sql, [jobId], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Database error", error: err.message });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.status(200).json({ message: "Job deleted successfully" });
  });
});

// Route to get all job postings with pagination
router.get("/", (req, res) => {
  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Count total jobs for pagination info
  db.get("SELECT COUNT(*) as count FROM jobs", [], (err, countResult) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Database error", error: err.message });
    }
    const totalJobs = countResult.count;
    const totalPages = Math.ceil(totalJobs / limit);

    // Fetch paginated jobs
    const sql = "SELECT * FROM jobs ORDER BY postedAt DESC LIMIT ? OFFSET ?";
    db.all(sql, [limit, offset], (err, rows) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Database error", error: err.message });
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: "No jobs found" });
      }

      res.status(200).json({
        jobs: rows,
        page,
        totalPages,
        totalJobs,
      });
    });
  });
});

// Get jobs by filter (title, location, employmentType, postedAt) with pagination
router.get("/filter", (req, res) => {
  const { title, location, employmentType, postedWithin } = req.query;

  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  let sql = "SELECT * FROM jobs WHERE 1=1";
  let countSql = "SELECT COUNT(*) as count FROM jobs WHERE 1=1";
  const params = [];
  const countParams = [];

  if (title) {
    sql += " AND title LIKE ?";
    countSql += " AND title LIKE ?";
    params.push(`%${title}%`);
    countParams.push(`%${title}%`);
  }
  if (location) {
    sql += " AND location LIKE ?";
    countSql += " AND location LIKE ?";
    params.push(`%${location}%`);
    countParams.push(`%${location}%`);
  }
  if (employmentType) {
    sql += " AND employmentType LIKE ?";
    countSql += " AND employmentType LIKE ?";
    params.push(`%${employmentType}%`);
    countParams.push(`%${employmentType}%`);
  }

  if (postedWithin === "week") {
    sql += " AND postedAt >= datetime('now', '-7 days')";
    countSql += " AND postedAt >= datetime('now', '-7 days')";
  } else if (postedWithin === "month") {
    sql += " AND postedAt >= datetime('now', '-30 days')";
    countSql += " AND postedAt >= datetime('now', '-30 days')";
  }

  sql += " ORDER BY postedAt DESC LIMIT ? OFFSET ?";
  params.push(limit, offset);

  // Get total count for pagination
  db.get(countSql, countParams, (err, countResult) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Database error", error: err.message });
    }
    const totalJobs = countResult.count;
    const totalPages = Math.ceil(totalJobs / limit);

    db.all(sql, params, (err, rows) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Database error", error: err.message });
      }

      if (rows.length === 0) {
        return res.status(404).json({ message: "No jobs found" });
      }

      res.status(200).json({
        jobs: rows,
        page,
        totalPages,
        totalJobs,
      });
    });
  });
});

// Route to get a specific job posting by ID
router.get("/:id", authenticate, (req, res) => {
  const jobId = req.params.id;
  const sql = "SELECT * FROM jobs WHERE id = ?";
  db.get(sql, [jobId], (err, row) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Database error", error: err.message });
    }
    if (!row) {
      return res.status(404).json({ message: "Job not found" });
    }
    res.status(200).json(row);
  });
});

export default router;
