import React, { useState, useEffect } from "react";
import { Routes, Route, Link, useNavigate } from "react-router-dom";
import useAuth from "./hooks/useAuth.jsx";
import JobsList from "./components/JobsList.jsx";
import JobDetail from "./components/JobDetails.jsx";
import MyApplications from "./components/MyApplications.jsx";
import AdminJobs from "./components/AdminJobs.jsx";
import AccountPanel from "./components/AccountPanel.jsx";
import Button from "./components/ui/Button.jsx";

export default function App() {
  const { user, token, role, logout } = useAuth();
  const [openJobId, setOpenJobId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) setOpenJobId(null);
  }, [user]);

  return (
    <div className="page">
      <header className="header">
        <div className="container header-inner">
          <div className="brand">ISCO Job Board</div>
          <nav className="nav">
            <Link className="link" to="/">
              Home
            </Link>
            {user && (
              <Link className="link" to="/mine">
                My Applications
              </Link>
            )}
            {role === "admin" && (
              <Link className="link" to="/admin">
                Admin
              </Link>
            )}
            {user ? (
              <>
                <Link className="link" to="/account">
                  Account
                </Link>
                <Button onClick={logout}>Logout</Button>
              </>
            ) : (
              <Link className="link" to="/auth">
                Login / Register
              </Link>
            )}
          </nav>
        </div>
      </header>

      <main className="container">
        <Routes>
          <Route
            index
            element={
              openJobId ? (
                user ? (
                  <JobDetail
                    token={token}
                    jobId={openJobId}
                    onBack={() => setOpenJobId(null)}
                  />
                ) : (
                  <div className="card">
                    <p>Please login to view job details and apply.</p>
                  </div>
                )
              ) : (
                <JobsList onOpenJob={(id) => setOpenJobId(id)} />
              )
            }
          />

          <Route
            path="/auth"
            element={<AuthPage onDone={() => navigate("/")} />}
          />
          <Route
            path="/mine"
            element={
              <RequireAuth user={user}>
                <MyApplications token={token} />
              </RequireAuth>
            }
          />
          <Route
            path="/admin"
            element={
              <RequireAdmin role={role}>
                <AdminJobs token={token} />
              </RequireAdmin>
            }
          />
          <Route
            path="/account"
            element={
              <RequireAuth user={user}>
                <AccountPanel token={token} user={user} logout={logout} />
              </RequireAuth>
            }
          />
        </Routes>
      </main>
    </div>
  );
}

function RequireAuth({ user, children }) {
  if (!user)
    return (
      <div className="card">
        <p>Please login first.</p>
      </div>
    );
  return children;
}

function RequireAdmin({ role, children }) {
  if (role !== "admin")
    return (
      <div className="card">
        <p>Access to only admin</p>
      </div>
    );
  return children;
}

function AuthPage({ onDone }) {
  const { login, register } = useAuth();
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const submitLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(username, password);
      onDone?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await register({
        fullName,
        username,
        email,
        password,
        confirmPassword,
        phoneNumber,
      });
      await login(username, password);
      onDone?.();
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth">
      <div className="tabbar">
        <button
          className={mode === "login" ? "tab active" : "tab"}
          onClick={() => setMode("login")}
        >
          Login
        </button>
        <button
          className={mode === "register" ? "tab active" : "tab"}
          onClick={() => setMode("register")}
        >
          Register
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      {mode === "login" ? (
        <form onSubmit={submitLogin} className="form-grid">
          <Input
            label="Username"
            value={username}
            onChange={setUsername}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            required
          />
          <div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Logging in…" : "Login"}
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={submitRegister} className="form-grid">
          <Input
            label="Full name"
            value={fullName}
            onChange={setFullName}
            required
          />
          <Input
            label="Username"
            value={username}
            onChange={setUsername}
            required
          />
          <Input label="Email" value={email} onChange={setEmail} required />
          <Input
            label="Phone number"
            value={phoneNumber}
            onChange={setPhoneNumber}
            required
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={setPassword}
            required
          />
          <Input
            label="Confirm password"
            type="password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            required
          />
          <div>
            <button className="btn" type="submit" disabled={loading}>
              {loading ? "Creating…" : "Create account"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

function Input({ label, value, onChange, type = "text", required }) {
  return (
    <label className="label">
      <span className="label-text">{label}</span>
      <input
        className="input"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type={type}
        required={required}
      />
    </label>
  );
}
