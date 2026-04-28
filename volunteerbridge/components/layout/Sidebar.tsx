"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationRoute } from "@/constants/routes";
import {
  LayoutDashboard, Users, BarChart3, HeartHandshake, Brain,
  ShieldCheck, ClipboardList, Map, HelpCircle, LogOut, Zap,
  FileText, History, CheckSquare, UploadCloud, UserCheck,
  Briefcase, UserCircle, Activity, Package, Search,
} from "lucide-react";

type SidebarProps = { title: string; items: NavigationRoute[] };

const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "VolunteerBridge": { bg: "#4D5A2C", text: "#fff", dot: "#C8D68A" },
  "NGO Portal":      { bg: "#1A5276", text: "#fff", dot: "#7FB3D3" },
  "Volunteer Hub":   { bg: "#1E5631", text: "#fff", dot: "#82E0AA" },
  "Citizen Portal":  { bg: "#6E2C00", text: "#fff", dot: "#FAD7A0" },
};

function getIcon(href: string) {
  if (href.includes("dashboard"))         return <LayoutDashboard size={18} strokeWidth={2} />;
  if (href.includes("volunteer-requests")) return <UserCheck size={18} strokeWidth={2} />;
  if (href.includes("volunteers"))        return <Users size={18} strokeWidth={2} />;
  if (href.includes("analytics"))         return <BarChart3 size={18} strokeWidth={2} />;
  if (href.includes("needs"))             return <HeartHandshake size={18} strokeWidth={2} />;
  if (href.includes("active-tasks"))      return <Zap size={18} strokeWidth={2} />;
  if (href.includes("tasks"))             return <ClipboardList size={18} strokeWidth={2} />;
  if (href.includes("resources"))         return <Package size={18} strokeWidth={2} />;
  if (href.includes("surveys"))           return <FileText size={18} strokeWidth={2} />;
  if (href.includes("maps") || href.endsWith("/map")) return <Map size={18} strokeWidth={2} />;
  if (href.includes("users"))             return <Users size={18} strokeWidth={2} />;
  if (href.includes("predictions"))       return <Brain size={18} strokeWidth={2} />;
  if (href.includes("ngo-approvals"))     return <ShieldCheck size={18} strokeWidth={2} />;
  if (href.includes("assignments"))       return <Briefcase size={18} strokeWidth={2} />;
  if (href.includes("report"))            return <FileText size={18} strokeWidth={2} />;
  if (href.includes("history"))           return <History size={18} strokeWidth={2} />;
  if (href.includes("help"))              return <HeartHandshake size={18} strokeWidth={2} />;
  if (href.includes("opportunities"))     return <Search size={18} strokeWidth={2} />;
  if (href.includes("profile"))           return <UserCircle size={18} strokeWidth={2} />;
  if (href.includes("progress"))          return <Activity size={18} strokeWidth={2} />;
  return <LayoutDashboard size={18} strokeWidth={2} />;
}

export default function Sidebar({ title, items }: SidebarProps) {
  const pathname = usePathname();
  const colors = ROLE_COLORS[title] ?? ROLE_COLORS["VolunteerBridge"];

  return (
    <aside style={{
      position: "fixed", top: 0, left: 0, height: "100vh", width: "17rem",
      zIndex: 50, background: "#FFFFFF",
      borderRight: "1.5px solid #E8EDD0",
      boxShadow: "4px 0 24px rgba(45,55,20,0.06)",
      display: "flex", flexDirection: "column",
      padding: "1.5rem 1.25rem 1.25rem", gap: "0.25rem",
      overflowY: "auto", overflowX: "hidden",
    }}>
      {/* Brand */}
      <div style={{ marginBottom: "2rem", paddingBottom: "1.5rem", borderBottom: "1.5px solid #E8EDD0" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <div style={{
            width: "40px", height: "40px", borderRadius: "12px",
            background: colors.bg,
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0, boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
          }}>
            <Zap size={18} color={colors.text} strokeWidth={2.5} />
          </div>
          <div>
            <h1 style={{
              fontSize: "0.95rem", fontWeight: 800, color: "#1A1C15",
              letterSpacing: "-0.02em", lineHeight: 1.25,
              fontFamily: "'Public Sans', sans-serif",
            }}>
              {title}
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", marginTop: "3px" }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#2E6B32" }} />
              <p style={{
                fontSize: "0.6rem", fontWeight: 700, textTransform: "uppercase",
                letterSpacing: "0.18em", color: "#6B7160",
                fontFamily: "'Public Sans', sans-serif",
              }}>
                Live System
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "2px" }}>
        {items.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "0.62rem 0.9rem", borderRadius: "10px",
                textDecoration: "none", transition: "all 0.15s ease",
                background: isActive ? "#EEF3D2" : "transparent",
                color: isActive ? "#404535" : "#6B7160",
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.875rem",
                fontFamily: "'Public Sans', sans-serif",
                borderLeft: isActive ? "3px solid #4D5A2C" : "3px solid transparent",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "#F7F5EE";
                  (e.currentTarget as HTMLElement).style.color = "#404535";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#6B7160";
                }
              }}
            >
              <span style={{
                flexShrink: 0,
                color: isActive ? "#4D5A2C" : "#9CA396",
                transition: "color 0.15s",
              }}>
                {getIcon(item.href)}
              </span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div style={{
        marginTop: "auto", paddingTop: "1.25rem",
        borderTop: "1.5px solid #E8EDD0",
        display: "flex", flexDirection: "column", gap: "2px",
      }}>
        <Link href="/support" style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "0.58rem 0.9rem", borderRadius: "10px",
          color: "#6B7160", fontWeight: 500, fontSize: "0.85rem",
          textDecoration: "none", transition: "all 0.15s",
          fontFamily: "'Public Sans', sans-serif",
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#F7F5EE"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <HelpCircle size={17} strokeWidth={2} />
          Support
        </Link>
        <Link href="/login" style={{
          display: "flex", alignItems: "center", gap: "10px",
          padding: "0.58rem 0.9rem", borderRadius: "10px",
          color: "#A81919", fontWeight: 600, fontSize: "0.85rem",
          textDecoration: "none", transition: "all 0.15s",
          fontFamily: "'Public Sans', sans-serif",
        }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#FDECEA"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <LogOut size={17} strokeWidth={2} />
          Sign Out
        </Link>
      </div>
    </aside>
  );
}
