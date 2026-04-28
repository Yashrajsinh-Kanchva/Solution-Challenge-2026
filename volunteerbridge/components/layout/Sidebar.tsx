"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationRoute } from "@/constants/routes";
import {
  LayoutDashboard, Users, BarChart3, HeartHandshake, Brain,
  ShieldCheck, ClipboardList, Map, HelpCircle, LogOut, Zap,
  FileText, History, CheckSquare, UploadCloud, UserCheck,
  Briefcase, UserCircle, Activity, Package, Search, X
} from "lucide-react";

type SidebarProps = { 
  title: string; 
  items: NavigationRoute[];
  isOpen?: boolean;
  onClose?: () => void;
};

const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  "VolunteerBridge": { bg: "bg-[#4D5A2C]", text: "text-white", dot: "bg-[#C8D68A]" },
  "NGO Portal":      { bg: "bg-[#1A5276]", text: "text-white", dot: "bg-[#7FB3D3]" },
  "Volunteer Hub":   { bg: "bg-[#1E5631]", text: "text-white", dot: "bg-[#82E0AA]" },
  "Citizen Portal":  { bg: "bg-[#6E2C00]", text: "text-white", dot: "bg-[#FAD7A0]" },
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

export default function Sidebar({ title, items, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const colors = ROLE_COLORS[title] ?? ROLE_COLORS["VolunteerBridge"];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[55] lg:hidden animate-in fade-in duration-300"
          onClick={onClose}
        />
      )}

      <aside className={`
        fixed top-0 left-0 h-screen w-[17rem] z-[60] bg-white border-r-[1.5px] border-[#E8EDD0]
        shadow-[4px_0_24px_rgba(45,55,20,0.06)] flex flex-col p-6 gap-1 overflow-y-auto overflow-x-hidden
        transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Brand */}
        <div className="mb-8 pb-6 border-b-[1.5px] border-[#E8EDD0]">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3.5">
              <div className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0 shadow-[0_4px_12px_rgba(0,0,0,0.18)]`}>
                <Zap size={18} className="text-white" strokeWidth={2.5} />
              </div>
              <div>
                <h1 className="text-[15px] font-black text-[#1A1C15] tracking-tight leading-tight">
                  {title}
                </h1>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#2E6B32]" />
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#6B7160]">
                    Live System
                  </p>
                </div>
              </div>
            </div>
            {onClose && (
              <button onClick={onClose} className="lg:hidden p-2 text-[#6B7160] hover:bg-[#F7F5EE] rounded-lg transition-colors">
                <X size={20} />
              </button>
            )}
          </div>
        </div>

        {/* Nav items */}
        <nav className="flex-1 flex flex-col gap-0.5">
          {items.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                prefetch={false}
                onClick={onClose}
                className={`
                  flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl transition-all text-sm font-bold
                  ${isActive 
                    ? "bg-[#EEF3D2] text-[#404535] border-l-4 border-[#4D5A2C] pl-2.5" 
                    : "text-[#6B7160] hover:bg-[#F7F5EE] hover:text-[#404535] border-l-4 border-transparent"
                  }
                `}
              >
                <span className={`flex-shrink-0 transition-colors ${isActive ? "text-[#4D5A2C]" : "text-[#9CA396]"}`}>
                  {getIcon(item.href)}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="mt-auto pt-5 border-t-[1.5px] border-[#E8EDD0] flex flex-col gap-0.5">
          <Link 
            href="/support" 
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[#6B7160] font-bold text-[13px] hover:bg-[#F7F5EE] transition-all"
          >
            <HelpCircle size={17} strokeWidth={2} />
            Support
          </Link>
          <Link 
            href="/login" 
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-[#A81919] font-black text-[13px] hover:bg-[#FDECEA] transition-all"
          >
            <LogOut size={17} strokeWidth={2} />
            Sign Out
          </Link>
        </div>
      </aside>
    </>
  );
}

