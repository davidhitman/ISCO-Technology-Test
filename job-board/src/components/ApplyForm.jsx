import React, { useState } from "react";
import { api } from "../lib/api.js";
import TextArea from "./ui/TextArea.jsx";
import TextInput from "./ui/TextInput.jsx";
import Button from "./ui/Button.jsx";

export default function ApplyForm({ token, jobId }) {
  const [coverLetter, setCoverLetter] = useState("");
  const [cvLink, setCvLink] = useState("");
  const [status, setStatus] = useState({ loading: false, ok: false, err: "" });

  const submit = async (e) => {
    e.preventDefault();
    setStatus({ loading: true, ok: false, err: "" });
    try {
      await api(`/api/applications/${jobId}`, {
        method: "POST",
        token,
        body: { coverLetter, cvLink },
      });
      setStatus({ loading: false, ok: true, err: "" });
      setCoverLetter("");
      setCvLink("");
    } catch (e) {
      setStatus({ loading: false, ok: false, err: e.message });
    }
  };

  return (
    <form onSubmit={submit} className="card" style={{ marginTop: 12 }}>
      <h3>Apply to this job</h3>
      {status.ok && (
        <div style={{ color: "#065f46", fontSize: 14 }}>
          Application submitted.
        </div>
      )}
      {status.err && <div className="error">{status.err}</div>}
      <TextArea
        label="Cover letter"
        value={coverLetter}
        onChange={setCoverLetter}
        required
      />
      <TextInput
        label="CV link"
        value={cvLink}
        onChange={setCvLink}
        required
        placeholder="https://…"
      />
      <Button type="submit" disabled={status.loading}>
        {status.loading ? "Sending…" : "Submit application"}
      </Button>
    </form>
  );
}
