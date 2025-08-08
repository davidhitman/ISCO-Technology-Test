import express from "express";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import db from "../database/database.js";
import { authenticate, authorizeRole } from "../middleware/authMiddleware.js";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET;

/// LogIn route for the User and the Admin
// This route handles user login, verifies credentials, and returns a JWT token.
// It checks if the username and password are provided, validates them against the database,
// and generates a token if the credentials are correct. The token includes user details and is signed
// with a secret key. The token is set to expire in 5 hours.
// If the login fails, appropriate error messages are returned.
// If the user does not exist or the password is incorrect, a 401 status is returned.
// If the request is malformed or missing required fields, a 400 status is returned.

router.post("/login", async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res
      .status(400)
      .json({ message: "Username and password are required" });
  }

  try {
    db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
      async (err, user) => {
        if (err) {
          if (err.message.includes("no such table")) {
            return res
              .status(500)
              .json({ message: "Database error: users table does not exist" });
          } else {
            return res
              .status(500)
              .json({ message: "Database error", error: err.message });
          }
        }

        if (!user) {
          return res
            .status(401)
            .json({ message: "Invalid username or password" });
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
          return res
            .status(401)
            .json({ message: "Invalid username or password" });
        }

        const token = jwt.sign(
          { id: user.id, username: user.username, role: user.role },
          JWT_SECRET,
          { expiresIn: "5h" }
        );

        res.json({ token });
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "LogIn failed", error: error.message });
  }
});

/// registration of the User

router.post("/register", async (req, res) => {
  const { fullName, username, email, password, confirmPassword, phoneNumber } =
    req.body;
  const role = "user";

  if (
    !fullName ||
    !username ||
    !email ||
    !password ||
    !confirmPassword ||
    !phoneNumber
  ) {
    return res.status(400).json({ message: "All fields are required" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ message: "Passwords do not match" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  try {
    const sql =
      "INSERT INTO users (fullName, username, email, password, phoneNumber, role) VALUES (?, ?, ?, ?, ?, ?)";
    db.run(
      sql,
      [fullName, username, email, hashedPassword, phoneNumber, role],
      function (err) {
        if (err) {
          if (
            err.message.includes("UNIQUE") ||
            err.code === "SQLITE_CONSTRAINT"
          ) {
            return res
              .status(409)
              .json({ message: "Username or email already exists" });
          } else if (err.message.includes("no such table")) {
            return res
              .status(500)
              .json({ message: "Database error: users table does not exist" });
          } else {
            return res
              .status(500)
              .json({ message: "Registration failed", error: err.message });
          }
        }
        // Only send success if no error
        return res
          .status(201)
          .json({ message: "User registered successfully" });
      }
    );
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ message: "Registration failed", error: error.message });
  }
});

// register another admin
router.post(
  "/register-admin",
  authenticate,
  authorizeRole("admin"),
  async (req, res) => {
    const {
      fullName,
      username,
      email,
      password,
      confirmPassword,
      phoneNumber,
    } = req.body;
    const role = "admin";

    if (
      !fullName ||
      !username ||
      !email ||
      !password ||
      !confirmPassword ||
      !phoneNumber
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    try {
      const hashedPassword = await bcrypt.hash(password, 10);

      const sql = `
      INSERT INTO users (fullName, username, email, password, phoneNumber, role)
      VALUES (?, ?, ?, ?, ?, ?)
    `;

      db.run(
        sql,
        [fullName, username, email, hashedPassword, phoneNumber, role],
        function (err) {
          if (err) {
            if (err.message.includes("UNIQUE")) {
              return res
                .status(409)
                .json({ message: "Username or email already exists" });
            }
            return res
              .status(500)
              .json({ message: "Database error", error: err.message });
          }

          res.status(201).json({ message: "Admin user created" });
        }
      );
    } catch (error) {
      res
        .status(500)
        .json({ message: "Error creating admin", error: error.message });
    }
  }
);

export default router;
