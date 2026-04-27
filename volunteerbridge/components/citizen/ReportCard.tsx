"use client";

import { MapPin, Clock, AlertTriangle, Tag } from "lucide-react";

type Severity = "low" | "medium" | "high" | "critical";

interface ReportCardProps {
  id:            string;
  title:         string;
  category:      string;
  description:   string;
  summary:       string;
  urgency:       string;
  location:      { lat: number; lng: number; address: string };
  beneficiaries: number;
  createdAt:     string;
  status:        "pending" | "in_progress" | "resolved" | string;
}

const SEVERITY_COLOR: Record<string, { bg: string; text: string; border: string }> = {
  low:      { bg: "#f1f8f1", text: "#2e7d32", border: "#a7d7a7" },
  medium:   { bg: "#fffbeb", text: "#b45309", border: "#FDE68A" },
  high:     { bg: "#fff4ed", text: "#c84b00", border: "#fed7aa" },
  critical: { bg: "#fef2f2", text: "#ba1a1a", border: "#FECACA" },
};

const STATUS_STYLE: Record<string, { bg: string; text: string; label: string }> = {
  pending:     { bg: "#fffbeb", text: "#b45309", label: "Pending Review" },
  in_progress: { bg: "#eff6ff", text: "#1d4ed8", label: "In Progress"    },
  resolved:    { bg: "#f1f8f1", text: "#2e7d32", label: "Resolved"       },
};

const CATEGORY_ICON: Record<string, string> = {
  sanitation:    "🗑️", water: "💧", electricity: "⚡", roads: "🛣️",
  healthcare:    "🏥", education: "📚", public_safety: "🚨",
  environment:   "🌱", others: "📋",
};

export default function ReportCard({
  title, category, summary, description, urgency, location, beneficiaries, createdAt, status,
}: ReportCardProps) {
  const sev    = SEVERITY_COLOR[urgency] ?? SEVERITY_COLOR.low;
  const stat   = STATUS_STYLE[status]    ?? STATUS_STYLE.pending;
  const icon   = CATEGORY_ICON[category] ?? "📋";
  const date   = new Date(createdAt).toLocaleDateString("en-IN", { day:"numeric", month:"short", year:"numeric" });

  return (
    <div style={card}>
      {/* Top row */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", gap:"1rem" }}>
        <div style={{ display:"flex", alignItems:"flex-start", gap:"0.85rem" }}>
          <div style={iconWrap}>{icon}</div>
          <div>
            <span style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#59623c" }}>
              {category.replace("_", " ")}
            </span>
            <h3 style={{ fontSize:"0.95rem", fontWeight:700, color:"#1c1c18", marginTop:"0.15rem", lineHeight:1.3 }}>
              {title || "Untitled Report"}
            </h3>
          </div>
        </div>

        {/* Status badge */}
        <span style={{
          ...badge,
          background: stat.bg, color: stat.text,
          border: `1px solid ${stat.text}33`,
          flexShrink: 0,
        }}>
          {stat.label}
        </span>
      </div>

      {/* Description / Summary */}
      <p style={desc}>{summary || description}</p>

      {/* Meta row */}
      <div style={metaRow}>
        {location.address && (
          <MetaChip icon={<MapPin size={12} />} text={location.address.split(",")[0]} />
        )}
        {urgency && (
          <span style={{ ...badge, background:sev.bg, color:sev.text, border:`1px solid ${sev.border}` }}>
            <AlertTriangle size={11} style={{ marginRight:"3px" }} />
            {urgency.charAt(0).toUpperCase() + urgency.slice(1)} Urgency
          </span>
        )}
        {beneficiaries > 0 && (
          <MetaChip icon={<Tag size={12} />} text={`${beneficiaries} Affected`} />
        )}
        <MetaChip icon={<Clock size={12} />} text={date} />
      </div>
    </div>
  );
}

function MetaChip({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <span style={{ display:"inline-flex", alignItems:"center", gap:"0.3rem", fontSize:"0.75rem", color:"#46483e", background:"#f6f3ed", borderRadius:"999px", padding:"0.2rem 0.6rem", border:"1px solid #ccd6a6" }}>
      {icon}{text}
    </span>
  );
}

/* ── Styles ───────────────────────────────────────────────── */
const card: React.CSSProperties = {
  background: "#fff", border: "2px solid rgba(204,214,166,0.7)", borderRadius: "16px",
  padding: "1.25rem 1.5rem", display: "grid", gap: "0.9rem",
  boxShadow: "0 18px 40px -20px rgba(89,98,60,0.14)",
  transition: "box-shadow 0.2s, transform 0.2s",
};

const iconWrap: React.CSSProperties = {
  width: "40px", height: "40px", borderRadius: "10px", background: "#f6f3ed",
  display: "flex", alignItems: "center", justifyContent: "center",
  fontSize: "1.3rem", flexShrink: 0, border: "1px solid #e8edca",
};

const badge: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", borderRadius: "999px",
  padding: "0.22rem 0.65rem", fontSize: "0.7rem", fontWeight: 700,
  textTransform: "uppercase", letterSpacing: "0.06em", whiteSpace: "nowrap",
};

const desc: React.CSSProperties = {
  color: "#46483e", fontSize: "0.85rem", lineHeight: 1.6,
  display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
  overflow: "hidden",
};

const metaRow: React.CSSProperties = {
  display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center",
};
