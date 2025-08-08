import express from "express";
import db from "../database/database.js";
import { authenticate, authorizeRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route to apply for a job
router.post("/:jobId", authenticate, (req, res) => {
  const jobId = req.params.jobId;
  const userId = req.user.id;
  const { coverLetter, cvLink } = req.body;

  if (!coverLetter || !cvLink) {
    return res
      .status(400)
      .json({ message: "Cover letter and CV link are required." });
  }

  const sql = `
    INSERT INTO applications (jobId, userId, coverLetter, cvLink)
    VALUES (?, ?, ?, ?)
  `;

  db.run(sql, [jobId, userId, coverLetter, cvLink], function (err) {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to submit application", error: err.message });
    }

    res.status(201).json({ message: "Application submitted" });
  });
});

// rout to view my applications and the status of it with pagination

router.get("/mine", authenticate, (req, res) => {
  const userId = req.user.id;

  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Count total applications for pagination info
  const countSql = `
    SELECT COUNT(*) as count FROM applications WHERE userId = ?
  `;
  db.get(countSql, [userId], (err, countResult) => {
    if (err) {
      return res
        .status(500)
        .json({ message: "Failed to fetch applications", error: err.message });
    }
    const totalApplications = countResult.count;
    const totalPages = Math.ceil(totalApplications / limit);

    const sql = `
      SELECT a.*, j.title, j.company FROM applications a
      JOIN jobs j ON a.jobId = j.id
      WHERE a.userId = ?
      ORDER BY appliedAt DESC
      LIMIT ? OFFSET ?
    `;
    db.all(sql, [userId, limit, offset], (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to fetch applications",
          error: err.message,
        });
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: "No applications found" });
      }
      res.status(200).json({
        applications: rows,
        page,
        totalPages,
        totalApplications,
      });
    });
  });
});

// Route for admin to view all applications for a job with pagination
router.get("/job/:jobId", authenticate, authorizeRole("admin"), (req, res) => {
  const jobId = req.params.jobId;

  // Pagination parameters
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Count total applications for pagination info
  const countSql = `
    SELECT COUNT(*) as count FROM applications WHERE jobId = ?
  `;
  db.get(countSql, [jobId], (err, countResult) => {
    if (err) {
      return res.status(500).json({
        message: "Failed to fetch applications page",
        error: err.message,
      });
    }
    const totalApplications = countResult.count;
    const totalPages = Math.ceil(totalApplications / limit);

    const sql = `
      SELECT a.*, u.fullName, u.username FROM applications a
      JOIN users u ON a.userId = u.id
      WHERE a.jobId = ?
      ORDER BY a.appliedAt DESC
      LIMIT ? OFFSET ?
    `;
    db.all(sql, [jobId, limit, offset], (err, rows) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to fetch applications",
          error: err.message,
        });
      }
      if (!rows || rows.length === 0) {
        return res.status(404).json({ message: "No applications found" });
      }
      res.status(200).json({
        applications: rows,
        page,
        totalPages,
        totalApplications,
      });
    });
  });
});

// Route to view application count for a job
router.get(
  "/count/:jobId",
  authenticate,
  authorizeRole("admin"),
  (req, res) => {
    const jobId = req.params.jobId;

    const sql = `
    SELECT COUNT(*) as count FROM applications WHERE jobId = ?
  `;
    db.get(sql, [jobId], (err, result) => {
      if (err) {
        return res.status(500).json({
          message: "Failed to fetch application count",
          error: err.message,
        });
      }
      res.status(200).json({ jobId, totalApplication: result.count });
    });
  }
);

// Route to update the status of an application
router.put(
  "/:applicationId/status",
  authenticate,
  authorizeRole("admin"),
  (req, res) => {
    const applicationId = req.params.applicationId;
    const { status } = req.body;
    const validStatuses = ["applied", "accepted", "rejected", "interviewed"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        message:
          "Invalid status. Valid statuses are: applied, accepted, rejected, interviewed.",
      });
    }

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const sql = `
    UPDATE applications SET status = ? WHERE id = ?
  `;
    db.run(sql, [status, applicationId], function (err) {
      if (err) {
        return res.status(500).json({
          message: "Failed to update application status",
          error: err.message,
        });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Application not found" });
      }
      res
        .status(200)
        .json({ message: "Application status updated successfully" });
    });
  }
);

// Route to delete an application
router.delete(
  "/:applicationId",
  authenticate,
  authorizeRole("admin"),
  (req, res) => {
    const applicationId = req.params.applicationId;

    const sql = `
    DELETE FROM applications WHERE id = ?
  `;
    db.run(sql, [applicationId], function (err) {
      if (err) {
        return res.status(500).json({
          message: "Failed to delete application",
          error: err.message,
        });
      }
      if (this.changes === 0) {
        return res.status(404).json({ message: "Application not found" });
      }
      res.status(200).json({ message: "Application deleted successfully" });
    });
  }
);

// View all applications across the platform for admin
router.get("/", authenticate, authorizeRole("admin"), (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  db.get(
    "SELECT COUNT(*) as count FROM applications",
    [],
    (err, countResult) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Database error", error: err.message });
      }
      const totalApplications = countResult.count;
      const totalPages = Math.ceil(totalApplications / limit);

      const sql = `
      SELECT a.id, a.jobId, a.userId, a.coverLetter, a.cvLink, a.status, a.appliedAt,
             j.title AS jobTitle, j.company AS jobCompany, j.location AS jobLocation,
             u.username AS applicantUsername, u.email AS applicantEmail
      FROM applications a
      JOIN jobs j ON j.id = a.jobId
      JOIN users u ON u.id = a.userId
      ORDER BY a.appliedAt DESC
      LIMIT ? OFFSET ?
    `;
      db.all(sql, [limit, offset], (err, rows) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Database error", error: err.message });
        }
        if (!rows || rows.length === 0) {
          return res.status(404).json({ message: "No applications found" });
        }
        res.status(200).json({
          applications: rows,
          page,
          totalPages,
          totalApplications,
        });
      });
    }
  );
});

// View all applications from a specific user
router.get(
  "/application/:userId",
  authenticate,
  authorizeRole("admin"),
  (req, res) => {
    const userId = req.params.userId;

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    db.get(
      "SELECT COUNT(*) as count FROM applications WHERE userId = ?",
      [userId],
      (err, countResult) => {
        if (err) {
          return res
            .status(500)
            .json({ message: "Database error", error: err.message });
        }
        const totalApplications = countResult.count;
        const totalPages = Math.ceil(totalApplications / limit);

        const sql = `
        SELECT a.id, a.jobId, a.userId, a.coverLetter, a.cvLink, a.status, a.appliedAt,
               j.title AS jobTitle, j.company AS jobCompany, j.location AS jobLocation
        FROM applications a
        JOIN jobs j ON j.id = a.jobId
        WHERE a.userId = ?
        ORDER BY a.appliedAt DESC
        LIMIT ? OFFSET ?
      `;
        db.all(sql, [userId, limit, offset], (err, rows) => {
          if (err) {
            return res
              .status(500)
              .json({ message: "Database error", error: err.message });
          }
          if (!rows || rows.length === 0) {
            return res
              .status(404)
              .json({ message: "No applications found for this user" });
          }
          res.status(200).json({
            applications: rows,
            page,
            totalPages,
            totalApplications,
          });
        });
      }
    );
  }
);

export default router;
