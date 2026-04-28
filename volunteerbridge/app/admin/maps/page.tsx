"use client";
import { useEffect, useState } from "react";
import MapTabs from "@/components/admin/MapTabs";
import { heatmapPoints, ngoPresencePoints, volunteerPresencePoints } from "@/lib/mock/admin";
import { apiClient } from "@/lib/api/client";
import { Flame, Building2, Users, Globe } from "lucide-react";

export default function MapsPage() {
  const totalIntensity = heatmapPoints.reduce((s, p) => s + (p.intensity ?? 0), 0);
  const [ngoCount, setNgoCount] = useState(ngoPresencePoints.length);
  const [volunteerCount, setVolunteerCount] = useState(volunteerPresencePoints.length);

  useEffect(() => {
    Promise.all([apiClient.getNgos(), apiClient.getAllVolunteers()])
      .then(([ngos, volunteers]) => {
        if (ngos?.length) setNgoCount(ngos.filter((n: any) => n.status === "approved").length);
        if (volunteers?.length) setVolunteerCount(volunteers.filter((v: any) => v.availability || v.status === "idle").length);
      })
      .catch(console.error);
  }, []);

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
          { label:"Hotspot Zones",      val:heatmapPoints.length,  sub:`${totalIntensity} total intensity`, Icon:Flame,     color:"#ef4444" },
          { label:"NGO Locations",      val:ngoCount,               sub:"Approved NGOs mapped",            Icon:Building2, color:"#59623c" },
          { label:"Volunteer Clusters", val:volunteerCount,         sub:"Available for deployment",        Icon:Users,     color:"#2e7d32" },
          { label:"Coverage Area",      val:"3 km²",               sub:"Ahmedabad central",                Icon:Globe,     color:"#1d4ed8" },
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
