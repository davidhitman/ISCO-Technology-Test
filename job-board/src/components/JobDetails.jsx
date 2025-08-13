import React, { useEffect, useState } from "react";
import { api } from "../lib/api.js";
import Button from "./ui/Button.jsx";
import ApplyForm from "./ApplyForm.jsx";
import useAuth from "../hooks/useAuth.jsx";

export default function JobDetail({ jobId, onBack, token }) {
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const auth = useAuth();
  const userToken = token || auth.token;

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError("");
      try {
        const data = await api(`/api/jobs/${jobId}`, { token: userToken });
        setJob(data);
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [jobId, userToken]);

  return (
    <div className="card">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h2>Job Details</h2>
        <Button onClick={onBack}>Back</Button>
      </div>
      {loading && <div>Loading…</div>}
      {error && <div className="error">{error}</div>}
      {job && (
        <div>
          <div>
            <strong>{job.title}</strong>
          </div>
          <div className="small">
            {job.company} — {job.location} — {job.employmentType}
          </div>
          <p style={{ whiteSpace: "pre-wrap" }}>{job.description}</p>
          <ApplyForm jobId={job.id} token={userToken} />
        </div>
      )}
    </div>
  );
}
