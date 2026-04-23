"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { NavigationRoute } from "@/constants/routes";
import { 
  LayoutDashboard, 
  Users, 
  BarChart3, 
  HandHeart, 
  BrainCircuit, 
  ShieldCheck, 
  MapPin, 
  Map 
} from "lucide-react";

type SidebarProps = {
  title: string;
  items: NavigationRoute[];
};

// Map routes to icons
const getIcon = (href: string) => {
  if (href.includes("dashboard")) return <LayoutDashboard size={20} />;
  if (href.includes("users")) return <Users size={20} />;
  if (href.includes("analytics")) return <BarChart3 size={20} />;
  if (href.includes("needs")) return <HandHeart size={20} />;
  if (href.includes("predictions")) return <BrainCircuit size={20} />;
  if (href.includes("ngo-approvals")) return <ShieldCheck size={20} />;
  if (href.includes("assignments")) return <MapPin size={20} />;
  if (href.includes("maps")) return <Map size={20} />;
  return <LayoutDashboard size={20} />;
};

export default function Component({ title, items }: SidebarProps) {
  const pathname = usePathname();

  return (
    <aside className="admin-sidebar">
      <div className="sidebar-brand">
        <div className="sidebar-brand-icon">
          <span>*</span>
        </div>
        <div>
          <h2>Ops</h2>
          <p className="sidebar-brand__eyebrow">DISTRICT 7 HUB</p>
        </div>
      </div>
      <nav className="sidebar-nav">
        <ul>
          {items.map((item) => {
            const isActive =
              pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href} className={isActive ? "active" : ""}>
                <Link href={item.href} prefetch={false}>
                  {getIcon(item.href)}
                  <span>{item.label}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="sidebar-footer">
        <Link href="/support" className="sidebar-footer-link">
          <MapPin size={20} />
          <span>Support</span>
        </Link>
        <Link href="/login" className="sidebar-footer-link logout-link">
          <ShieldCheck size={20} />
          <span>Sign Out</span>
        </Link>
      </div>
    </aside>
  );
}
