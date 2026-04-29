"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { getCookie } from "@/lib/utils/cookies";
import { 
  Users, MapPin, Phone, Mail, 
  CheckCircle, XCircle, Clock, Search, Filter, AlertCircle
} from "lucide-react";

export default function VolunteerRequestsPage() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actioningId, setActioningId] = useState<string | null>(null);
  const ngoId = getCookie("vb_ngo_id") || "ngo-1";

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const data = await apiClient.getVolunteerJoinRequests(ngoId);
      setRequests(data);
    } catch (error) {
      console.error("Failed to fetch volunteer requests:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  const handleAction = async (requestId: string, action: "APPROVE" | "REJECT") => {
    setActioningId(requestId);
    try {
      await apiClient.handleVolunteerJoinRequest(ngoId, requestId, action);
      if (action === "APPROVE") {
        alert("Volunteer approved and added successfully");
      }
      await fetchRequests(); // Refresh list
    } catch (error) {
      console.error(`Failed to ${action.toLowerCase()} request:`, error);
    } finally {
      setActioningId(null);
    }
  };

  const filtered = requests.filter(req => 
    (req.name?.toLowerCase().includes(search.toLowerCase()) ||
    req.skills?.some((s: string) => s.toLowerCase().includes(search.toLowerCase()))) ?? false
  );

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-orange-50 text-orange-600 border-orange-100";
      case "APPROVED": return "bg-green-50 text-green-600 border-green-100";
      case "REJECTED": return "bg-red-50 text-red-600 border-red-100";
      default: return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING": return <Clock size={12} />;
      case "APPROVED": return <CheckCircle size={12} />;
      case "REJECTED": return <XCircle size={12} />;
      default: return null;
    }
  };

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
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Volunteer Requests</h1>
          <p className="text-secondary/60 font-medium mt-1">Review and approve new volunteers joining your organization.</p>
        </div>
        <div className="flex gap-4">
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-secondary/30 group-focus-within:text-primary transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Search requests..."
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

      <div className="grid grid-cols-1 gap-6">
        {filtered.length > 0 ? (
          filtered.map((req) => (
            <div key={req.id} className="bg-white rounded-modern border-2 border-outline/60 custom-shadow overflow-hidden group hover:border-primary/40 transition-all duration-300">
              <div className="p-8 flex items-center justify-between">
                <div className="flex items-center gap-8">
                  <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-2xl shadow-sm border border-primary/20 group-hover:scale-105 transition-transform">
                    {req.name.charAt(0)}
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h4 className="text-2xl font-black text-on-surface">{req.name}</h4>
                      <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-[10px] font-black uppercase tracking-widest ${getStatusStyles(req?.status)}`}>
                        {getStatusIcon(req?.status)}
                        {req?.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-6 text-sm font-bold text-secondary/60">
                      <div className="flex items-center gap-2">
                        <MapPin size={16} className="text-primary" />
                        {req.location?.address || "Main Area"}
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone size={16} className="text-primary" />
                        {req.phone}
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail size={16} className="text-primary" />
                        {req.email}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {req.skills?.map((skill: string) => (
                        <span key={skill} className="text-[10px] font-black px-3 py-1 bg-surface-variant/50 text-secondary/70 rounded-lg border border-outline/40 uppercase tracking-widest">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                {req?.status === "PENDING" && (
                  <div className="flex gap-4">
                    <button 
                      disabled={actioningId === req.id}
                      onClick={() => handleAction(req.id, "APPROVE")}
                      className="flex items-center gap-2 px-8 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-button hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50"
                    >
                      {actioningId === req.id ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <CheckCircle size={18} /> Approve
                        </>
                      )}
                    </button>
                    <button 
                      disabled={actioningId === req.id}
                      onClick={() => handleAction(req.id, "REJECT")}
                      className="flex items-center gap-2 px-8 py-4 border-2 border-red-500/20 text-red-500 font-black text-xs uppercase tracking-widest rounded-button hover:bg-red-50 transition-all active:scale-95 disabled:opacity-50"
                    >
                      <XCircle size={18} /> Reject
                    </button>
                  </div>
                )}

                {req.status !== "PENDING" && (
                  <div className="text-right">
                    <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">Processed On</p>
                    <p className="text-xs font-bold text-on-surface">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-24 bg-white rounded-modern border-2 border-dashed border-outline/60 space-y-4">
            <Users size={48} className="mx-auto text-secondary/20" />
            <h3 className="text-xl font-black text-secondary/40">No volunteer requests</h3>
            <p className="text-sm text-secondary/40 font-medium italic">New join requests will appear here for review.</p>
          </div>
        )}
      </div>
    </div>
  );
}
