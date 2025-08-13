import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import Button from "./ui/Button.jsx";

export default function JobsList({ onOpenJob }) {
  const [filters, setFilters] = useState({
    page: 1,
    title: "",
    location: "",
    employmentType: "",
    postedWithin: "",
  });
  const [data, setData] = useState({ jobs: [], page: 1, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchJobs = async () => {
    setLoading(true);
    setError("");
    try {
      let payload;
      if (
        filters.title ||
        filters.location ||
        filters.employmentType ||
        filters.postedWithin
      ) {
        const q = new URLSearchParams();
        if (filters.title) q.set("title", filters.title);
        if (filters.location) q.set("location", filters.location);
        if (filters.employmentType)
          q.set("employmentType", filters.employmentType);
        if (filters.postedWithin) q.set("postedWithin", filters.postedWithin);
        q.set("page", filters.page);
        q.set("limit", 10);
        payload = await api(`/api/jobs/filter?${q.toString()}`);
      } else {
        payload = await api(`/api/jobs?page=${filters.page}&limit=10`);
      }
      setData({
        jobs: payload.jobs || [],
        page: payload.page || 1,
        totalPages: payload.totalPages || 1,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchJobs();
  }, [
    filters.page,
    filters.title,
    filters.location,
    filters.employmentType,
    filters.postedWithin,
  ]);

  return (
    <div className="card">
      <h2>Job Board</h2>

      <div className="controls">
        <input
          className="input"
          placeholder="Title"
          value={filters.title}
          onChange={(e) =>
            setFilters((f) => ({ ...f, title: e.target.value, page: 1 }))
          }
        />
        <input
          className="input"
          placeholder="Location"
          value={filters.location}
          onChange={(e) =>
            setFilters((f) => ({ ...f, location: e.target.value, page: 1 }))
          }
        />
        <select
          value={filters.employmentType}
          onChange={(e) =>
            setFilters((f) => ({
              ...f,
              employmentType: e.target.value,
              page: 1,
            }))
          }
        >
          <option value="">All types</option>
          <option>Full-time</option>
          <option>Part-time</option>
          <option>Contract</option>
          <option>Internship</option>
        </select>
        <select
          value={filters.postedWithin}
          onChange={(e) =>
            setFilters((f) => ({ ...f, postedWithin: e.target.value, page: 1 }))
          }
        >
          <option value="">Any time</option>
          <option value="week">Last 7 days</option>
          <option value="month">Last 30 days</option>
        </select>
      </div>

      {loading && <div>Loading…</div>}
      {error && <div className="error">{error}</div>}

      <div className="list">
        {data.jobs.map((j) => (
          <div key={j.id} className="list-item">
            <div>
              <div>
                <strong>{j.title}</strong>
              </div>
              <div className="small">
                {j.company} — {j.location} — {j.employmentType}
              </div>
            </div>
            <Button onClick={() => onOpenJob(j.id)}>View</Button>
          </div>
        ))}
      </div>

      <div className="pagination">
        <Button
          onClick={() =>
            setFilters((f) => ({ ...f, page: Math.max(1, f.page - 1) }))
          }
          disabled={data.page <= 1}
        >
          Prev
        </Button>
        <span className="small">
          Page {data.page} / {data.totalPages}
        </span>
        <Button
          onClick={() =>
            setFilters((f) => ({
              ...f,
              page: Math.min(data.totalPages, f.page + 1),
            }))
          }
          disabled={data.page >= data.totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
