"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { getCookie } from "@/lib/utils/cookies";
import { 
  Users, MapPin, Phone, Mail, 
  Search, Filter, MoreHorizontal, Circle
} from "lucide-react";
import VolunteerProfileModal from "./VolunteerProfileModal";

export default function NgoVolunteers() {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedVolunteer, setSelectedVolunteer] = useState<any | null>(null);
  const ngoId = getCookie("vb_ngo_id") || "ngo-1";

  const [fetchingId, setFetchingId] = useState<string | null>(null);

  useEffect(() => {
    apiClient.getNgoVolunteers(ngoId)
      .then(setVolunteers)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleViewProfile = async (volunteer: any) => {
    setFetchingId(volunteer.volunteerId);
    try {
      const latestData = await apiClient.getVolunteer(volunteer.volunteerId);
      setSelectedVolunteer(latestData || volunteer);
    } catch (error) {
      console.error("Failed to fetch latest volunteer data:", error);
      setSelectedVolunteer(volunteer);
    } finally {
      setFetchingId(null);
    }
  };

  const filtered = volunteers.filter(v => 
    (v.name?.toLowerCase().includes(search.toLowerCase()) ||
    v.skills?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))) ?? false
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Volunteers</h1>
          <p className="text-secondary/60 font-medium mt-1">View and manage your volunteer team.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search volunteers..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-12 pr-6 py-3.5 bg-white border-2 border-outline/60 rounded-2xl text-sm font-bold focus:border-primary outline-none transition-all w-80 shadow-sm"
            />
          </div>
          <button className="p-3.5 border-2 border-outline/60 rounded-2xl bg-white hover:border-primary hover:bg-primary/5 transition-all shadow-sm">
            <Filter size={20} className="text-secondary/60" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((v) => (
          <div key={v.volunteerId} className="bg-white rounded-modern border-2 border-outline/60 custom-shadow overflow-hidden group hover:border-primary/40 transition-all duration-300 flex flex-col">
            <div className="p-8 flex-1">
              <div className="flex justify-between items-start mb-6">
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-2xl shadow-sm border border-primary/20 group-hover:scale-105 transition-transform">
                  {v.name.charAt(0)}
                </div>
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border-2 shadow-sm ${
                  v.availability ? "bg-green-50 border-green-100 text-green-600" : "bg-orange-50 border-orange-100 text-orange-600"
                }`}>
                  <Circle size={8} className={v.availability ? "fill-green-600" : "fill-orange-600"} />
                  <span className="text-[10px] font-black uppercase tracking-widest">
                    {v.availability ? "Available" : "Busy"}
                  </span>
                </div>
              </div>

              <h4 className="text-xl font-black text-on-surface mb-1 group-hover:text-primary transition-colors">{v.name}</h4>
              <p className="text-xs font-bold text-secondary/40 flex items-center gap-2 mb-6">
                <MapPin size={14} className="text-primary/60" /> {v?.location?.address ?? "Main Area"}
              </p>

              <div className="flex flex-wrap gap-2 mb-8">
                {v.skills.map((skill: string) => (
                  <span key={skill} className="text-[9px] font-black px-3 py-1.5 bg-surface-variant/50 text-secondary/70 rounded-lg border border-outline/40 uppercase tracking-widest">
                    {skill}
                  </span>
                ))}
              </div>

              <div className="space-y-3 pt-6 border-t-2 border-outline/30">
                <div className="flex items-center gap-3 text-xs font-bold text-secondary/60">
                  <div className="w-8 h-8 rounded-lg bg-surface-variant/20 flex items-center justify-center">
                    <Phone size={14} />
                  </div>
                  {v.phone}
                </div>
                <div className="flex items-center gap-3 text-xs font-bold text-secondary/60">
                  <div className="w-8 h-8 rounded-lg bg-surface-variant/20 flex items-center justify-center">
                    <Mail size={14} />
                  </div>
                  {v.email}
                </div>
              </div>
            </div>
            
            <div className="px-8 py-5 bg-surface-variant/10 border-t-2 border-outline/30 flex justify-between items-center group-hover:bg-surface-variant/20 transition-colors">
              <button 
                disabled={fetchingId === v.volunteerId}
                onClick={() => handleViewProfile(v)}
                className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline disabled:opacity-50 disabled:no-underline flex items-center gap-2"
              >
                {fetchingId === v.volunteerId ? (
                   <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : null}
                View Profile
              </button>
              <button className="p-2 hover:bg-white rounded-xl border border-transparent hover:border-outline/40 transition-all">
                <MoreHorizontal size={18} className="text-secondary/60" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-20 bg-white rounded-modern border-2 border-dashed border-outline/60">
          <p className="text-secondary/40 font-bold">No volunteers found matching your search</p>
        </div>
      )}

      {selectedVolunteer && (
        <VolunteerProfileModal 
          volunteer={selectedVolunteer} 
          onClose={() => setSelectedVolunteer(null)} 
        />
      )}
    </div>
  );
}
