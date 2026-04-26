"use client";

import { useEffect, useState } from "react";
import { apiClient } from "@/lib/api/client";
import { getCookie } from "@/lib/utils/cookies";
import { 
  Zap, Clock, CheckCircle, XCircle, 
  MapPin, Phone, Mail, LogOut 
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function VolunteerDashboard() {
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // In a real app, this would come from auth context
  const volunteerId = getCookie("vb_volunteer_id") || "vol-101"; 

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await apiClient.getVolunteerJoinRequestsByVolunteerId(volunteerId);
        setRequests(data);
      } catch (error) {
        console.error("Failed to fetch requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [volunteerId]);

  const handleLogout = () => {
    document.cookie = "vb_role=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    document.cookie = "vb_volunteer_id=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    router.push("/login");
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "PENDING": return "bg-orange-50 text-orange-600 border-orange-100";
      case "APPROVED": return "bg-green-50 text-green-600 border-green-100";
      case "REJECTED": return "bg-red-50 text-red-600 border-red-100";
      default: return "bg-gray-50 text-gray-600 border-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface p-8 animate-in fade-in duration-1000">
      <div className="max-w-4xl mx-auto space-y-10">
        <header className="flex justify-between items-center bg-white p-8 rounded-modern border-2 border-outline/60 custom-shadow">
          <div className="flex items-center gap-6">
            <div className="w-16 h-16 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
              <Zap size={32} strokeWidth={2.5} />
            </div>
            <div>
              <h1 className="text-3xl font-black text-on-surface tracking-tight leading-none">Volunteer Portal</h1>
              <p className="text-xs font-bold text-secondary/40 mt-2 uppercase tracking-widest">Track your membership and assignments</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="p-4 border-2 border-outline/60 rounded-2xl hover:border-red-500/40 hover:bg-red-50 transition-all text-secondary/60 hover:text-red-500"
          >
            <LogOut size={20} />
          </button>
        </header>

        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-black text-on-surface uppercase tracking-widest flex items-center gap-3">
              <Clock className="text-primary" size={20} />
              Join Requests
            </h2>
          </div>

          {requests.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {requests.map((req) => (
                <div key={req.id} className="bg-white rounded-modern border-2 border-outline/60 p-8 custom-shadow flex items-center justify-between group hover:border-primary/40 transition-all">
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <h3 className="text-2xl font-black text-on-surface tracking-tight">Request to join NGO</h3>
                      <span className={`px-4 py-1.5 rounded-full border-2 text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${getStatusStyles(req.status)}`}>
                        {req.status === "PENDING" && <Clock size={14} />}
                        {req.status === "APPROVED" && <CheckCircle size={14} />}
                        {req.status === "REJECTED" && <XCircle size={14} />}
                        {req.status}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-x-12 gap-y-3">
                      <div className="flex items-center gap-3 text-sm font-bold text-secondary/60">
                        <MapPin size={16} className="text-primary/60" />
                        {req.location?.address || "Main Area"}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-secondary/60">
                        <Phone size={16} className="text-primary/60" />
                        {req.phone}
                      </div>
                      <div className="flex items-center gap-3 text-sm font-bold text-secondary/60">
                        <Mail size={16} className="text-primary/60" />
                        {req.email}
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right space-y-1">
                    <p className="text-[10px] font-black text-secondary/30 uppercase tracking-widest">Submitted On</p>
                    <p className="text-sm font-black text-on-surface">{new Date(req.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-modern border-2 border-dashed border-outline/60 p-20 text-center space-y-4">
              <p className="text-secondary/40 font-bold italic">You haven't submitted any join requests yet.</p>
              <button 
                onClick={() => router.push("/login")}
                className="px-8 py-3 bg-primary text-white rounded-button font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
              >
                Find an Organization
              </button>
            </div>
          )}
        </section>

        {/* Info Card */}
        <div className="bg-on-surface rounded-modern p-10 text-white relative overflow-hidden custom-shadow">
          <div className="relative z-10 max-w-lg">
            <h3 className="text-3xl font-black mb-4">Make an Impact</h3>
            <p className="text-white/60 font-medium leading-relaxed">
              Once your request is approved, you will be able to see active mission assignments and coordinate with your organization's response team.
            </p>
          </div>
          <Zap className="absolute -right-10 -bottom-10 text-white/5" size={240} strokeWidth={3} />
        </div>
      </div>
    </div>
  );
}
