import express, { json } from "express";
import authRoutes from "./routes/auth.js";
import jobsRoutes from "./routes/jobs.js";
import applicationsRoutes from "./routes/applications.js";
import usersRoutes from "./routes/users.js";
import dotenv from "dotenv";
dotenv.config();
import cors from "cors";

const app = express();
app.use(cors());
app.use(json());

app.use("/api/auth", authRoutes);
app.use("/api/jobs", jobsRoutes);
app.use("/api/applications", applicationsRoutes);
app.use("/api/users", usersRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app; // Export the app for testing purposes
// This allows the app to be imported in test files without starting the server
// and is useful for unit testing or integration testing the API endpoints.
