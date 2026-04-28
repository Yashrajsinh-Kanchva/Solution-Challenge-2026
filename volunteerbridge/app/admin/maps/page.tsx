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
    <div className="page-stack max-w-[1440px] mx-auto">
      {/* Header Section */}
      <section className="flex flex-col xl:flex-row justify-between items-center gap-8 mb-12">
        <div className="max-w-3xl w-full text-center xl:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1C15] tracking-tight leading-[1.1] mb-3">
            Operational Map Intelligence
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#6B7160] leading-relaxed">
            Three live map layers — problem heatmap, NGO footprint, and volunteer density across service zones.
          </p>
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Hotspot Zones", val: heatmapPoints.length, sub: `${totalIntensity} total intensity`, Icon: Flame, color: "text-[#EF4444]", bg: "bg-[#FEF2F2]" },
          { label: "NGO Locations", val: ngoCount, sub: "Approved NGOs mapped", Icon: Building2, color: "text-[#4D5A2C]", bg: "bg-[#EEF3D2]" },
          { label: "Volunteer Clusters", val: volunteerCount, sub: "Ready for deployment", Icon: Users, color: "text-[#166534]", bg: "bg-[#DCFCE7]" },
          { label: "Coverage Area", val: "3 km²", sub: "Ahmedabad central", Icon: Globe, color: "text-[#1D4ED8]", bg: "bg-[#DBEAFE]" },
        ].map((item) => (
          <div key={item.label} className="bg-white p-7 rounded-[32px] border-2 border-transparent hover:border-[#E8EDD0] shadow-sm flex flex-col gap-5 transition-all hover:translate-y-[-4px]">
            <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}>
              <item.Icon size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[12px] font-black text-[#4D5A2C] uppercase tracking-wider mb-1">{item.label}</p>
              <h3 className="text-4xl font-black text-[#1A1C15] mb-1">{item.val}</h3>
              <p className="text-[11px] font-bold text-[#9CA396] uppercase tracking-widest">{item.sub}</p>
            </div>
          </div>
        ))}
      </section>

      <MapTabs />
    </div>
  );
}

