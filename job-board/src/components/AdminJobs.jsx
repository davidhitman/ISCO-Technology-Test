import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import TextInput from "./ui/TextInput.jsx";
import TextArea from "./ui/TextArea.jsx";
import Button from "./ui/Button.jsx";
import AdminApplications from "./AdminApplication.jsx";

export default function AdminJobs({ token }) {
  const [form, setForm] = useState({
    title: "",
    company: "",
    location: "",
    employmentType: "Full-time",
    description: "",
  });
  const [list, setList] = useState([]);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const load = async () => {
    try {
      const data = await api("/api/jobs?page=1&limit=50");
      setList(data.jobs || []);
    } catch (e) {
      setError(String(e.message || e));
    }
  };
  useEffect(() => {
    load();
  }, []);

  const createJob = async (e) => {
    e.preventDefault();
    setMessage("");
    setError("");
    try {
      await api("/api/jobs", { method: "POST", token, body: form });
      setMessage("Job created");
      setForm({
        title: "",
        company: "",
        location: "",
        employmentType: "Full-time",
        description: "",
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const updateJob = async (job) => {
    const payload = {
      title: job.title,
      company: job.company,
      location: job.location,
      employmentType: job.employmentType,
      description: job.description,
    };
    try {
      await api(`/api/jobs/${job.id}`, { method: "PUT", token, body: payload });
      setMessage("Job updated");
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const deleteJob = async (id) => {
    try {
      await api(`/api/jobs/${id}`, { method: "DELETE", token });
      setMessage("Job deleted");
      setList((arr) => arr.filter((job) => job.id !== id));
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div className="card">
      <h2>Admin — Manage Jobs</h2>
      {message && (
        <div style={{ color: "#065f46", fontSize: 14 }}>{message}</div>
      )}
      {error && <div className="error">{error}</div>}

      <form onSubmit={createJob} className="card" style={{ marginTop: 12 }}>
        <div className="form-grid">
          <TextInput
            label="Title"
            value={form.title}
            onChange={(v) => setForm((f) => ({ ...f, title: v }))}
            required
          />
          <TextInput
            label="Company"
            value={form.company}
            onChange={(v) => setForm((f) => ({ ...f, company: v }))}
            required
          />
          <TextInput
            label="Location"
            value={form.location}
            onChange={(v) => setForm((f) => ({ ...f, location: v }))}
            required
          />
          <div>
            <label className="label">
              <span className="label-text">Employment Type</span>
              <select
                className="input"
                value={form.employmentType}
                onChange={(e) =>
                  setForm((f) => ({ ...f, employmentType: e.target.value }))
                }
              >
                <option>Full-time</option>
                <option>Part-time</option>
                <option>Contract</option>
                <option>Internship</option>
              </select>
            </label>
          </div>
          <div style={{ gridColumn: "1 / -1" }}>
            <TextArea
              label="Description"
              value={form.description}
              onChange={(v) => setForm((f) => ({ ...f, description: v }))}
              required
            />
          </div>
        </div>
        <Button type="submit">Create Job</Button>
      </form>

      <h3 style={{ marginTop: 16 }}>Update Existing Jobs</h3>
      <div className="list">
        {list.map((j) => (
          <div key={j.id} className="card">
            <div className="form-grid">
              <TextInput
                label="Title"
                value={j.title}
                onChange={(v) =>
                  setList((arr) =>
                    arr.map((x) => (x.id === j.id ? { ...x, title: v } : x))
                  )
                }
              />
              <TextInput
                label="Company"
                value={j.company}
                onChange={(v) =>
                  setList((arr) =>
                    arr.map((x) => (x.id === j.id ? { ...x, company: v } : x))
                  )
                }
              />
              <TextInput
                label="Location"
                value={j.location}
                onChange={(v) =>
                  setList((arr) =>
                    arr.map((x) => (x.id === j.id ? { ...x, location: v } : x))
                  )
                }
              />

              <div>
                <label className="label">
                  <span className="label-text">Employment Type</span>
                  <select
                    className="input"
                    value={j.employmentType}
                    onChange={(e) =>
                      setList((arr) =>
                        arr.map((x) =>
                          x.id === j.id
                            ? { ...x, employmentType: e.target.value }
                            : x
                        )
                      )
                    }
                  >
                    <option>Full-time</option>
                    <option>Part-time</option>
                    <option>Contract</option>
                    <option>Internship</option>
                  </select>
                </label>
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <TextArea
                  label="Description"
                  value={j.description}
                  onChange={(v) =>
                    setList((arr) =>
                      arr.map((x) =>
                        x.id === j.id ? { ...x, description: v } : x
                      )
                    )
                  }
                />
              </div>
            </div>
            <div className="row" style={{ marginTop: 8 }}>
              <Button onClick={() => updateJob(j)}>Save</Button>
              <Button onClick={() => deleteJob(j.id)}>Delete</Button>
              <AdminApplications token={token} jobId={j.id} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
