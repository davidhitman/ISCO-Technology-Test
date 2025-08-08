// This file contains middleware for authentication and authorization using JWT tokens.
// It exports two functions: authenticate and authorizeRole.
// The authenticate function checks if the request has a valid JWT token in the Authorization header.
// The authorizeRole function checks if the user has the required role to access a specific route.
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;

function authenticate(req, res, next) {
  const token = req.headers["authorization"]?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Access denied" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ message: "Invalid token" });
    req.user = user;
    next();
  });
}

function authorizeRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role)
      return res.status(403).json({ message: "Access denied" });
    next();
  };
}

export { authenticate, authorizeRole };
