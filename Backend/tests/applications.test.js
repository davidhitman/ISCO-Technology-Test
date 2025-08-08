// test for the applications endpoints
import request from "supertest";
import app from "../index.js";
import db from "../database/database.js";

// create a mock table users
async function ensureTables() {
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

  // create a mock table applications
  await new Promise((resolve, reject) => {
    db.run(
      `CREATE TABLE IF NOT EXISTS applications (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        jobId INTEGER,
        userId INTEGER,
        coverLetter TEXT,
        cvLink TEXT,
        status TEXT DEFAULT 'pending',
        appliedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (jobId) REFERENCES jobs(id) ON DELETE CASCADE,
        FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
      )`,
      (err) => (err ? reject(err) : resolve())
    );
  });
}

// register a user and return the token and userId
async function getUserTokenAndId() {
  await request(app).post("/api/auth/register").send({
    fullName: "Applicant User",
    username: "applicant",
    email: "applicant@user.com",
    password: "userpass",
    confirmPassword: "userpass",
    phoneNumber: "1111111111",
  });

  const loginRes = await request(app).post("/api/auth/login").send({
    username: "applicant",
    password: "userpass",
  });

  const userRow = await new Promise((resolve, reject) => {
    db.get("SELECT id FROM users WHERE username = 'applicant'", (err, row) =>
      err ? reject(err) : resolve(row)
    );
  });

  return { token: loginRes.body.token, userId: userRow.id };
}

// create a job for testing and return the job id
async function createJob(adminToken) {
  await request(app)
    .post("/api/jobs")
    .set("Authorization", `Bearer ${adminToken}`)
    .send({
      title: "Application Test Job",
      company: "AppTest Co",
      location: "Remote",
      employmentType: "Full-time",
      description: "Job for application endpoint tests.",
    });

  const jobRow = await new Promise((resolve, reject) => {
    db.get(
      "SELECT id FROM jobs WHERE title = 'Application Test Job'",
      (err, row) => (err ? reject(err) : resolve(row))
    );
  });

  return jobRow.id;
}

// get Admin token to be used on endpoints with admin access
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

  await new Promise((resolve, reject) => {
    db.run("UPDATE users SET role = 'admin' WHERE username = 'admin'", (err) =>
      err ? reject(err) : resolve()
    );
  });

  const res = await request(app).post("/api/auth/login").send({
    username: "admin",
    password: "admin123",
  });

  return res.body.token;
}

// reset the database before each test
beforeAll(async () => {
  await ensureTables();
  await new Promise((resolve, reject) => {
    db.run("DELETE FROM applications", (err) =>
      err ? reject(err) : resolve()
    );
  });
  await new Promise((resolve, reject) => {
    db.run("DELETE FROM jobs", (err) => (err ? reject(err) : resolve()));
  });
  await new Promise((resolve, reject) => {
    db.run("DELETE FROM users", (err) => (err ? reject(err) : resolve()));
  });
});

afterAll((done) => {
  db.close(done);
});

describe("Application Endpoints", () => {
  let userToken, userId, adminToken, jobId, applicationId;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    ({ token: userToken, userId } = await getUserTokenAndId());
    jobId = await createJob(adminToken);
  });

  // User can apply for a job
  test("User can apply for a job → 201", async () => {
    const res = await request(app)
      .post(`/api/applications/${jobId}`)
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        coverLetter: "I am a great fit.",
        cvLink: "http://example.com/cv.pdf",
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/appl/i);

    const appRow = await new Promise((resolve, reject) => {
      db.get(
        "SELECT id FROM applications WHERE userId = ? AND jobId = ?",
        [userId, jobId],
        (err, row) => (err ? reject(err) : resolve(row))
      );
    });
    applicationId = appRow.id;
  });

  // Admin can view all applications
  test("Admin can view all applications → 200", async () => {
    const res = await request(app)
      .get("/api/applications")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.applications)).toBe(true);
    expect(res.body.applications.length).toBeGreaterThan(0);
  });

  // Admin can update application status
  test("Admin can update application status → 200", async () => {
    const res = await request(app)
      .put(`/api/applications/${applicationId}/status`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({ status: "accepted" });

    expect(res.status).toBe(200);
    expect(res.body.message).toMatch(/updated/i);
  });
});
