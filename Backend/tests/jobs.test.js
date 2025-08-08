import request from "supertest";
import app from "../index.js";
import db from "../database/database.js";

async function ensureJobsTable() {
  // create a mock table jobs
  await new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS jobs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        company TEXT,
        location TEXT,
        employmentType TEXT,
        description TEXT,
        postedAt DATETIME DEFAULT CURRENT_TIMESTAMP
      )`,
      (err) => (err ? reject(err) : resolve())
    );
  });
}

// create a mock table users
async function ensureUsersTable() {
  await new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE,
        email TEXT UNIQUE,
        password TEXT,
        fullName TEXT,
        role TEXT DEFAULT 'user',
        phoneNumber TEXT
      )`,
      (err) => (err ? reject(err) : resolve())
    );
  });
}

// register admin user and return the token
async function getAdminToken() {
  await new Promise((resolve, reject) => {
    db.run("DELETE FROM users WHERE username = 'admin'", (err) =>
      err ? reject(err) : resolve()
    );
  });

  await request(app).post("/api/auth/register").send({
    fullName: "Admin User",
    username: "admin",
    email: "admin@admin.com",
    password: "admin123",
    confirmPassword: "admin123",
    phoneNumber: "0000000000",
    role: "admin",
  });

  // Promote to admin if your register route doesn't allow role
  await new Promise((resolve, reject) => {
    db.run("UPDATE users SET role = 'admin' WHERE username = 'admin'", (err) =>
      err ? reject(err) : resolve()
    );
  });

  // Login as admin
  const res = await request(app).post("/api/auth/login").send({
    username: "admin",
    password: "admin123",
  });
  return res.body.token;
}

// Reset the database before each test
beforeAll(async () => {
  await ensureJobsTable();
  await ensureUsersTable();
  await new Promise((resolve, reject) => {
    db.run("DELETE FROM jobs", (err) => (err ? reject(err) : resolve()));
  });
});

afterAll((done) => {
  db.close(done);
});

describe("Jobs Endpoints", () => {
  let adminToken = "";

  beforeAll(async () => {
    adminToken = await getAdminToken();
  });

  // Admin can create a job posting
  test("Admin can create a job posting → 201", async () => {
    const res = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Software Engineer",
        company: "Tech Corp",
        location: "Remote",
        employmentType: "Full-time",
        description: "Develop and maintain software.",
      });
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/created/i);
  });

  // Admin can get all job postings with pagination
  test("Get all job postings with pagination → 200", async () => {
    const res = await request(app).get("/api/jobs?page=1&limit=10");
    expect(res.status).toBe(200);
    expect(
      Array.isArray(res.body.jobs) ||
        Array.isArray(res.body.data) ||
        Array.isArray(res.body)
    ).toBe(true);
  });

  // Admin can get a single job posting
  test("Get a single job posting → 200", async () => {
    // Ensure at least one job exists
    const createRes = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Single Job Test",
        company: "Test Co",
        location: "Remote",
        employmentType: "Full-time",
        description: "Test job for single fetch.",
      });
    expect(createRes.status).toBe(201);

    // Get the first job's ID
    const jobsRes = await request(app).get("/api/jobs");
    const jobId =
      jobsRes.body.jobs?.[0]?.id ||
      jobsRes.body.data?.[0]?.id ||
      jobsRes.body[0]?.id;
    expect(jobId).toBeDefined();

    const res = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.id).toBe(jobId);
  });

  // Admin can update a job posting
  test("Admin can update a job posting → 200", async () => {
    // Ensure at least one job exists before updating
    const createRes = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Job To Update",
        company: "Update Co",
        location: "Remote",
        employmentType: "Full-time",
        description: "Job for update test.",
      });
    expect(createRes.status).toBe(201);

    // Get the first job's ID
    const jobsRes = await request(app).get("/api/jobs");
    const jobId =
      jobsRes.body.jobs?.[0]?.id ||
      jobsRes.body.data?.[0]?.id ||
      jobsRes.body[0]?.id;
    expect(jobId).toBeDefined();

    // Fetch the existing job details to ensure all required fields are sent
    const jobDetailsRes = await request(app)
      .get(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(jobDetailsRes.status).toBe(200);

    const existingJob = jobDetailsRes.body;

    const res = await request(app)
      .put(`/api/jobs/${jobId}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Updated Software Engineer",
        company: existingJob.company,
        location: existingJob.location,
        employmentType: existingJob.employmentType,
        description: existingJob.description,
      });
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });

  // Admin can delete a job posting
  test("Admin can delete a job posting → 200", async () => {
    // Create a new job to delete
    const createRes = await request(app)
      .post("/api/jobs")
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        title: "Temp Job",
        company: "Temp Co",
        location: "Remote",
        employmentType: "Contract",
        description: "Temporary job.",
      });
    expect(createRes.status).toBe(201);

    // Get the job's ID
    const jobsRes = await request(app).get("/api/jobs");
    const job =
      jobsRes.body.jobs?.find((j) => j.title === "Temp Job") ||
      jobsRes.body.data?.find((j) => j.title === "Temp Job") ||
      jobsRes.body.find((j) => j.title === "Temp Job");
    expect(job).toBeDefined();

    // Delete the job
    const res = await request(app)
      .delete(`/api/jobs/${job.id}`)
      .set("Authorization", `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/deleted/i);
  });
});
