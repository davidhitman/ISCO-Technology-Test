import React, { useState } from "react";
import { api } from "../lib/api.js";
import TextInput from "./ui/TextInput.jsx";
import Button from "./ui/Button.jsx";

export default function AccountPanel({ token, user, logout }) {
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [form, setForm] = useState({
    username: user?.username || "",
    email: "",
    fullName: "",
    password: "",
  });

  const save = async (e) => {
    e.preventDefault();
    setMsg("");
    setErr("");
    try {
      await api("/api/users/me", {
        method: "PUT",
        token,
        body: Object.fromEntries(Object.entries(form).filter(([_, v]) => v)),
      });
      setMsg("Profile updated");
    } catch (e) {
      setErr(e.message);
    }
  };

  const del = async () => {
    if (!confirm("Delete your account? This cannot be undone.")) return;
    try {
      await api("/api/users", { method: "DELETE", token });
      logout();
    } catch (e) {
      setErr(e.message);
    }
  };

  return (
    <div className="card">
      <h2>Account</h2>
      {msg && <div style={{ color: "#065f46", fontSize: 14 }}>{msg}</div>}
      {err && <div className="error">{err}</div>}
      <form onSubmit={save} className="form-grid">
        <TextInput
          label="Username"
          value={form.username}
          onChange={(v) => setForm((f) => ({ ...f, username: v }))}
        />
        <TextInput
          label="Email"
          value={form.email}
          onChange={(v) => setForm((f) => ({ ...f, email: v }))}
        />
        <TextInput
          label="Full name"
          value={form.fullName}
          onChange={(v) => setForm((f) => ({ ...f, fullName: v }))}
        />
        <TextInput
          label="New password"
          type="password"
          value={form.password}
          onChange={(v) => setForm((f) => ({ ...f, password: v }))}
        />
        <div style={{ gridColumn: "1 / -1" }} className="row">
          <Button type="submit">Save changes</Button>
          <Button onClick={del}>Delete account</Button>
        </div>
      </form>
    </div>
  );
}
