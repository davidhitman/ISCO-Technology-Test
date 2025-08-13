import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import Button from "./ui/Button.jsx";

export default function MyApplications({ token }) {
  const [data, setData] = useState({
    applications: [],
    page: 1,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchMine = async (page = 1) => {
    setLoading(true);
    setError("");
    try {
      const payload = await api(
        `/api/applications/mine?page=${page}&limit=10`,
        { token }
      );
      setData({
        applications: payload.applications || [],
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
    fetchMine(1);
  }, []);

  return (
    <div className="card">
      <h2>My Applications</h2>
      {loading && <div>Loading…</div>}
      {error && <div className="error">{error}</div>}
      <div className="list">
        {data.applications.map((a) => (
          <div key={a.id} className="list-item">
            <div>
              <div>
                <strong>{a.title}</strong> — {a.company}
              </div>
              <div className="small">
                {a.location} • Status: <code>{a.status}</code>
              </div>
              <a
                href={a.cvLink}
                target="_blank"
                rel="noreferrer"
                className="small"
              >
                CV
              </a>
            </div>
          </div>
        ))}
      </div>
      <div className="pagination">
        <Button
          onClick={() => fetchMine(Math.max(1, data.page - 1))}
          disabled={data.page <= 1}
        >
          Prev
        </Button>
        <span className="small">
          Page {data.page} / {data.totalPages}
        </span>
        <Button
          onClick={() => fetchMine(Math.min(data.totalPages, data.page + 1))}
          disabled={data.page >= data.totalPages}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
