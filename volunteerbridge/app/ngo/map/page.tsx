"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { getCookie } from "@/lib/utils/cookies";
import { 
  Flame, Building2, Users, Layers, 
  Search, Filter, Map as MapIcon,
  RefreshCw, Navigation
} from "lucide-react";

const DynamicNgoMap = dynamic(() => import("@/components/ngo/NgoMapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-secondary/40 font-black uppercase tracking-widest bg-surface-variant/10">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      Initializing Cartography...
    </div>
  ),
});

export default function NgoMap() {
  const [requests, setRequests] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [ngo, setNgo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Filters
  const [filterUrgency, setFilterUrgency] = useState<string>("all");
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const ngoId = getCookie("vb_ngo_id") || "ngo-1";

  useEffect(() => {
    fetchData();
  }, [ngoId]);

  const fetchData = async () => {
    setLoading(true);
    const [reqData, volData, stats] = await Promise.all([
      apiClient.getNgoRequests(ngoId),
      apiClient.getNgoVolunteers(ngoId),
      apiClient.getNgoStats(ngoId)
    ]);
    
    setRequests(reqData || []);
    setVolunteers((volData || []).filter((v: any) => v.availability));
    
    // In a real app, the stats would include the NGO detail or we'd have a getNgo method
    // For now we simulate the NGO location from the first request or a default
    setNgo({
      id: ngoId,
      name: "Your Organization",
      location: { lat: 23.0225, lng: 72.5714, address: "Our Location" }
    });
    
    setLoading(false);
  };

  const handleAssign = async (requestId: string, volunteerId: string) => {
    try {
      await apiClient.assignVolunteer(requestId, volunteerId);
      await fetchData(); // Refresh all data
    } catch (error) {
      console.error("Assignment failed:", error);
    }
  };

  const filteredRequests = useMemo(() => {
    return requests.filter(req => {
      const matchUrgency = filterUrgency === "all" || req.urgency.toLowerCase() === filterUrgency.toLowerCase();
      const matchCategory = filterCategory === "all" || req.category.toLowerCase() === filterCategory.toLowerCase();
      // Only show requests that are assigned to this NGO and NOT yet completed
      const isActive = req.status !== "completed" && req.status !== "Rejected";
      return matchUrgency && matchCategory && isActive;
    });
  }, [requests, filterUrgency, filterCategory]);

  const categories = Array.from(new Set(requests.map(r => r.category)));

  if (loading && !ngo) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-200px)]">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-[calc(100vh-140px)] flex flex-col gap-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-on-surface">Task Map</h1>
          <p className="text-secondary/60 font-medium mt-1">View all active tasks on the map.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border-2 border-outline/60 rounded-button text-xs font-black text-secondary hover:border-primary transition-all shadow-sm"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh Data
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 overflow-hidden">
        {/* Sidebar Filters */}
        <div className="col-span-3 space-y-6 overflow-y-auto pr-2">
          <div className="bg-white rounded-modern border-2 border-outline/60 p-6 custom-shadow">
            <h4 className="text-xs font-black text-secondary/40 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Filter size={16} />
              Filters
            </h4>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-on-surface uppercase tracking-widest mb-2 block">Urgency</label>
                <div className="grid grid-cols-2 gap-2">
                  {["all", "critical", "high", "medium", "low"].map(u => (
                    <button 
                      key={u}
                      onClick={() => setFilterUrgency(u)}
                      className={`px-3 py-2 rounded-lg text-[10px] font-black uppercase tracking-tighter border-2 transition-all ${
                        filterUrgency === u ? "bg-primary border-primary text-white" : "bg-white border-outline/60 text-secondary hover:border-primary/40"
                      }`}
                    >
                      {u}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-on-surface uppercase tracking-widest mb-2 block">Category</label>
                <select 
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className="w-full px-4 py-3 bg-surface-variant/30 border-2 border-outline/60 rounded-button text-xs font-bold text-on-surface focus:border-primary focus:outline-none"
                >
                  <option value="all">All Categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-on-surface text-white rounded-modern p-6 custom-shadow">
            <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Navigation size={14} />
              Map Legend
            </h4>
            <div className="space-y-3">
              {[
                { label: "Our Location", color: "bg-green-500" },
                { label: "Active Volunteers", color: "bg-blue-600" },
                { label: "Critical Needs", color: "bg-red-500" },
                { label: "Standard Needs", color: "bg-orange-400" },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${item.color} border-2 border-white/20`} />
                  <span className="text-xs font-bold text-white/80">{item.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-primary/10 border-2 border-primary/20 rounded-modern p-6 text-center">
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">Summary</p>
            <p className="text-lg font-black text-on-surface">{filteredRequests.length} tasks</p>
            <p className="text-[10px] font-medium text-secondary/60 mt-2">In your area</p>
          </div>
        </div>

        {/* Map Container */}
        <div className="col-span-9 bg-white rounded-modern border-2 border-outline/60 custom-shadow overflow-hidden relative">
          <DynamicNgoMap 
            center={[23.0225, 72.5714]}
            requests={filteredRequests}
            volunteers={volunteers}
            ngoLocation={[23.0225, 72.5714]}
            onAssign={handleAssign}
          />
        </div>
      </div>
    </div>
  );
}
