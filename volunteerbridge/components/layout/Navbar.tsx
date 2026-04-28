"use client";

import { Bell, Settings, Search, Menu } from "lucide-react";
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

type NavbarProps = {
  onMenuClick?: () => void;
};

export default function Navbar({ onMenuClick }: NavbarProps) {
  const [userName, setUserName] = useState("Admin");
  const [initials, setInitials] = useState("AD");
  const [role, setRole] = useState("");
  const pathname = usePathname();

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
    admin: "bg-[#4D5A2C]", 
    ngo: "bg-[#1A5276]", 
    volunteer: "bg-[#1E5631]", 
    citizen: "bg-[#6E2C00]",
  };
  const avatarBg = ROLE_COLORS[role] ?? "bg-[#4D5A2C]";

  return (
    <header className="h-[4.25rem] w-full flex-shrink-0 flex justify-between items-center px-4 sm:px-8 border-b-[1.5px] border-[#E8EDD0] bg-white/90 backdrop-blur-xl sticky top-0 z-40 shadow-[0_1px_0_rgba(45,55,20,0.06),0_4px_16px_rgba(45,55,20,0.04)]">
      {/* Left: Hamburger + Breadcrumb */}
      <div className="flex items-center gap-3 sm:gap-4 min-w-0">
        <button 
          onClick={onMenuClick}
          className="lg:hidden p-2 text-[#6B7160] hover:bg-[#F7F5EE] rounded-xl transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="flex items-center gap-2 min-w-0">
          <span className="hidden xs:block text-[11px] font-bold text-[#9CA396] uppercase tracking-widest truncate">
            {roleLabel}
          </span>
          {pageLabel && (
            <>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#C4CBA8" strokeWidth="3" className="hidden xs:block">
                <path d="m9 18 6-6-6-6"/>
              </svg>
              <span className="text-sm sm:text-base font-black text-[#1A1C15] truncate">
                {pageLabel}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* Search - Hidden on very small screens */}
        <div className="hidden md:flex items-center gap-2 bg-[#F7F5EE] border-[1.5px] border-[#E8EDD0] rounded-full px-4 py-1.5 mr-2 group focus-within:border-[#4D5A2C] transition-all">
          <Search size={14} className="text-[#9CA396] group-focus-within:text-[#4D5A2C]" />
          <span className="text-[13px] font-bold text-[#9CA396] group-focus-within:text-[#1A1C15]">
            Quick search…
          </span>
        </div>

        <button className="p-2 text-[#9CA396] hover:bg-[#F7F5EE] hover:text-[#4D5A2C] rounded-full transition-all">
          <Bell size={20} strokeWidth={2} />
        </button>

        <button className="hidden sm:flex p-2 text-[#9CA396] hover:bg-[#F7F5EE] hover:text-[#4D5A2C] rounded-full transition-all">
          <Settings size={20} strokeWidth={2} />
        </button>

        <div className="w-[1.5px] h-6 bg-[#E8EDD0] mx-1 sm:mx-2" />

        {/* User Capsule */}
        <div className="flex items-center gap-2 sm:gap-3 bg-white border-[1.5px] border-[#E8EDD0] rounded-full p-1 pl-3.5 sm:pl-4 shadow-sm hover:shadow-md transition-all cursor-pointer">
          <span className="hidden sm:block text-[13px] font-black text-[#1A1C15]">
            {userName}
          </span>
          <div className={`w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center text-[10px] font-black text-white flex-shrink-0 tracking-widest`}>
            {initials}
          </div>
        </div>
      </div>
    </header>
  );
}

