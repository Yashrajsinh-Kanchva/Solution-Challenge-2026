"use client";

import dynamic from "next/dynamic";
import { useMemo } from "react";
import { 
  AlertTriangle, MapPin, Activity, Droplet, Zap, 
  Trash2, ShieldAlert, BookOpen, HeartPulse, 
  ArrowUp, ArrowDown, Map as MapIcon, Plus, ClipboardList, Info
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";

// Dynamically import map to prevent SSR issues with Leaflet
const IssueMap = dynamic(() => import("@/components/citizen/IssueMap"), { ssr: false, loading: () => <MapLoading /> });

export default function CitizenDashboard() {
  const router = useRouter();
  const [reports, setReports] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient.getRequests()
      .then(data => setReports(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Compute trending data dynamically from actual reports
  const trendingIssues = useMemo(() => {
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

    const counts: Record<string, number> = {};
    const recentCounts: Record<string, number> = {};
    const olderCounts: Record<string, number> = {};

    reports.forEach(r => {
      counts[r.category] = (counts[r.category] || 0) + 1;
      
      const createdDate = new Date(r.createdAt);
      if (createdDate >= sevenDaysAgo) {
        recentCounts[r.category] = (recentCounts[r.category] || 0) + 1;
      } else if (createdDate >= fourteenDaysAgo && createdDate < sevenDaysAgo) {
        olderCounts[r.category] = (olderCounts[r.category] || 0) + 1;
      }
    });
    
    // Sort by overall count descending and take top 4
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(([category, count]) => {
        // Map icon based on category loosely
        let icon = Activity;
        if (category.toLowerCase().includes("water") || category.toLowerCase().includes("plumbing")) icon = Droplet;
        if (category.toLowerCase().includes("electric") || category.toLowerCase().includes("power")) icon = Zap;
        if (category.toLowerCase().includes("trash") || category.toLowerCase().includes("sanit")) icon = Trash2;
        if (category.toLowerCase().includes("safe") || category.toLowerCase().includes("crime")) icon = ShieldAlert;
        if (category.toLowerCase().includes("health") || category.toLowerCase().includes("medic")) icon = HeartPulse;

        // Calculate dynamic trend percentage
        const recent = recentCounts[category] || 0;
        const older = olderCounts[category] || 0;
        let trendStr = "New";
        
        if (older > 0) {
          const percentChange = Math.round(((recent - older) / older) * 100);
          trendStr = percentChange >= 0 ? `+${percentChange}%` : `${percentChange}%`;
        } else if (recent > 0) {
          trendStr = "+100%";
        }

        return { category, icon, count, trend: trendStr };
      });
  }, [reports]);

  // Use top 5 most recent for the feed, excluding the citizen's own reports
  const recentFeed = useMemo(() => {
    let citizenId = "";
    if (typeof document !== "undefined") {
      citizenId = document.cookie.split("; ").find(row => row.startsWith("vb_citizen_id="))?.split("=")[1] || "";
    }
    return reports.filter(r => r.userId !== citizenId).slice(0, 5);
  }, [reports]);

  return (
    <div className="page-stack" style={{ gap: "2rem" }}>
      
      {/* ── Header ── */}
      <section className="page-header" style={{ paddingBottom: "0.5rem" }}>
        <div>
          <p className="page-header__eyebrow">Citizen Portal</p>
          <h2>Community Hub</h2>
          <p>Discover, report, and track issues around your neighborhood.</p>
        </div>
      </section>

      {/* ── Top Grid: Map & Quick Actions ── */}
      <div style={gridTop}>
        <div style={mapSection}>
          <div style={sectionHeader}>
            <MapIcon size={18} color="#59623c" />
            <h3 style={sectionTitle}>Live Issue Map</h3>
            <span style={liveBadge}>
              <span style={liveDot} /> Live
            </span>
          </div>
          <div style={mapWrapper}>
            {loading ? <MapLoading /> : <IssueMap reports={reports} />}
          </div>
        </div>

        <div style={quickActions}>
          <div style={sectionHeader}>
            <Activity size={18} color="#59623c" />
            <h3 style={sectionTitle}>Quick Actions</h3>
          </div>
          <div style={actionsContainer}>
            <button style={actionBtnPrimary} onClick={() => router.push("/citizen/report")}>
              <Plus size={20} />
              <div style={{ textAlign: "left" }}>
                <span style={actionBtnTitle}>Report an Issue</span>
                <span style={actionBtnSub}>Help improve your community</span>
              </div>
            </button>
            <button style={actionBtnSecondary} onClick={() => router.push("/citizen/history")}>
              <ClipboardList size={20} />
              <div style={{ textAlign: "left" }}>
                <span style={actionBtnTitle}>My Reports</span>
                <span style={actionBtnSub}>Track your submissions</span>
              </div>
            </button>
            <div style={infoCard}>
              <Info size={16} color="#59623c" style={{ flexShrink: 0, marginTop: "2px" }} />
              <p style={{ fontSize: "0.8rem", color: "#46483e", lineHeight: 1.5 }}>
                Your reports are sent to local NGOs and verified volunteers for quick resolution.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Trending Categories ── */}
      {trendingIssues.length > 0 && (
        <section>
          <div style={sectionHeader}>
            <h3 style={sectionTitle}>Trending Issues in Your Area</h3>
          </div>
          <div style={trendingGrid}>
            {trendingIssues.map((item, i) => (
              <div key={i} style={trendingCard}>
              <div style={trendingIconWrap}>
                <item.icon size={20} color="#59623c" />
              </div>
              <div>
                <p style={{ fontSize: "0.85rem", fontWeight: 700, color: "#1c1c18" }}>{item.category}</p>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.2rem" }}>
                  <span style={{ fontSize: "1.2rem", fontWeight: 900, color: "#59623c" }}>{item.count}</span>
                  <span style={{ fontSize: "0.75rem", fontWeight: 600, color: item.trend.startsWith("+") ? "#b45309" : "#2e7d32" }}>
                    {item.trend}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
      )}

      {/* ── Nearby Reports Feed ── */}
      <section>
        <div style={sectionHeader}>
          <h3 style={sectionTitle}>Nearby Reports Feed</h3>
        </div>
        
        {loading ? (
          <p style={{ color: "#6b7466", fontSize: "0.9rem" }}>Loading nearby reports...</p>
        ) : recentFeed.length === 0 ? (
          <p style={{ color: "#6b7466", fontSize: "0.9rem", padding: "1rem", background: "#f6f3ed", borderRadius: "10px" }}>No recent reports in your area. You're all caught up!</p>
        ) : (
          <div style={feedGrid}>
            {recentFeed.map(report => (
              <div key={report.id} style={feedCard}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                <div>
                  <span style={{ fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#59623c" }}>
                    {report.category}
                  </span>
                  <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#1c1c18", marginTop: "0.15rem", marginBottom: "0.4rem" }}>
                    {report.title}
                  </h4>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.3rem", color: "#6b7466", fontSize: "0.8rem" }}>
                    <MapPin size={12} /> {report.location}
                  </div>
                </div>
                <span style={{
                  fontSize: "0.65rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em",
                  padding: "0.2rem 0.6rem", borderRadius: "99px",
                  background: report.urgency === "high" ? "#fef2f2" : "#fffbeb",
                  color: report.urgency === "high" ? "#ba1a1a" : "#b45309",
                  border: `1px solid ${report.urgency === "high" ? "#fecaca" : "#fde68a"}`
                }}>
                  {report.urgency} Urgency
                </span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "1rem", paddingTop: "1rem", borderTop: "1px solid #e8edca" }}>
                <div style={{ display: "flex", gap: "0.4rem" }}>
                  <button style={voteBtn} title="Upvote - This issue affects me too">
                    <ArrowUp size={14} /> <span style={{ fontWeight: 600, fontSize: "0.8rem" }}>{Math.floor(Math.random() * 50) + 1}</span>
                  </button>
                  <button style={voteBtn} title="Downvote">
                    <ArrowDown size={14} />
                  </button>
                </div>
                <button style={{ fontSize: "0.75rem", fontWeight: 700, color: "#59623c", background: "transparent", border: "none", cursor: "pointer", textDecoration: "underline" }}>
                  Mark as Still Existing
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </section>

    </div>
  );
}

function MapLoading() {
  return (
    <div style={{ height: "100%", width: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#f6f3ed", borderRadius: "16px", border: "2px solid #ccd6a6" }}>
      <p style={{ color: "#6b7466", fontWeight: 600, fontSize: "0.9rem" }}>Loading Map...</p>
    </div>
  );
}

// --- Styles ---
const gridTop: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
  gap: "1.5rem",
  alignItems: "stretch",
};

const mapSection: React.CSSProperties = {
  flex: "2 1 0%",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

const mapWrapper: React.CSSProperties = {
  height: "350px",
  width: "100%",
  position: "relative",
};

const quickActions: React.CSSProperties = {
  flex: "1 1 0%",
  display: "flex",
  flexDirection: "column",
  gap: "0.75rem",
};

const sectionHeader: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem"
};

const sectionTitle: React.CSSProperties = {
  fontSize: "1.1rem", fontWeight: 800, color: "#1c1c18", letterSpacing: "-0.02em"
};

const liveBadge: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.3rem", marginLeft: "auto",
  background: "#fef2f2", color: "#ba1a1a", padding: "0.2rem 0.5rem", borderRadius: "99px",
  fontSize: "0.65rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em",
};

const liveDot: React.CSSProperties = {
  width: "6px", height: "6px", borderRadius: "50%", background: "#ba1a1a",
  animation: "pulse 1.5s infinite"
};

const actionsContainer: React.CSSProperties = {
  display: "flex", flexDirection: "column", gap: "0.75rem",
  background: "#fff", padding: "1.25rem", borderRadius: "16px",
  border: "2px solid rgba(204,214,166,0.7)", boxShadow: "0 10px 25px -15px rgba(89,98,60,0.1)",
  height: "100%",
};

const actionBtnPrimary: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "1rem", width: "100%",
  padding: "1rem", background: "#59623c", color: "#fff", borderRadius: "12px",
  border: "none", cursor: "pointer", transition: "all 0.2s",
  boxShadow: "0 8px 20px -10px rgba(89,98,60,0.5)",
};

const actionBtnSecondary: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "1rem", width: "100%",
  padding: "1rem", background: "#f6f3ed", color: "#59623c", borderRadius: "12px",
  border: "2px solid #ccd6a6", cursor: "pointer", transition: "all 0.2s",
};

const actionBtnTitle: React.CSSProperties = {
  display: "block", fontSize: "0.95rem", fontWeight: 800,
};

const actionBtnSub: React.CSSProperties = {
  display: "block", fontSize: "0.7rem", opacity: 0.9, marginTop: "0.1rem"
};

const infoCard: React.CSSProperties = {
  marginTop: "auto", display: "flex", gap: "0.5rem", padding: "0.85rem",
  background: "#f0f4e4", borderRadius: "10px", border: "1px dashed #ccd6a6"
};

const trendingGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem",
};

const trendingCard: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "1rem",
  background: "#fff", padding: "1rem", borderRadius: "14px",
  border: "2px solid rgba(204,214,166,0.7)", boxShadow: "0 8px 20px -15px rgba(89,98,60,0.1)",
};

const trendingIconWrap: React.CSSProperties = {
  width: "42px", height: "42px", borderRadius: "10px", background: "#f6f3ed",
  display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #e8edca"
};

const feedGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem",
};

const feedCard: React.CSSProperties = {
  background: "#fff", padding: "1.25rem", borderRadius: "16px",
  border: "2px solid rgba(204,214,166,0.7)", boxShadow: "0 10px 25px -15px rgba(89,98,60,0.1)",
};

const voteBtn: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.3rem",
  background: "#f6f3ed", color: "#59623c", border: "1px solid #ccd6a6",
  padding: "0.35rem 0.6rem", borderRadius: "8px", cursor: "pointer", transition: "background 0.2s"
};
