import type { Metadata } from "next";
import NeedForm from "@/components/citizen/NeedForm";
import { FileText, MapPin, Users } from "lucide-react";

export const metadata: Metadata = {
  title: "Report Local Issue — VolunteerBridge",
  description: "Submit a community issue report to help NGOs and volunteers respond faster.",
};

export default function ReportIssuePage() {
  return (
    <div style={pageWrap}>
      {/* Page Header */}
      <header style={pageHeader}>
        <div>
          <span style={eyebrow}>Citizen Portal</span>
          <h2 style={heading}>Report Local Issue</h2>
          <p style={subtext}>
            Help your community by reporting problems. Structured reports reach the right volunteers faster.
          </p>
        </div>

        {/* Impact chips */}
        <div style={chipRow}>
          <InfoChip icon={<MapPin size={14} />} label="Location-aware" />
          <InfoChip icon={<Users size={14} />}  label="Matched to volunteers" />
          <InfoChip icon={<FileText size={14} />} label="AI-prioritised" />
        </div>
      </header>

      {/* Two-col layout: form | tips */}
      <div style={grid}>

        {/* ── Main Form Card ── */}
        <div style={formCard}>
          <NeedForm />
        </div>

        {/* ── Tips Sidebar ── */}
        <aside style={{ display:"grid", gap:"1rem", alignContent:"start" }}>

          <div style={tipCard}>
            <h3 style={tipTitle}>📋 Reporting Tips</h3>
            <ul style={tipList}>
              <li>Be specific — mention the exact street or landmark.</li>
              <li>Add a photo if possible — it speeds up response by 3×.</li>
              <li>Select the right category so NGOs are alerted instantly.</li>
              <li>Set severity honestly — Critical is reserved for life-threatening issues.</li>
            </ul>
          </div>

          <div style={tipCard}>
            <h3 style={tipTitle}>⚡ What Happens Next?</h3>
            <ol style={{ ...tipList, paddingLeft:"1.1rem" }}>
              <li>Your report is reviewed by our AI engine.</li>
              <li>Matched to the most suitable NGO in your area.</li>
              <li>Volunteers are assigned and notified.</li>
              <li>You receive status updates on your dashboard.</li>
            </ol>
          </div>

          <div style={{ ...tipCard, background:"#f1f8f1", borderColor:"#a7d7a7" }}>
            <h3 style={{ ...tipTitle, color:"#2e7d32" }}>✅ Categories We Support</h3>
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.4rem", marginTop:"0.6rem" }}>
              {["🗑️ Sanitation","💧 Water","⚡ Electricity","🛣️ Roads","🏥 Healthcare","📚 Education","🚨 Safety","🌱 Environment"].map(c => (
                <span key={c} style={categoryPill}>{c}</span>
              ))}
            </div>
          </div>

        </aside>
      </div>
    </div>
  );
}

function InfoChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "0.4rem",
      background: "#fff", border: "2px solid #ccd6a6", borderRadius: "999px",
      padding: "0.4rem 0.9rem", fontSize: "0.78rem", fontWeight: 600, color: "#46483e",
      boxShadow: "0 2px 8px rgba(89,98,60,0.08)",
    }}>
      {icon} {label}
    </span>
  );
}

/* ── Styles ───────────────────────────────────────────────── */
const pageWrap: React.CSSProperties = {
  display: "grid", gap: "1.75rem", animation: "fadeUp 0.35s ease both",
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
  color: "#46483e", fontSize: "0.9rem", lineHeight: 1.65, maxWidth: "55ch",
};

const chipRow: React.CSSProperties = {
  display: "flex", gap: "0.6rem", flexWrap: "wrap", alignItems: "center",
};

const grid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "minmax(0,2fr) minmax(0,1fr)",
  gap: "1.5rem",
  alignItems: "start",
};

const formCard: React.CSSProperties = {
  background: "#fff", border: "2px solid rgba(204,214,166,0.8)", borderRadius: "20px",
  padding: "2rem 2.25rem", boxShadow: "0 18px 40px -20px rgba(89,98,60,0.16)",
};

const tipCard: React.CSSProperties = {
  background: "#fff", border: "2px solid rgba(204,214,166,0.7)", borderRadius: "16px",
  padding: "1.25rem 1.5rem", boxShadow: "0 10px 28px -18px rgba(89,98,60,0.14)",
};

const tipTitle: React.CSSProperties = {
  fontSize: "0.9rem", fontWeight: 800, color: "#1c1c18", marginBottom: "0.75rem",
};

const tipList: React.CSSProperties = {
  margin: 0, paddingLeft: "1rem", display: "grid", gap: "0.5rem",
  color: "#46483e", fontSize: "0.83rem", lineHeight: 1.6,
};

const categoryPill: React.CSSProperties = {
  background: "#f6f3ed", border: "1px solid #ccd6a6", borderRadius: "999px",
  padding: "0.2rem 0.65rem", fontSize: "0.72rem", fontWeight: 600, color: "#46483e",
};
