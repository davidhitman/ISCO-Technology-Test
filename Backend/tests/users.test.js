import request from "supertest";
import app from "../index.js";
import db from "../database/database.js";

// create mock table users
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

// register a user and return the token and userId
async function getUserToken() {
  await new Promise((resolve, reject) => {
    db.run("DELETE FROM users WHERE username = 'normaluser'", (err) =>
      err ? reject(err) : resolve()
    );
  });

  await request(app).post("/api/auth/register").send({
    fullName: "Normal User",
    username: "normaluser",
    email: "normal@user.com",
    password: "userpass",
    confirmPassword: "userpass",
    phoneNumber: "1234567890",
  });

  const res = await request(app).post("/api/auth/login").send({
    username: "normaluser",
    password: "userpass",
  });

  return res.body.token;
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
    password: "adminpass",
    confirmPassword: "adminpass",
    phoneNumber: "0000000000",
  });

  await new Promise((resolve, reject) => {
    db.run("UPDATE users SET role = 'admin' WHERE username = 'admin'", (err) =>
      err ? reject(err) : resolve()
    );
  });

  const res = await request(app).post("/api/auth/login").send({
    username: "admin",
    password: "adminpass",
  });

  return res.body.token;
}

// Reset the users table before each test
beforeAll(async () => {
  await ensureUsersTable();
  await new Promise((resolve, reject) => {
    db.run("DELETE FROM users", (err) => (err ? reject(err) : resolve()));
  });
});

afterAll((done) => {
  db.close(done);
});

describe("Users Endpoints", () => {
  let userToken;
  let adminToken;

  beforeAll(async () => {
    adminToken = await getAdminToken();
    userToken = await getUserToken();
  });

  // user can update their own profile
  test("User can update their own profile → 200", async () => {
    const res = await request(app)
      .put("/api/users/me")
      .set("Authorization", `Bearer ${userToken}`)
      .send({
        fullName: "Updated Normal User",
        phoneNumber: "9876543210",
      });

    expect([200, 204]).toContain(res.status);

    if (res.status === 200 && res.body && typeof res.body === "object") {
      const msg = String(res.body.message || "").toLowerCase();
      expect(msg.includes("update")).toBe(true);
    }
  });

  // admin can view all users
  test("Admin can get all users → 200", async () => {
    const res = await request(app)
      .get("/api/users")
      .set("Authorization", `Bearer ${adminToken}`);

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.users)).toBe(true);
  });
});
