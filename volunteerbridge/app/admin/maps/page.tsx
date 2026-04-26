import MapTabs from "@/components/admin/MapTabs";
import { heatmapPoints, ngoPresencePoints, volunteerPresencePoints } from "@/lib/mock/admin";
import { Flame, Building2, Users, Globe } from "lucide-react";

export default function MapsPage() {
  const totalIntensity = heatmapPoints.reduce((s, p) => s + (p.intensity ?? 0), 0);

  return (
    <div className="page-stack">
      <section className="page-header">
        <div>
          <p className="page-header__eyebrow">Feature 8</p>
          <h2>Operational Map Intelligence</h2>
          <p>Three live map layers — problem heatmap, NGO footprint, and volunteer density across service zones.</p>
        </div>
      </section>

      {/* KPI strip */}
      <div className="metric-grid">
        {[
          { label:"Hotspot Zones",      val:heatmapPoints.length,       sub:`${totalIntensity} total intensity`, Icon:Flame,     color:"#ef4444" },
          { label:"NGO Locations",      val:ngoPresencePoints.length,    sub:"Mapped HQ locations",              Icon:Building2, color:"#59623c" },
          { label:"Volunteer Clusters", val:volunteerPresencePoints.length, sub:"Active deployment zones",       Icon:Users,     color:"#2e7d32" },
          { label:"Coverage Area",      val:"3 km²",                    sub:"Ahmedabad central",                 Icon:Globe,     color:"#1d4ed8" },
        ].map(({ label, val, sub, Icon, color }) => (
          <div key={label} className="metric-card">
            <div className="metric-card__meta">
              <p>{label}</p>
              <h3>{val}</h3>
              <span>{sub}</span>
            </div>
            <div className="metric-card__icon" style={{ background: color + "18", color }}>
              <Icon size={20} strokeWidth={2} />
            </div>
          </div>
        ))}
      </div>

      <MapTabs />
    </div>
  );
}
