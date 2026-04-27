"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { getCookie } from "@/lib/utils/cookies";
import { MapPin, Users, ArrowRight, Layers, RefreshCw } from "lucide-react";

const DynamicVolunteerMap = dynamic(() => import("@/components/volunteer/VolunteerMapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-secondary/40 bg-surface-variant/10 rounded-modern">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      <p className="text-xs font-black uppercase tracking-widest">Loading Map...</p>
    </div>
  ),
});

// Default map center — Ahmedabad, Gujarat
const DEFAULT_CENTER: [number, number] = [23.0225, 72.5714];

// Mock camp data when API unavailable
const MOCK_CAMPS = [
  { assignmentId: "c1", requestTitle: "Flood Relief — Medical Support", ngoName: "Sahyog NGO", status: "in_progress", teamName: "Team Alpha", campLocation: { lat: 23.0010, lng: 72.5588, address: "Vasna Relief Camp" }, teamMembers: [{ name: "Rahul M." }, { name: "Sneha K." }] },
  { assignmentId: "c2", requestTitle: "Food Distribution Drive", ngoName: "Annapurna Foundation", status: "in_progress", teamName: "Team Beta", campLocation: { lat: 23.0038, lng: 72.5985, address: "Maninagar Shelter" }, teamMembers: [{ name: "Amit P." }] },
  { assignmentId: "c3", requestTitle: "Psychosocial Support Camp", ngoName: "Mindful Aid", status: "in_progress", teamName: "Team Gamma", campLocation: { lat: 23.0395, lng: 72.5185, address: "Satellite Community Hall" }, teamMembers: [] },
];

export default function VolunteerMapPage() {
  const router = useRouter();
  const [assignments, setAssignments] = useState<any[]>([]);
  const [selected, setSelected] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const volunteerId = getCookie("vb_volunteer_id") || "vol-101";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await apiClient.getVolunteerAssignments(volunteerId);
        const camps = (data?.length > 0 ? data : MOCK_CAMPS).filter(
          (a: any) => a.campLocation?.lat && a.campLocation?.lng
        );
        setAssignments(camps);
        if (camps.length > 0) setSelected(camps[0]);
      } catch {
        setAssignments(MOCK_CAMPS);
        setSelected(MOCK_CAMPS[0]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [volunteerId]);

  const campCenter: [number, number] = selected?.campLocation?.lat
    ? [selected.campLocation.lat, selected.campLocation.lng]
    : DEFAULT_CENTER;

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Camp Map</h1>
          <p className="text-secondary/60 font-medium mt-1">All active camp locations for your assignments.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => { setLoading(true); apiClient.getVolunteerAssignments(volunteerId).then(d => { const c = (d?.length > 0 ? d : MOCK_CAMPS).filter((a: any) => a.campLocation?.lat); setAssignments(c); if (c.length) setSelected(c[0]); setLoading(false); }).catch(() => setLoading(false)); }}
            className="p-3 border-2 border-outline/60 rounded-2xl bg-white hover:border-primary transition-all shadow-sm"
          >
            <RefreshCw size={18} className={`text-secondary/60 ${loading ? "animate-spin" : ""}`} />
          </button>
          <div className="px-5 py-2.5 bg-white border-2 border-outline/60 rounded-2xl shadow-sm text-xs font-black text-secondary/60 uppercase tracking-widest flex items-center gap-2">
            <Layers size={16} />
            {assignments.length} Camps
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" style={{ height: "calc(100vh - 220px)" }}>
        {/* Sidebar: Camp list */}
        <div className="lg:col-span-4 overflow-y-auto space-y-3 pr-1">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-modern border-2 border-outline/40 animate-pulse space-y-3">
                <div className="h-4 bg-surface-variant/50 rounded-lg w-3/4" />
                <div className="h-3 bg-surface-variant/30 rounded-lg w-1/2" />
                <div className="h-3 bg-surface-variant/20 rounded-lg w-2/3" />
              </div>
            ))
          ) : assignments.length > 0 ? (
            assignments.map((asgn: any) => {
              const isSelected = selected?.assignmentId === asgn.assignmentId;
              return (
                <div
                  key={asgn.assignmentId}
                  onClick={() => setSelected(asgn)}
                  className={`bg-white p-6 rounded-modern border-2 cursor-pointer transition-all custom-shadow group ${
                    isSelected ? "border-primary ring-4 ring-primary/10" : "border-outline/60 hover:border-primary/40"
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl transition-all shrink-0 ${
                      isSelected ? "bg-primary text-white" : "bg-primary/10 text-primary group-hover:bg-primary group-hover:text-white"
                    }`}>
                      {asgn.ngoName?.[0] || "C"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`font-black text-sm leading-tight mb-1 truncate ${isSelected ? "text-primary" : "text-on-surface"}`}>
                        {asgn.requestTitle}
                      </h3>
                      <p className="text-xs font-bold text-secondary/60 mb-2">{asgn.ngoName} · {asgn.teamName}</p>
                      <div className="flex items-center gap-1.5 text-xs font-bold text-secondary/50">
                        <MapPin size={12} className="text-primary shrink-0" />
                        <span className="truncate">{asgn.campLocation?.address || "Location set"}</span>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="flex items-center gap-1 text-xs font-bold text-secondary/50">
                          <Users size={12} />
                          {asgn.teamMembers?.length || 0} members
                        </div>
                        <span className="text-[10px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 rounded-full uppercase tracking-widest">
                          {asgn.status?.replace(/_/g, " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                  {isSelected && (
                    <button
                      onClick={(e) => { e.stopPropagation(); router.push("/volunteer/assignments"); }}
                      className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-primary hover:text-white transition-all"
                    >
                      View Assignment <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              );
            })
          ) : (
            <div className="bg-white p-12 rounded-modern border-2 border-dashed border-outline/60 text-center space-y-3">
              <MapPin size={40} className="mx-auto text-secondary/10" />
              <p className="text-sm font-black text-secondary/40">No camps found</p>
              <p className="text-xs text-secondary/30 italic">Once assigned to a team, your camp locations appear here.</p>
            </div>
          )}
        </div>

        {/* Map panel */}
        <div className="lg:col-span-8 rounded-modern overflow-hidden border-2 border-outline/60 custom-shadow relative bg-surface-variant/10">
          {selected ? (
            <>
              {/* Map overlay info */}
              <div className="absolute top-4 left-4 z-[999] bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 border border-outline/40 shadow-lg max-w-xs">
                <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">Active Camp</p>
                <p className="text-sm font-black text-on-surface leading-tight">{selected.requestTitle}</p>
                <p className="text-xs font-bold text-primary mt-0.5">{selected.teamName}</p>
              </div>
              <DynamicVolunteerMap
                campLocation={campCenter}
                teamMembers={selected.teamMembers || []}
                campName={selected.requestTitle}
              />
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-secondary/30">
              <MapPin size={64} strokeWidth={1} />
              <p className="text-sm font-bold">Select a camp from the list</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
