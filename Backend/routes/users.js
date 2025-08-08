import express from "express";
import db from "../database/database.js";
import bcrypt from "bcrypt";
import { authenticate, authorizeRole } from "../middleware/authMiddleware.js";

const router = express.Router();

// Route to delete a user account
router.delete("/", authenticate, (req, res) => {
  const userId = req.user.id;

  db.serialize(() => {
    db.run("BEGIN");

    // Delete user applications first
    db.run(
      "DELETE FROM applications WHERE userId = ?",
      [userId],
      function (appErr) {
        if (appErr) {
          db.run("ROLLBACK");
          return res.status(500).json({
            message: "Failed to delete user applications",
            error: appErr.message,
          });
        }

        // Delete the user
        db.run("DELETE FROM users WHERE id = ?", [userId], function (userErr) {
          if (userErr) {
            db.run("ROLLBACK");
            return res.status(500).json({
              message: "Failed to delete user",
              error: userErr.message,
            });
          }
          if (this.changes === 0) {
            db.run("ROLLBACK");
            return res.status(404).json({ message: "User not found" });
          }

          db.run("COMMIT");
          return res
            .status(200)
            .json({ message: "Your account has been deleted." });
        });
      }
    );
  });
});

// Route for Admin to delete any account

router.delete("/:userId", authenticate, authorizeRole("admin"), (req, res) => {
  const userId = req.params.userId;

  db.serialize(() => {
    db.run("BEGIN");

    // Delete user applications first
    db.run(
      "DELETE FROM applications WHERE userId = ?",
      [userId],
      function (appErr) {
        if (appErr) {
          db.run("ROLLBACK");
          return res.status(500).json({
            message: "Failed to delete user applications",
            error: appErr.message,
          });
        }

        // Delete the user
        db.run("DELETE FROM users WHERE id = ?", [userId], function (userErr) {
          if (userErr) {
            db.run("ROLLBACK");
            return res.status(500).json({
              message: "Failed to delete user",
              error: userErr.message,
            });
          }
          if (this.changes === 0) {
            db.run("ROLLBACK");
            return res.status(404).json({ message: "User not found" });
          }

          db.run("COMMIT");
          return res.status(200).json({ message: "User account deleted." });
        });
      }
    );
  });
});

// Route to get all users
router.get("/", authenticate, authorizeRole("admin"), (req, res) => {
  const page = parseInt(req.query.page) > 0 ? parseInt(req.query.page) : 1;
  const limit = parseInt(req.query.limit) > 0 ? parseInt(req.query.limit) : 10;
  const offset = (page - 1) * limit;

  db.get("SELECT COUNT(*) AS total FROM users", (countErr, countRow) => {
    if (countErr) {
      return res.status(500).json({
        message: "Failed to count users",
        error: countErr.message,
      });
    }
    const total = countRow.total;
    const totalPages = Math.ceil(total / limit);

    db.all(
      "SELECT id, username, email, role FROM users LIMIT ? OFFSET ?",
      [limit, offset],
      (err, users) => {
        if (err) {
          return res.status(500).json({
            message: "Failed to retrieve users",
            error: err.message,
          });
        }
        if (!users || users.length === 0) {
          return res.status(404).json({ message: "No users found" });
        }
        return res.status(200).json({
          page,
          limit,
          total,
          totalPages,
          users,
        });
      }
    );
  });
});

// Route  to update your own profile
router.put("/me", authenticate, async (req, res) => {
  const userId = req.user.id;
  const { username, email, fullName, password } = req.body;

  // Only update fields that are provided
  const fields = [];
  const params = [];

  if (username) {
    fields.push("username = ?");
    params.push(username);
  }
  if (email) {
    fields.push("email = ?");
    params.push(email);
  }
  if (fullName) {
    fields.push("fullName = ?");
    params.push(fullName);
  }
  if (password) {
    try {
      const hashedPassword = await bcrypt.hash(password, 10);
      fields.push("password = ?");
      params.push(hashedPassword);
    } catch (err) {
      return res.status(500).json({
        message: "Failed to hash password",
        error: err.message,
      });
    }
  }

  if (fields.length === 0) {
    return res.status(400).json({ message: "No fields provided for update" });
  }

  params.push(userId);

  const sql = `UPDATE users SET ${fields.join(", ")} WHERE id = ?`;

  db.run(sql, params, function (err) {
    if (err) {
      return res.status(500).json({
        message: "Failed to update profile",
        error: err.message,
      });
    }
    res.status(200).json({ message: "Profile updated successfully" });
  });
});

export default router;
