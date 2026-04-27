"use client";

import { Bell, Settings, User } from "lucide-react";
import { useEffect, useState } from "react";
import { getCookie } from "@/lib/utils/cookies";
import { apiClient } from "@/lib/api/client";

export default function Navbar() {
  const [userName, setUserName] = useState("Admin User");
  const [initials, setInitials] = useState("AU");

  useEffect(() => {
    const role = getCookie("vb_role");
    if (role === "ngo") {
      const ngoId = getCookie("vb_ngo_id");
      if (ngoId) {
        apiClient.getNgo(ngoId).then(ngo => {
          if (ngo) {
            const name = ngo.ngoName || ngo.name || "NGO User";
            setUserName(name);
            setInitials(name.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2));
          }
        });
      }
    } else if (role === "admin") {
      setUserName("Admin Portal");
      setInitials("AP");
    }
  }, []);

  return (
    <header
      style={{
        height: "5rem",
        width: "100%",
        maxWidth: "100%",
        boxSizing: "border-box",
        flexShrink: 0,
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "0 2.5rem",
        borderBottom: "2px solid #CCD6A6",
        background: "rgba(252,249,243,0.9)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 40,
        boxShadow: "0 18px 40px -28px rgba(28,29,23,0.4)",
      }}
    >
      {/* Search bar */}
      <div style={{ flex: 1, maxWidth: "32rem" }}>
        <div
          style={{
            position: "relative",
            background: "#f6f3ed",
            border: "2px solid #ccd6a6",
            borderRadius: "999px",
            padding: "0.5rem 1rem 0.5rem 2.75rem",
            boxShadow: "0 16px 36px -24px rgba(28,29,23,0.35)",
          }}
        >
          <span
            style={{
              position: "absolute",
              left: "0.85rem",
              top: "50%",
              transform: "translateY(-50%)",
              color: "#9ca3af",
              display: "flex",
              alignItems: "center",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search users, NGOs, or tasks..."
            style={{
              width: "100%",
              background: "transparent",
              border: "none",
              outline: "none",
              fontSize: "0.875rem",
              color: "#1c1c18",
              fontFamily: "'Public Sans', sans-serif",
            }}
          />
        </div>
      </div>

      {/* Right actions */}
      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
        <button
          style={{
            padding: "0.6rem",
            background: "transparent",
            border: "none",
            borderRadius: "999px",
            cursor: "pointer",
            color: "rgba(90,98,63,0.6)",
            display: "flex",
            alignItems: "center",
            transition: "background 0.18s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0eee8"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Bell size={22} strokeWidth={1.8} />
        </button>
        <button
          style={{
            padding: "0.6rem",
            background: "transparent",
            border: "none",
            borderRadius: "999px",
            cursor: "pointer",
            color: "rgba(90,98,63,0.6)",
            display: "flex",
            alignItems: "center",
            transition: "background 0.18s",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0eee8"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <Settings size={22} strokeWidth={1.8} />
        </button>

        {/* Divider */}
        <div style={{ width: "1px", height: "2rem", background: "#E5E2DD", margin: "0 1rem" }} />

        {/* Profile capsule */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.75rem",
            background: "#ffffff",
            borderRadius: "999px",
            border: "2px solid #CCD6A6",
            padding: "0.25rem 0.25rem 0.25rem 1rem",
            boxShadow: "0 16px 34px -24px rgba(28,29,23,0.32)",
          }}
        >
          <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1c1c18", fontFamily: "'Public Sans', sans-serif", whiteSpace: "nowrap" }}>
            {userName}
          </span>
          <div
            style={{
              width: "2.25rem",
              height: "2.25rem",
              borderRadius: "999px",
              background: "#ccd6a6",
              border: "2px solid #ccd6a6",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "0.7rem",
              fontWeight: 800,
              color: "#171e01",
              fontFamily: "'Public Sans', sans-serif",
              flexShrink: 0,
            }}
          >
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}
