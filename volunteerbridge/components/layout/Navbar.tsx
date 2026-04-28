"use client";

import { Bell, Settings, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { getCookie } from "@/lib/utils/cookies";
import { apiClient } from "@/lib/api/client";
import { usePathname } from "next/navigation";

const PAGE_LABELS: Record<string, string> = {
  dashboard: "Dashboard",
  analytics: "Analytics",
  needs: "Need Requests",
  users: "User Directory",
  predictions: "AI Predictions",
  "ngo-approvals": "NGO Approvals",
  assignments: "Assignments",
  maps: "Operational Maps",
  map: "Map View",
  "active-tasks": "Active Tasks",
  tasks: "My Tasks",
  resources: "Resources",
  surveys: "Surveys",
  volunteers: "Volunteers",
  "volunteer-requests": "Join Requests",
  opportunities: "Opportunities",
  profile: "Profile",
};

export default function Navbar() {
  const [userName, setUserName] = useState("Admin");
  const [initials, setInitials] = useState("AD");
  const [role, setRole] = useState("");
  const pathname = usePathname();

  // Derive breadcrumb from pathname
  const segments = pathname.split("/").filter(Boolean);
  const pageKey = segments[segments.length - 1] ?? "";
  const pageLabel = PAGE_LABELS[pageKey] ?? pageKey.replace(/-/g, " ");
  const roleLabel = segments[0] ? segments[0].charAt(0).toUpperCase() + segments[0].slice(1) : "";

  useEffect(() => {
    const r = getCookie("vb_role") ?? "";
    setRole(r);
    if (r === "ngo") {
      const ngoId = getCookie("vb_ngo_id");
      if (ngoId) {
        apiClient.getNgo(ngoId).then(ngo => {
          if (ngo) {
            const name = ngo.ngoName || ngo.name || "NGO";
            setUserName(name);
            setInitials(name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2));
          }
        });
      }
    } else if (r === "volunteer") {
      const vid = getCookie("vb_volunteer_id");
      if (vid) {
        apiClient.getVolunteer(vid).then(v => {
          if (v?.name) {
            setUserName(v.name);
            setInitials(v.name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2));
          }
        });
      }
    } else if (r === "admin") {
      setUserName("Admin");
      setInitials("AD");
    }
  }, []);

  const ROLE_COLORS: Record<string, string> = {
    admin: "#4D5A2C", ngo: "#1A5276", volunteer: "#1E5631", citizen: "#6E2C00",
  };
  const avatarBg = ROLE_COLORS[role] ?? "#4D5A2C";

  return (
    <header style={{
      height: "4.25rem", width: "100%", flexShrink: 0,
      display: "flex", justifyContent: "space-between", alignItems: "center",
      padding: "0 2rem", borderBottom: "1.5px solid #E8EDD0",
      background: "rgba(255,255,255,0.92)",
      backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)",
      position: "sticky", top: 0, zIndex: 40,
      boxShadow: "0 1px 0 rgba(45,55,20,0.06), 0 4px 16px rgba(45,55,20,0.04)",
    }}>
      {/* Breadcrumb */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: 0 }}>
        <span style={{ fontSize: "0.78rem", color: "#9CA396", fontWeight: 500, fontFamily: "'Public Sans', sans-serif" }}>
          {roleLabel}
        </span>
        {pageLabel && (
          <>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#C4CBA8" strokeWidth="2">
              <path d="m9 18 6-6-6-6"/>
            </svg>
            <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1A1C15", fontFamily: "'Public Sans', sans-serif" }}>
              {pageLabel}
            </span>
          </>
        )}
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
        {/* Search pill */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.5rem",
          background: "#F7F5EE", border: "1.5px solid #E8EDD0",
          borderRadius: "999px", padding: "0.42rem 1rem",
          marginRight: "0.5rem", cursor: "text",
        }}>
          <Search size={14} color="#9CA396" />
          <span style={{ fontSize: "0.8rem", color: "#9CA396", fontFamily: "'Public Sans', sans-serif", whiteSpace: "nowrap" }}>
            Quick search…
          </span>
        </div>

        <button style={{
          padding: "0.52rem", background: "transparent", border: "none",
          borderRadius: "50%", cursor: "pointer", color: "#9CA396",
          display: "flex", alignItems: "center", transition: "background 0.15s",
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F7F5EE"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Bell size={19} strokeWidth={1.8} />
        </button>

        <button style={{
          padding: "0.52rem", background: "transparent", border: "none",
          borderRadius: "50%", cursor: "pointer", color: "#9CA396",
          display: "flex", alignItems: "center", transition: "background 0.15s",
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F7F5EE"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Settings size={19} strokeWidth={1.8} />
        </button>

        <div style={{ width: "1px", height: "1.75rem", background: "#E8EDD0", margin: "0 0.5rem" }} />

        {/* Avatar capsule */}
        <div style={{
          display: "flex", alignItems: "center", gap: "0.65rem",
          background: "#FFFFFF", borderRadius: "999px",
          border: "1.5px solid #E8EDD0", padding: "0.22rem 0.22rem 0.22rem 0.9rem",
          boxShadow: "0 1px 4px rgba(45,55,20,0.08)",
          cursor: "pointer", transition: "box-shadow 0.15s",
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 2px 8px rgba(45,55,20,0.14)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 1px 4px rgba(45,55,20,0.08)"; }}
        >
          <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1A1C15", fontFamily: "'Public Sans', sans-serif", whiteSpace: "nowrap" }}>
            {userName}
          </span>
          <div style={{
            width: "2rem", height: "2rem", borderRadius: "50%",
            background: avatarBg,
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "0.65rem", fontWeight: 800, color: "#fff",
            fontFamily: "'Public Sans', sans-serif", flexShrink: 0,
            letterSpacing: "0.04em",
          }}>
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
