import React, { useState } from "react";
import { api } from "../lib/api.js";
import Button from "./ui/Button.jsx";

export default function AdminApplications({ token, jobId }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [apps, setApps] = useState([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [count, setCount] = useState(null);

  const load = async (p = 1) => {
    setLoading(true);
    setError("");
    try {
      const list = await api(
        `/api/applications/job/${jobId}?page=${p}&limit=10`,
        { token }
      );
      setApps(list.applications || []);
      setPage(list.page || 1);
      setTotalPages(list.totalPages || 1);
      const ct = await api(`/api/applications/count/${jobId}`, { token });
      setCount(ct.totalApplication);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await api(`/api/applications/${id}/status`, {
        method: "PUT",
        token,
        body: { status },
      });
      await load(page);
    } catch (e) {
      setError(e.message);
    }
  };

  return (
    <div>
      <Button
        onClick={() => {
          setOpen((o) => !o);
          if (!open) load(1);
        }}
      >
        {open ? "Hide" : "View Applications"}
        {count != null ? ` (${count})` : ""}
      </Button>
      {open && (
        <div className="card" style={{ marginTop: 8 }}>
          {loading && <div>Loading…</div>}
          {error && <div className="error">{error}</div>}
          <div className="list">
            {apps.map((a) => (
              <div key={a.id} className="card">
                <div>
                  <strong>{a.fullName || a.applicantUsername}</strong> —{" "}
                  {a.username}
                </div>
                <div className="small">
                  Status: <code>{a.status}</code>
                </div>
                <a
                  href={a.cvLink}
                  target="_blank"
                  rel="noreferrer"
                  className="small"
                >
                  CV
                </a>
                <div className="row" style={{ marginTop: 8 }}>
                  {["applied", "interviewed", "accepted", "rejected"].map(
                    (s) => (
                      <Button key={s} onClick={() => updateStatus(a.id, s)}>
                        {s}
                      </Button>
                    )
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="pagination">
            <Button
              onClick={() => load(Math.max(1, page - 1))}
              disabled={page <= 1}
            >
              Prev
            </Button>
            <span className="small">
              Page {page} / {totalPages}
            </span>
            <Button
              onClick={() => load(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
