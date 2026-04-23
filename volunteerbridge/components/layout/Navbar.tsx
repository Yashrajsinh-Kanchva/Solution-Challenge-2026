"use client";

import { useMemo } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ADMIN_ROUTES } from "@/constants/routes";
import { ROLE_LABELS } from "@/constants/roles";
import { useAuth } from "@/lib/hooks/useAuth";
import { Search, Bell, Settings, UserCircle } from "lucide-react";

export default function Component() {
  const pathname = usePathname();
  const router = useRouter();
  const { role, setRole } = useAuth();

  const currentRoute = useMemo(
    () =>
      ADMIN_ROUTES.find(
        (route) => pathname === route.href || pathname.startsWith(`${route.href}/`)
      ),
    [pathname]
  );

  const onLogout = () => {
    setRole(null);
    router.push("/login");
  };

  return (
    <header className="top-navbar">
      <div className="top-navbar-search" style={{ 
        display: "flex", 
        alignItems: "center", 
        background: "#F3F0E6", 
        padding: "0.6rem 1rem", 
        borderRadius: "8px", 
        width: "min(400px, 100%)",
        gap: "0.5rem"
      }}>
        <Search size={18} color="#8C8F8A" />
        <input 
          type="text" 
          placeholder="Search mission IDs, personnel, or assets..." 
          style={{ border: "none", background: "transparent", outline: "none", width: "100%", color: "#1A1C19", fontSize: "0.9rem" }}
        />
      </div>
      
      <div className="top-navbar__actions">
        <button type="button" className="ghost-button" style={{ border: "none", padding: "0.5rem" }}>
          <Bell size={20} color="#595C58" />
        </button>
        <button type="button" className="ghost-button" style={{ border: "none", padding: "0.5rem" }}>
          <Settings size={20} color="#595C58" />
        </button>
        <span style={{ display: "flex", alignItems: "center", gap: "0.5rem", border: "none", background: "transparent" }}>
          <UserCircle size={24} color="#1A1C19" />
          <strong style={{ fontWeight: 600 }}>{role ? ROLE_LABELS[role] : "Guest"}</strong>
        </span>
      </div>
    </header>
  );
}
