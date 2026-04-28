import type { Metadata } from "next";
import HelpForm from "@/components/citizen/HelpForm";
import { HeartHandshake, ShieldCheck, Clock } from "lucide-react";

export const metadata: Metadata = {
  title: "Request Personal Help — VolunteerBridge",
  description: "Request personal or individual help for medical, food, education, or emergency needs.",
};

export default function RequestHelpPage() {
  return (
    <div style={pageWrap}>
      {/* Page Header */}
      <header style={pageHeader}>
        <div>
          <span style={eyebrow}>Citizen Portal</span>
          <h2 style={heading}>Request Personal Help</h2>
          <p style={subtext}>
            Reach out if you or your family need individual assistance. Verified NGOs will respond confidentially.
          </p>
        </div>

        {/* Impact chips */}
        <div style={chipRow}>
          <InfoChip icon={<ShieldCheck size={14} />} label="Confidential" />
          <InfoChip icon={<Clock size={14} />} label="Fast Response" />
        </div>
      </header>

      {/* Main Form Area */}
      <div style={contentWrap}>
        <HelpForm />
      </div>
    </div>
  );
}

function InfoChip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div style={chip}>
      <span style={chipIcon}>{icon}</span>
      <span style={chipLabel}>{label}</span>
    </div>
  );
}

// --- Styles ---
const pageWrap: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  gap: "2rem",
};

const pageHeader: React.CSSProperties = {
  display: "flex",
  flexWrap: "wrap",
  gap: "1.5rem",
  alignItems: "flex-end",
  justifyContent: "space-between",
  paddingBottom: "1.5rem",
  borderBottom: "1px solid #e8edca",
};

const eyebrow: React.CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 800,
  textTransform: "uppercase",
  letterSpacing: "0.1em",
  color: "#8c9686",
  marginBottom: "0.5rem",
  display: "block",
};

const heading: React.CSSProperties = {
  fontSize: "2rem",
  fontWeight: 900,
  color: "#1c1c18",
  letterSpacing: "-0.03em",
  lineHeight: 1.1,
  marginBottom: "0.5rem",
};

const subtext: React.CSSProperties = {
  fontSize: "0.95rem",
  color: "#46483e",
  maxWidth: "600px",
  lineHeight: 1.5,
};

const chipRow: React.CSSProperties = {
  display: "flex",
  gap: "0.75rem",
  flexWrap: "wrap",
};

const chip: React.CSSProperties = {
  display: "flex",
  alignItems: "center",
  gap: "0.4rem",
  padding: "0.4rem 0.8rem",
  background: "#f0f4e4",
  border: "1px solid #ccd6a6",
  borderRadius: "99px",
};

const chipIcon: React.CSSProperties = {
  color: "#59623c",
  display: "flex",
};

const chipLabel: React.CSSProperties = {
  fontSize: "0.75rem",
  fontWeight: 700,
  color: "#59623c",
};

const contentWrap: React.CSSProperties = {
  paddingBottom: "4rem",
};
