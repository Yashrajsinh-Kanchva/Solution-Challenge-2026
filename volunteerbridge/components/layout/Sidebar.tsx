"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationRoute } from "@/constants/routes";
import {
  LayoutDashboard,
  Users,
  BarChart3,
  HeartHandshake,
  Brain,
  ShieldCheck,
  ClipboardList,
  Map,
  HelpCircle,
  LogOut,
  Zap,
  FileText,
  History,
  CheckSquare,
  UploadCloud,
  UserCheck,
  Briefcase,
  UserCircle,
  Activity,
} from "lucide-react";

type SidebarProps = {
  title: string;
  items: NavigationRoute[];
};

function getIcon(href: string) {
  if (href.includes("dashboard"))    return <LayoutDashboard size={20} strokeWidth={2} />;
  if (href.includes("users"))        return <Users size={20} strokeWidth={2} />;
  if (href.includes("analytics"))    return <BarChart3 size={20} strokeWidth={2} />;
  if (href.includes("needs"))        return <HeartHandshake size={20} strokeWidth={2} />;
  if (href.includes("predictions"))  return <Brain size={20} strokeWidth={2} />;
  if (href.includes("ngo-approvals"))return <ShieldCheck size={20} strokeWidth={2} />;
  if (href.includes("assignments"))  return <ClipboardList size={20} strokeWidth={2} />;
  if (href.includes("maps"))         return <Map size={20} strokeWidth={2} />;
  // citizen routes
  if (href.includes("report"))       return <FileText size={20} strokeWidth={2} />;
  if (href.includes("history"))      return <History size={20} strokeWidth={2} />;
  // ngo routes
  if (href.includes("tasks"))        return <CheckSquare size={20} strokeWidth={2} />;
  if (href.includes("surveys"))      return <UploadCloud size={20} strokeWidth={2} />;
  if (href.includes("volunteers"))   return <UserCheck size={20} strokeWidth={2} />;
  // volunteer routes
  if (href.includes("profile"))      return <UserCircle size={20} strokeWidth={2} />;
  if (href.includes("progress"))     return <Activity size={20} strokeWidth={2} />;
  return <LayoutDashboard size={20} strokeWidth={2} />;
}

export default function Sidebar({ title, items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "100vh",
        width: "18rem",
        zIndex: 50,
        background: "#FCF9F3",
        borderRight: "2px solid #CCD6A6",
        boxShadow: "10px 0 36px -24px rgba(28,29,23,0.35)",
        display: "flex",
        flexDirection: "column",
        padding: "2rem 1.5rem",
        gap: "0.5rem",
        overflowY: "auto",
        overflowX: "hidden",
      }}
    >
      {/* Brand */}
      <div style={{ marginBottom: "2.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "16px",
              background: "#59623c",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              boxShadow: "0 12px 24px -16px rgba(89,98,60,0.45)",
            }}
          >
            <Zap size={20} color="#ffffff" strokeWidth={2.5} />
          </div>
          <div>
            <h1
              style={{
                fontSize: "1.15rem",
                fontWeight: 900,
                color: "#1c1c18",
                letterSpacing: "-0.02em",
                lineHeight: 1.2,
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              {title}
            </h1>
            <p
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                textTransform: "uppercase",
                letterSpacing: "0.2em",
                color: "rgba(90,98,63,0.6)",
                marginTop: "2px",
                fontFamily: "'Public Sans', sans-serif",
              }}
            >
              Command Center
            </p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, display: "flex", flexDirection: "column", gap: "4px" }}>
        {items.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.href}
              href={item.href}
              prefetch={false}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "14px",
                padding: "0.7rem 1rem",
                borderRadius: "12px",
                textDecoration: "none",
                transition: "all 0.18s ease",
                background: isActive ? "#dce4b8" : "transparent",
                color: isActive ? "#171e01" : "#5a623f",
                fontWeight: isActive ? 600 : 500,
                fontSize: "0.9rem",
                fontFamily: "'Public Sans', sans-serif",
                boxShadow: isActive
                  ? "0 10px 24px -18px rgba(89,98,60,0.3)"
                  : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "#f0eee8";
                  (e.currentTarget as HTMLElement).style.color = "#59623c";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  (e.currentTarget as HTMLElement).style.background = "transparent";
                  (e.currentTarget as HTMLElement).style.color = "#5a623f";
                }
              }}
            >
              <span style={{ flexShrink: 0 }}>{getIcon(item.href)}</span>
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Footer links */}
      <div
        style={{
          marginTop: "auto",
          paddingTop: "1.5rem",
          borderTop: "2px solid #CCD6A6",
          display: "flex",
          flexDirection: "column",
          gap: "4px",
        }}
      >
        <Link
          href="/support"
          style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "0.65rem 1rem", borderRadius: "10px",
            color: "#5a623f", fontWeight: 500, fontSize: "0.875rem",
            textDecoration: "none", transition: "all 0.18s",
            fontFamily: "'Public Sans', sans-serif",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "#f0eee8"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <HelpCircle size={18} strokeWidth={2} />
          Support
        </Link>
        <Link
          href="/login"
          style={{
            display: "flex", alignItems: "center", gap: "12px",
            padding: "0.65rem 1rem", borderRadius: "10px",
            color: "#ba1a1a", fontWeight: 500, fontSize: "0.875rem",
            textDecoration: "none", transition: "all 0.18s",
            fontFamily: "'Public Sans', sans-serif",
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(186,26,26,0.06)"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
        >
          <LogOut size={18} strokeWidth={2} />
          Sign Out
        </Link>
      </div>
    </aside>
  );
}
