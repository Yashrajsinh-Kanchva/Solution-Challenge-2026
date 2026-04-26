"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  heatmapPoints, mapCenter, ngoPresencePoints, volunteerPresencePoints,
} from "@/lib/mock/admin";
import { apiClient } from "@/lib/api/client";
import { Flame, Building2, Users, Layers, Info, ZoomIn } from "lucide-react";

const DynamicMapView = dynamic(() => import("@/components/shared/MapView"), {
  ssr: false,
  loading: () => (
    <div style={{
      height:"100%", display:"flex", alignItems:"center", justifyContent:"center",
      gap:"0.75rem", color:"#6b7466", fontWeight:600, fontSize:"0.9rem",
    }}>
      <div style={{ width:20, height:20, border:"2px solid #ccd6a6", borderTopColor:"#59623c", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
      Loading map…
    </div>
  ),
});

const TABS = [
  { id:"heat",      label:"Problem Heatmap",   Icon:Flame,     color:"#ef4444" },
  { id:"ngo",       label:"NGO Presence",       Icon:Building2, color:"#59623c" },
  { id:"volunteer", label:"Volunteer Density",  Icon:Users,     color:"#2e7d32" },
] as const;

type TabId = typeof TABS[number]["id"];

const CONFIG: Record<TabId, { points: any[]; title: string; description: string; tileStyle: string }> = {
  heat: {
    points:      heatmapPoints,
    title:       "Problem Heatmap",
    description: "High-intensity circles mark hotspot neighborhoods. Larger circle = more urgent. Overlaps are intentional to show density.",
    tileStyle:   "Esri Satellite Imagery",
  },
  ngo: {
    points:      ngoPresencePoints,
    title:       "NGO Presence",
    description: "Clustered pin markers show NGO locations. Zoom in to separate nearby NGOs. Click a cluster to expand.",
    tileStyle:   "Stadia Alidade Smooth",
  },
  volunteer: {
    points:      volunteerPresencePoints,
    title:       "Volunteer Density",
    description: "Clustered markers show volunteer deployment zones. Zoom in to see individual locations.",
    tileStyle:   "CartoDB Voyager",
  },
};

export default function MapTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("heat");
  const [selectedPoint, setSelectedPoint] = useState<any | null>(null);
  const [layers, setLayers] = useState({
    center: mapCenter,
    heatmapPoints,
    ngoPresencePoints,
    volunteerPresencePoints,
  });

  useEffect(() => {
    apiClient.getMapLayers().then((data) => {
      setLayers((current) => ({
        center: data.center ?? current.center,
        heatmapPoints: data.heatmapPoints ?? current.heatmapPoints,
        ngoPresencePoints: data.ngoPresencePoints ?? current.ngoPresencePoints,
        volunteerPresencePoints: data.volunteerPresencePoints ?? current.volunteerPresencePoints,
      }));
    }).catch(console.error);
  }, []);

  const config: Record<TabId, { points: any[]; title: string; description: string; tileStyle: string }> = {
    heat: { ...CONFIG.heat, points: layers.heatmapPoints },
    ngo: { ...CONFIG.ngo, points: layers.ngoPresencePoints },
    volunteer: { ...CONFIG.volunteer, points: layers.volunteerPresencePoints },
  };

  const cfg = config[activeTab];
  const tab = TABS.find(t => t.id === activeTab)!;

  // Summary stats for sidebar
  const totalIntensity = useMemo(
    () => cfg.points.reduce((s, p) => s + (p.intensity ?? 1), 0),
    [cfg.points]
  );

  return (
    <div style={{ display:"flex", flexDirection:"column", gap:"1.25rem" }}>

      {/* Tab bar */}
      <div className="tab-row">
        {TABS.map(({ id, label, Icon, color }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`tab-button ${activeTab === id ? "active" : ""}`}
            style={{ display:"flex", alignItems:"center", gap:"0.45rem" }}
          >
            <Icon size={14} color={activeTab === id ? color : undefined} />
            {label}
          </button>
        ))}
      </div>

      {/* Map + sidebar layout */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 280px", gap:"1.25rem", alignItems:"start" }}>

        {/* Map card */}
        <div className="tool-surface" style={{ padding:0, overflow:"hidden", height:520 }}>
          {/* Map header bar */}
          <div style={{
            padding:"0.85rem 1.25rem",
            borderBottom:"2px solid rgba(204,214,166,0.5)",
            display:"flex", justifyContent:"space-between", alignItems:"center",
            background: activeTab === "heat" ? "#1a1a2e" : "#fff",
            color:       activeTab === "heat" ? "white" : "#1c1c18",
            transition: "background 0.4s",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.6rem" }}>
              <tab.Icon size={16} color={tab.color} />
              <div>
                <p style={{ fontSize:"0.68rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color: activeTab === "heat" ? "#ccd6a6" : "#6b7466" }}>
                  {cfg.tileStyle}
                </p>
                <strong style={{ fontSize:"0.9rem" }}>{cfg.title}</strong>
              </div>
            </div>
            <div style={{ display:"flex", alignItems:"center", gap:"0.75rem" }}>
              {/* Legend */}
              <div style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.72rem", fontWeight:600,
                color: activeTab === "heat" ? "#e5e7eb" : "#6b7466" }}>
                <div style={{ width:10, height:10, borderRadius:"50%", background:tab.color }} />
                {activeTab === "heat" ? "Higher intensity" : "Active location"}
              </div>
              <div style={{
                background: activeTab === "heat" ? "rgba(255,255,255,0.1)" : "#f6f3ed",
                border:"1px solid rgba(204,214,166,0.4)",
                borderRadius:8, padding:"3px 8px", fontSize:"0.7rem", fontWeight:700,
                color: activeTab === "heat" ? "white" : "#59623c",
              }}>
                {cfg.points.length} points
              </div>
            </div>
          </div>

          {/* The actual map */}
          <div style={{ height:"calc(100% - 56px)" }}>
            <DynamicMapView
              center={layers.center}
              points={cfg.points}
              mode={activeTab}
            />
          </div>
        </div>

        {/* Sidebar */}
        <div style={{ display:"flex", flexDirection:"column", gap:"1rem" }}>

          {/* Active layer info */}
          <div className="tool-surface" style={{
            background: activeTab === "heat" ? "#1c1c2e" : undefined,
            color:       activeTab === "heat" ? "white" : undefined,
            transition: "background 0.4s",
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.75rem" }}>
              <Layers size={14} color={tab.color} />
              <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color: activeTab === "heat" ? "#ccd6a6" : "#6b7466" }}>
                Active Layer
              </p>
            </div>
            <p style={{ fontSize:"0.82rem", lineHeight:1.65, color: activeTab === "heat" ? "#d1d5db" : "#46483e" }}>
              {cfg.description}
            </p>
            <div style={{
              marginTop:"0.85rem", display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem",
            }}>
              <div style={{ background: activeTab === "heat" ? "rgba(255,255,255,0.07)" : "#f6f3ed", borderRadius:8, padding:"0.6rem 0.75rem" }}>
                <p style={{ fontSize:"0.6rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color: activeTab === "heat" ? "#9ca3af" : "#6b7466" }}>Markers</p>
                <strong style={{ fontSize:"1.5rem", fontWeight:900, color: tab.color }}>{cfg.points.length}</strong>
              </div>
              <div style={{ background: activeTab === "heat" ? "rgba(255,255,255,0.07)" : "#f6f3ed", borderRadius:8, padding:"0.6rem 0.75rem" }}>
                <p style={{ fontSize:"0.6rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color: activeTab === "heat" ? "#9ca3af" : "#6b7466" }}>
                  {activeTab === "heat" ? "Total Intensity" : "Total Units"}
                </p>
                <strong style={{ fontSize:"1.5rem", fontWeight:900, color: tab.color }}>{totalIntensity}</strong>
              </div>
            </div>
          </div>

          {/* Point list */}
          <div className="tool-surface">
            <div style={{ display:"flex", alignItems:"center", gap:"0.5rem", marginBottom:"0.75rem" }}>
              <Info size={14} color="#6b7466" />
              <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#6b7466" }}>
                Location Details
              </p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem" }}>
              {cfg.points.map((pt, i) => (
                <div key={pt.id} style={{
                  padding:"0.65rem 0.75rem", borderRadius:10,
                  border:"1.5px solid #e8edca", background:"#f6f9ee",
                  cursor:"default",
                }}>
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:3 }}>
                    <strong style={{ fontSize:"0.82rem", color:"#1c1c18" }}>{pt.label}</strong>
                    {pt.intensity !== undefined && (
                      <span style={{
                        fontSize:"0.65rem", fontWeight:700, padding:"2px 7px", borderRadius:999,
                        background: pt.intensity > 12 ? "#fef2f2" : pt.intensity > 8 ? "#fffbeb" : "#f0fdf4",
                        color:      pt.intensity > 12 ? "#ba1a1a" : pt.intensity > 8 ? "#b45309" : "#2e7d32",
                        border:     `1px solid ${pt.intensity > 12 ? "#fecaca" : pt.intensity > 8 ? "#fde68a" : "#bbf7d0"}`,
                      }}>
                        {pt.intensity}
                      </span>
                    )}
                  </div>
                  {pt.description && (
                    <p style={{ fontSize:"0.72rem", color:"#6b7466", lineHeight:1.5 }}>{pt.description}</p>
                  )}
                  {pt.intensity !== undefined && (
                    <div style={{ marginTop:5 }}>
                      <div style={{ height:4, borderRadius:999, background:"#e8edca" }}>
                        <div style={{
                          height:"100%", borderRadius:999,
                          width:`${Math.min(100, pt.intensity * 6)}%`,
                          background: pt.intensity > 12 ? "#ef4444" : pt.intensity > 8 ? "#f59e0b" : "#22c55e",
                          transition:"width 0.5s ease",
                        }} />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Map tips */}
          <div className="tool-surface" style={{ background:"#f6f9ee", border:"1.5px solid #ccd6a6" }}>
            <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#59623c", marginBottom:"0.5rem" }}>
              💡 Map Tips
            </p>
            <ul style={{ paddingLeft:"1rem", margin:0, display:"grid", gap:"0.35rem" }}>
              {[
                "Scroll to zoom in/out",
                "Click markers for details",
                "Move mouse to see coordinates",
                "Switch tabs to change layer",
              ].map(tip => (
                <li key={tip} style={{ fontSize:"0.75rem", color:"#46483e", lineHeight:1.5 }}>{tip}</li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}
