"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import {
  heatmapPoints, mapCenter, ngoPresencePoints, volunteerPresencePoints,
} from "@/lib/mock/admin";
import { apiClient } from "@/lib/api/client";
import { Flame, Building2, Users, Layers, Info, Map as MapIcon, ChevronRight } from "lucide-react";

const DynamicMapView = dynamic(() => import("@/components/shared/MapView"), {
  ssr: false,
  loading: () => (
    <div className="h-full flex flex-col items-center justify-center py-32 gap-6 bg-[#F7F5EE]">
      <div className="w-12 h-12 border-4 border-[#D4DCA8] border-t-[#4D5A2C] rounded-full animate-spin" />
      <p className="text-xs font-black text-[#6B7160] uppercase tracking-[0.3em]">Calibrating Satellite...</p>
    </div>
  ),
});

const TABS = [
  { id: "heat",      label: "Hotspots",       Icon: Flame,     color: "text-[#EF4444]", bg: "bg-[#FEF2F2]" },
  { id: "ngo",       label: "NGO Footprint",  Icon: Building2, color: "text-[#4D5A2C]", bg: "bg-[#EEF3D2]" },
  { id: "volunteer", label: "Volunteers",     Icon: Users,     color: "text-[#166534]", bg: "bg-[#DCFCE7]" },
] as const;

type TabId = typeof TABS[number]["id"];

const CONFIG: Record<TabId, { points: any[]; title: string; description: string; tileStyle: string }> = {
  heat: {
    points:      heatmapPoints,
    title:       "Problem Heatmap",
    description: "Real-time urgency tracking via neighborhood intensity circles. Larger radius indicates higher priority cases.",
    tileStyle:   "Esri Satellite Imagery",
  },
  ngo: {
    points:      ngoPresencePoints,
    title:       "NGO Network",
    description: "Operational footprint of approved NGOs. Zoom to view specific base locations and area overlap.",
    tileStyle:   "Stadia Alidade Smooth",
  },
  volunteer: {
    points:      volunteerPresencePoints,
    title:       "Volunteer Density",
    description: "Live volunteer availability heatmap. Shows deployment-ready personnel clusters across service zones.",
    tileStyle:   "CartoDB Voyager",
  },
};

export default function MapTabs() {
  const [activeTab, setActiveTab] = useState<TabId>("heat");
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

  const config = {
    heat: { ...CONFIG.heat, points: layers.heatmapPoints },
    ngo: { ...CONFIG.ngo, points: layers.ngoPresencePoints },
    volunteer: { ...CONFIG.volunteer, points: layers.volunteerPresencePoints },
  };

  const cfg = config[activeTab];
  const activeTabInfo = TABS.find(t => t.id === activeTab)!;

  const totalValue = useMemo(
    () => cfg.points.reduce((s, p) => s + (p.intensity ?? 1), 0),
    [cfg.points]
  );

  return (
    <div className="flex flex-col gap-8">
      {/* Tab Switcher */}
      <div className="flex bg-[#F7F5EE] p-2 rounded-[24px] border-2 border-[#E8EDD0] self-center sm:self-start overflow-x-auto no-scrollbar max-w-full">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-white text-[#1A1C15] shadow-md" : "text-[#6B7160] hover:text-[#1A1C15]"}`}
          >
            <tab.Icon size={16} className={activeTab === tab.id ? tab.color : "text-current"} strokeWidth={2.5} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-[1fr_360px] gap-8">
        
        {/* Map Container */}
        <div className="bg-white border-2 border-[#E8EDD0] rounded-[48px] overflow-hidden shadow-sm flex flex-col h-[640px]">
          {/* Map Header */}
          <div className={`px-8 py-5 flex flex-col sm:flex-row justify-between items-center gap-4 transition-all duration-500 ${activeTab === 'heat' ? "bg-[#1A1C15] text-white border-b-2 border-white/10" : "bg-white text-[#1A1C15] border-b-2 border-[#F7F5EE]"}`}>
            <div className="flex items-center gap-4">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${activeTab === 'heat' ? "bg-white/10 text-white" : activeTabInfo.bg + ' ' + activeTabInfo.color}`}>
                <activeTabInfo.Icon size={20} strokeWidth={2.5} />
              </div>
              <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'heat' ? "text-white/50" : "text-[#6B7160]"}`}>
                  {cfg.tileStyle}
                </p>
                <h4 className="text-base font-black tracking-tight">{cfg.title}</h4>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full animate-pulse ${activeTab === 'heat' ? "bg-red-500" : "bg-[#4D5A2C]"}`} />
                <span className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'heat' ? "text-white/70" : "text-[#6B7160]"}`}>Live Feed</span>
              </div>
              <div className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${activeTab === 'heat' ? "bg-white/10 text-white" : "bg-[#F7F5EE] text-[#4D5A2C]"}`}>
                {cfg.points.length} Data Points
              </div>
            </div>
          </div>

          {/* Map Viewport */}
          <div className="flex-1 relative">
            <DynamicMapView
              center={layers.center}
              points={cfg.points}
              mode={activeTab}
            />
          </div>
        </div>

        {/* Sidebar Controls */}
        <div className="flex flex-col gap-8 h-[640px] overflow-y-auto no-scrollbar pr-2">
          
          {/* Layer Intel Card */}
          <div className={`p-8 rounded-[40px] border-2 shadow-sm transition-all duration-500 ${activeTab === 'heat' ? "bg-[#1A1C15] border-transparent text-white" : "bg-white border-[#E8EDD0] text-[#1A1C15]"}`}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-white/10 text-white rounded-xl flex items-center justify-center sm:hidden xl:flex">
                <Layers size={18} strokeWidth={2.5} />
              </div>
              <p className={`text-[10px] font-black uppercase tracking-widest ${activeTab === 'heat' ? "text-white/50" : "text-[#6B7160]"}`}>Layer Intelligence</p>
            </div>
            <p className={`text-sm font-medium leading-relaxed mb-8 ${activeTab === 'heat' ? "text-white/80" : "text-[#404535]"}`}>
              {cfg.description}
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className={`p-5 rounded-2xl ${activeTab === 'heat' ? "bg-white/5 border-white/10" : "bg-[#F7F5EE] border-[#E8EDD0]"} border-2`}>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${activeTab === 'heat' ? "text-white/30" : "text-[#6B7160]/60"}`}>Markers</p>
                <p className="text-2xl font-black">{cfg.points.length}</p>
              </div>
              <div className={`p-5 rounded-2xl ${activeTab === 'heat' ? "bg-white/5 border-white/10" : "bg-[#F7F5EE] border-[#E8EDD0]"} border-2`}>
                <p className={`text-[9px] font-black uppercase tracking-widest mb-1 ${activeTab === 'heat' ? "text-white/30" : "text-[#6B7160]/60"}`}>{activeTab === 'heat' ? "Intensity" : "Units"}</p>
                <p className="text-2xl font-black">{totalValue}</p>
              </div>
            </div>
          </div>

          {/* Location Details Feed */}
          <div className="bg-white border-2 border-[#E8EDD0] rounded-[40px] p-8 shadow-sm">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-9 h-9 bg-[#F7F5EE] text-[#4D5A2C] rounded-xl flex items-center justify-center">
                <MapIcon size={18} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Key Locations</p>
            </div>
            <div className="flex flex-col gap-3">
              {cfg.points.slice(0, 5).map((pt) => (
                <div key={pt.id} className="group p-5 bg-[#F7F5EE] border-2 border-transparent hover:border-[#4D5A2C] rounded-3xl transition-all cursor-pointer">
                  <div className="flex justify-between items-start mb-2">
                    <h5 className="text-[13px] font-black text-[#1A1C15] group-hover:text-[#4D5A2C] transition-colors">{pt.label}</h5>
                    {pt.intensity !== undefined && (
                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${pt.intensity > 12 ? "bg-red-100 text-red-600" : "bg-green-100 text-green-700"}`}>
                        {pt.intensity} Pts
                      </span>
                    )}
                  </div>
                  {pt.description && (
                    <p className="text-[11px] font-medium text-[#6B7160] leading-relaxed line-clamp-1 group-hover:line-clamp-none transition-all">
                      {pt.description}
                    </p>
                  )}
                </div>
              ))}
              {cfg.points.length > 5 && (
                <button className="text-[10px] font-black text-[#4D5A2C] uppercase tracking-widest flex items-center justify-center gap-2 py-4 hover:underline">
                  View {cfg.points.length - 5} More <ChevronRight size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Pro Tips */}
          <div className="bg-[#4D5A2C] p-8 rounded-[40px] text-white shadow-lg overflow-hidden relative group">
            <Flame className="absolute -right-4 -bottom-4 w-32 h-32 text-white/5 group-hover:scale-110 transition-transform duration-700" />
            <div className="flex items-center gap-3 mb-6 relative">
              <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
                <Info size={18} strokeWidth={2.5} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Operator Tips</p>
            </div>
            <ul className="space-y-4 relative">
              {[
                "Scroll wheel for precision zoom",
                "Click clusters to expand area",
                "Hover intensity for urgancy count",
                "Switch layers to compare data"
              ].map(tip => (
                <li key={tip} className="text-xs font-bold flex items-start gap-3">
                  <div className="w-1.5 h-1.5 bg-white rounded-full mt-1.5 flex-shrink-0" />
                  {tip}
                </li>
              ))}
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
}

