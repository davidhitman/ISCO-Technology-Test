import request from "supertest";
import app from "../index.js";
import db from "../database/database.js";

// Ensure the users table exists
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

describe("Auth Endpoints", () => {
  // User SignUp test
  test("User SignUp → 201", async () => {
    const res = await request(app).post("/api/auth/register").send({
      fullName: "Test User",
      username: "testuser",
      email: "test@user.com",
      password: "Passw0rd!",
      confirmPassword: "Passw0rd!",
      phoneNumber: "1234567890",
    });
    expect(res.status).toBe(201);
    expect(res.body.message).toMatch(/registered/i);
  });

  // User Login test
  test("User Login → 200 + token", async () => {
    const res = await request(app).post("/api/auth/login").send({
      username: "testuser",
      password: "Passw0rd!",
    });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
  });
});
