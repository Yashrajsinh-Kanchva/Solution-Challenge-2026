"use client";

import { useState } from "react";
import { HeartHandshake, Loader2, CheckCircle2, UserCircle2, MapPin } from "lucide-react";
import { getCookie } from "@/lib/utils/cookies";

interface HelpPayload {
  title: string;
  category: string;
  description: string;
  summary: string;
  urgency: string;
  location: { lat: number; lng: number; area_name: string };
  beneficiaries: number;
  requestedBy: string;
  userId: string;
  requestType: "HELP";
}

export default function HelpForm() {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState({ lat: 0, lng: 0, area_name: "" });
  const [urgency, setUrgency] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle");
  const [errors, setErrors] = useState<Partial<Record<string, string>>>({});

  const validate = () => {
    const e: Partial<Record<string, string>> = {};
    if (!title.trim()) e.title = "Please provide a title.";
    if (!category) e.category = "Please select a category.";
    if (!description.trim()) e.description = "Please describe your need.";
    if (!location.area_name.trim()) e.location = "Please provide a location/address.";
    if (!urgency) e.urgency = "Please select urgency.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");

    const citizenId = getCookie("vb_citizen_id") || "mock-citizen-id";

    const payload: HelpPayload = {
      title: title.trim(),
      category,
      description: description.trim(),
      summary: description.trim().slice(0, 120),
      urgency,
      location,
      beneficiaries: 1, // Personal help usually defaults to 1
      requestedBy: anonymous ? "Anonymous User" : citizenId,
      userId: citizenId,
      requestType: "HELP",
    };

    try {
      const res = await fetch("/api/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to submit request");
      }
      setStatus("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrors({ submit: msg });
      setStatus("idle");
    }
  };

  if (status === "success") {
    return (
      <div style={successWrap}>
        <CheckCircle2 size={64} color="#2e7d32" style={{ marginBottom: "1rem" }} />
        <h3 style={{ fontSize: "1.5rem", color: "#1c1c18" }}>Request Received</h3>
        <p style={{ color: "#46483e", marginTop: "0.5rem" }}>
          Your personal help request has been sent successfully. Verified NGOs will contact you shortly.
        </p>
        <button style={{ ...btnPrimary, marginTop: "1.5rem" }} onClick={() => window.location.reload()}>
          Submit another request
        </button>
      </div>
    );
  }

  return (
    <div style={formWrap}>
      <form onSubmit={handleSubmit} style={form}>
        <div style={headerSection}>
          <HeartHandshake size={28} color="#59623c" />
          <div>
            <h2 style={formTitle}>Request Personal Help</h2>
            <p style={formSubtext}>This form is for individual needs, not public community issues.</p>
          </div>
        </div>

        {errors.submit && (
          <div style={errorBanner}>{errors.submit}</div>
        )}

        <div style={inputGroup}>
          <label style={label}>Need Category</label>
          <div style={radioGrid}>
            {["Medical", "Food", "Education", "Emergency", "Others"].map((cat) => (
              <label key={cat} style={category === cat ? radioLabelActive : radioLabel}>
                <input
                  type="radio"
                  name="category"
                  value={cat}
                  checked={category === cat}
                  onChange={(e) => setCategory(e.target.value)}
                  style={{ display: "none" }}
                />
                {cat}
              </label>
            ))}
          </div>
          {errors.category && <span style={errorText}>{errors.category}</span>}
        </div>

        <div style={inputGroup}>
          <label style={label}>Title / Short summary of your need</label>
          <input
            type="text"
            placeholder="e.g. Need medical supplies for grandmother"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={input}
          />
          {errors.title && <span style={errorText}>{errors.title}</span>}
        </div>

        <div style={inputGroup}>
          <label style={label}>Detailed Description</label>
          <textarea
            placeholder="Please explain your situation and exactly what kind of help you need..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            style={textarea}
          />
          {errors.description && <span style={errorText}>{errors.description}</span>}
        </div>

        <div style={inputGroup}>
          <label style={label}>Location / Address</label>
          <div style={locationInputWrap}>
            <MapPin size={18} color="#9ca3af" style={{ position: "absolute", left: "1rem", top: "50%", transform: "translateY(-50%)" }} />
            <input
              type="text"
              placeholder="Enter your exact address or area"
              value={location.area_name}
              onChange={(e) => setLocation({ ...location, area_name: e.target.value })}
              style={{ ...input, paddingLeft: "2.5rem" }}
            />
          </div>
          {errors.location && <span style={errorText}>{errors.location}</span>}
        </div>

        <div style={inputGroup}>
          <label style={label}>Urgency Level</label>
          <div style={radioGrid}>
            {[
              { id: "high", label: "Immediate" },
              { id: "medium", label: "Within 24 Hours" },
              { id: "low", label: "Can Wait a Few Days" }
            ].map((u) => (
              <label key={u.id} style={urgency === u.id ? radioLabelActive : radioLabel}>
                <input
                  type="radio"
                  name="urgency"
                  value={u.id}
                  checked={urgency === u.id}
                  onChange={(e) => setUrgency(e.target.value)}
                  style={{ display: "none" }}
                />
                {u.label}
              </label>
            ))}
          </div>
          {errors.urgency && <span style={errorText}>{errors.urgency}</span>}
        </div>

        <div style={inputGroup}>
          <label style={anonymousToggleLabel}>
            <input
              type="checkbox"
              checked={anonymous}
              onChange={(e) => setAnonymous(e.target.checked)}
              style={{ width: "1.2rem", height: "1.2rem", accentColor: "#59623c" }}
            />
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <UserCircle2 size={18} color="#59623c" />
              <span style={{ fontWeight: 600, color: "#1c1c18" }}>Submit Anonymously</span>
            </div>
          </label>
          <p style={{ fontSize: "0.75rem", color: "#6b7466", marginLeft: "1.7rem", marginTop: "0.2rem" }}>
            If checked, your name will be hidden from the public feed. Verified NGOs will still be able to contact you.
          </p>
        </div>

        <button type="submit" disabled={status === "submitting"} style={btnPrimary}>
          {status === "submitting" ? (
            <><Loader2 className="spin" size={18} /> Submitting Request...</>
          ) : "Submit Help Request"}
        </button>
      </form>
    </div>
  );
}

// --- Styles ---
const formWrap: React.CSSProperties = {
  background: "#fff",
  borderRadius: "16px",
  padding: "2rem",
  boxShadow: "0 10px 40px -15px rgba(89,98,60,0.1)",
  border: "2px solid rgba(204,214,166,0.6)",
  maxWidth: "700px",
  margin: "0 auto",
};

const headerSection: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "1rem",
  marginBottom: "2rem",
  paddingBottom: "1.5rem",
  borderBottom: "1px dashed #ccd6a6",
};

const formTitle: React.CSSProperties = {
  fontSize: "1.5rem",
  fontWeight: 800,
  color: "#1c1c18",
};

const formSubtext: React.CSSProperties = {
  fontSize: "0.85rem",
  color: "#5b21b6",
  fontWeight: 600,
  marginTop: "0.2rem",
  background: "#ede9fe",
  padding: "0.2rem 0.6rem",
  borderRadius: "6px",
  display: "inline-block",
};

const form: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "1.5rem",
};

const inputGroup: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "0.5rem",
};

const label: React.CSSProperties = {
  fontSize: "0.9rem",
  fontWeight: 700,
  color: "#1c1c18",
};

const input: React.CSSProperties = {
  width: "100%",
  padding: "0.85rem 1rem",
  borderRadius: "10px",
  border: "2px solid #e8edca",
  fontSize: "0.95rem",
  outline: "none",
  transition: "border-color 0.2s",
  background: "#fcfcfc",
};

const textarea: React.CSSProperties = {
  ...input,
  minHeight: "120px",
  resize: "vertical",
};

const locationInputWrap: React.CSSProperties = {
  position: "relative",
  width: "100%",
};

const radioGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: "0.5rem",
};

const radioLabel: React.CSSProperties = {
  padding: "0.8rem",
  borderRadius: "8px",
  border: "2px solid #e8edca",
  background: "#fff",
  textAlign: "center",
  cursor: "pointer",
  fontSize: "0.85rem",
  fontWeight: 600,
  color: "#46483e",
  transition: "all 0.2s",
};

const radioLabelActive: React.CSSProperties = {
  ...radioLabel,
  border: "2px solid #59623c",
  background: "#f0f4e4",
  color: "#59623c",
};

const anonymousToggleLabel: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.5rem",
  cursor: "pointer",
  padding: "1rem",
  background: "#fcfcfc",
  border: "2px dashed #e8edca",
  borderRadius: "10px",
};

const btnPrimary: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "0.5rem",
  padding: "1rem",
  background: "#59623c",
  color: "#fff",
  border: "none",
  borderRadius: "12px",
  fontSize: "1rem",
  fontWeight: 800,
  cursor: "pointer",
  transition: "all 0.2s",
  marginTop: "1rem",
  boxShadow: "0 8px 20px -10px rgba(89,98,60,0.5)",
};

const errorText: React.CSSProperties = {
  fontSize: "0.8rem",
  color: "#ba1a1a",
  fontWeight: 600,
};

const errorBanner: React.CSSProperties = {
  padding: "1rem",
  background: "#fef2f2",
  color: "#ba1a1a",
  borderRadius: "8px",
  border: "1px solid #fecaca",
  fontSize: "0.9rem",
  fontWeight: 600,
};

const successWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  textAlign: "center",
  padding: "4rem 2rem",
  background: "#fff",
  borderRadius: "16px",
  border: "2px solid #bbf7d0",
  boxShadow: "0 10px 40px -15px rgba(46,125,50,0.1)",
  maxWidth: "500px",
  margin: "0 auto",
};
