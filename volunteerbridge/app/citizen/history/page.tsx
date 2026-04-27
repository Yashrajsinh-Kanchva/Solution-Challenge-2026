"use client";

import { useEffect, useState } from "react";
import { ClipboardList, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import ReportCard from "@/components/citizen/ReportCard";

type Report = {
  id: string;
  title: string;
  category: string;
  description: string;
  summary: string;
  urgency: string;
  location: { lat: number; lng: number; address: string };
  beneficiaries: number;
  status: "pending" | "in_progress" | "resolved" | string;
  createdAt: string;
};

const STATUS_FILTERS = ["all", "pending", "in_progress", "resolved"] as const;
type Filter = typeof STATUS_FILTERS[number];

const FILTER_LABELS: Record<Filter, string> = {
  all:         "All",
  pending:     "Pending",
  in_progress: "In Progress",
  resolved:    "Resolved",
};

export default function MyReportsPage() {
  const [reports,   setReports]   = useState<Report[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState("");
  const [filter,    setFilter]    = useState<Filter>("all");

  const fetchReports = () => {
    setLoading(true);
    setError("");
    fetch("/api/requests")
      .then(r => r.json())
      .then(data => {
        if (data.error) throw new Error(data.error);
        setReports(data.requests ?? []);
      })
      .catch(e => setError(e.message ?? "Failed to load requests"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchReports(); }, []);

  const filtered = filter === "all"
    ? reports
    : reports.filter(r => r.status === filter);

  /* ── Counts ── */
  const counts: Record<Filter, number> = {
    all:         reports.length,
    pending:     reports.filter(r => r.status === "pending").length,
    in_progress: reports.filter(r => r.status === "in_progress").length,
    resolved:    reports.filter(r => r.status === "resolved").length,
  };

  return (
    <div style={pageWrap}>

      {/* Header */}
      <div style={pageHeader}>
        <div>
          <span style={eyebrow}>Citizen Portal</span>
          <h2 style={heading}>My Reports</h2>
          <p style={subtext}>
            All issues you have submitted — fetched live from the database.
          </p>
        </div>
        <button onClick={fetchReports} style={refreshBtn} title="Refresh">
          <RefreshCw size={15} />
          Refresh
        </button>
      </div>

      {/* Stats row */}
      <div style={statsRow}>
        {(["all","pending","in_progress","resolved"] as Filter[]).map(s => (
          <div key={s} style={{
            ...statCard,
            borderColor: filter === s ? "#59623c" : "rgba(204,214,166,0.7)",
            background:  filter === s ? "#dce4b8" : "#fff",
          }}>
            <p style={{ fontSize:"1.6rem", fontWeight:900, color:"#1c1c18", lineHeight:1 }}>
              {counts[s]}
            </p>
            <p style={{ fontSize:"0.75rem", color:"#46483e", fontWeight:600, marginTop:"0.2rem" }}>
              {FILTER_LABELS[s]}
            </p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={tabRow}>
        {STATUS_FILTERS.map(s => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            style={{
              ...tabBtn,
              background:  filter === s ? "#fff" : "transparent",
              color:       filter === s ? "#59623c" : "#5a623f",
              fontWeight:  filter === s ? 700 : 500,
              boxShadow:   filter === s ? "0 4px 12px rgba(89,98,60,0.1)" : "none",
            }}
          >
            {FILTER_LABELS[s]}
            <span style={{
              ...tabBadge,
              background: filter === s ? "#ccd6a6" : "#dce4b8",
            }}>
              {counts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={loadingBox}>
          <Loader2 size={24} style={{ animation: "vb-spin 1s linear infinite" }} />
          <p>Loading your reports from database…</p>
        </div>
      ) : error ? (
        <div style={errorBox}>
          <AlertTriangle size={20} color="#ba1a1a" />
          <p>{error}</p>
          <button onClick={fetchReports} style={{ ...refreshBtn, marginTop:"0.5rem" }}>
            Try again
          </button>
        </div>
      ) : filtered.length === 0 ? (
        <div style={emptyBox}>
          <ClipboardList size={40} color="#ccd6a6" strokeWidth={1.5} />
          <p style={{ fontWeight:700, color:"#1c1c18", marginTop:"1rem" }}>
            {filter === "all" ? "No reports yet" : `No ${FILTER_LABELS[filter].toLowerCase()} reports`}
          </p>
          <p style={{ color:"#6b7466", fontSize:"0.85rem", marginTop:"0.35rem" }}>
            {filter === "all"
              ? "Submit your first report using the Report Issue page."
              : "Try switching to a different filter."}
          </p>
          {filter === "all" && (
            <a href="/citizen/report" style={reportLink}>
              + Report an Issue
            </a>
          )}
        </div>
      ) : (
        <div style={reportGrid}>
          {filtered.map(r => (
            <ReportCard key={r.id} {...r} />
          ))}
        </div>
      )}

      <style>{`@keyframes vb-spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

/* ── Styles ── */
const pageWrap: React.CSSProperties = {
  display: "grid", gap: "1.5rem", animation: "fadeUp 0.35s ease both",
};

const pageHeader: React.CSSProperties = {
  display: "flex", justifyContent: "space-between", alignItems: "flex-start",
  gap: "1rem", flexWrap: "wrap",
};

const eyebrow: React.CSSProperties = {
  fontSize: "0.68rem", fontWeight: 700, textTransform: "uppercase",
  letterSpacing: "0.14em", color: "#59623c", display: "block", marginBottom: "0.35rem",
};

const heading: React.CSSProperties = {
  fontSize: "clamp(1.5rem, 3vw, 2rem)", fontWeight: 900,
  color: "#1c1c18", letterSpacing: "-0.025em", marginBottom: "0.4rem",
};

const subtext: React.CSSProperties = {
  color: "#46483e", fontSize: "0.9rem", lineHeight: 1.65,
};

const refreshBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.4rem",
  background: "#fff", border: "2px solid #ccd6a6", borderRadius: "10px",
  padding: "0.55rem 1rem", fontWeight: 600, fontSize: "0.82rem",
  color: "#59623c", cursor: "pointer", fontFamily: "'Public Sans', sans-serif",
  transition: "all 0.2s",
};

const statsRow: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "0.85rem",
};

const statCard: React.CSSProperties = {
  background: "#fff", border: "2px solid rgba(204,214,166,0.7)", borderRadius: "14px",
  padding: "1rem 1.25rem", textAlign: "center",
  boxShadow: "0 10px 28px -18px rgba(89,98,60,0.14)",
  transition: "all 0.2s",
};

const tabRow: React.CSSProperties = {
  display: "flex", gap: "0.4rem", flexWrap: "wrap",
  background: "#f6f3ed", border: "2px solid #ccd6a6",
  borderRadius: "12px", padding: "0.3rem",
};

const tabBtn: React.CSSProperties = {
  border: "none", borderRadius: "8px", padding: "0.5rem 0.85rem",
  display: "inline-flex", alignItems: "center", gap: "0.5rem",
  fontSize: "0.875rem", cursor: "pointer", transition: "all 0.18s",
  fontFamily: "'Public Sans', sans-serif",
};

const tabBadge: React.CSSProperties = {
  fontSize: "0.7rem", padding: "0.1rem 0.45rem",
  borderRadius: "999px", fontWeight: 700, color: "#5a623f",
};

const loadingBox: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", gap: "0.75rem", padding: "4rem 1rem",
  color: "#6b7466", fontSize: "0.9rem",
};

const errorBox: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", gap: "0.5rem", padding: "3rem 1rem",
  color: "#ba1a1a", fontSize: "0.9rem", textAlign: "center",
};

const emptyBox: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", gap: "0.25rem", padding: "4rem 1rem",
  textAlign: "center",
};

const reportGrid: React.CSSProperties = {
  display: "grid", gap: "1rem",
};

const reportLink: React.CSSProperties = {
  marginTop: "1rem", display: "inline-flex", alignItems: "center",
  background: "#59623c", color: "#fff", borderRadius: "10px",
  padding: "0.65rem 1.5rem", fontWeight: 700, fontSize: "0.875rem",
  textDecoration: "none", transition: "background 0.2s",
};
