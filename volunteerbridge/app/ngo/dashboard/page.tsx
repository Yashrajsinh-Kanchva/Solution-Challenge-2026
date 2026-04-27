"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { getCookie } from "@/lib/utils/cookies";
import { 
  ClipboardList, Users, Package, TrendingUp, 
  ArrowRight, Clock, CheckCircle, Utensils,
  Activity, Home, ArrowUpRight, Zap
} from "lucide-react";

export default function NgoDashboard() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const ngoId = getCookie("vb_ngo_id") || "ngo-1";

  useEffect(() => {
    apiClient.getNgoStats(ngoId)
      .then(setStats)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [ngoId]);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-secondary/60">Loading NGO Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Dashboard</h1>
          <p className="text-secondary/60 font-medium mt-1">Track your team and manage emergency requests.</p>
        </div>
        <div className="bg-white px-6 py-3 rounded-2xl border-2 border-outline/60 shadow-sm flex items-center gap-4">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black">
            {ngoId.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest leading-none mb-1">Organization</p>
            <p className="text-sm font-bold text-on-surface">{ngoId}</p>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Total Requests", value: stats.totalRequests, icon: ClipboardList, color: "bg-blue-500", trend: "All" },
          { label: "Active Tasks", value: stats.activeTasks, icon: TrendingUp, color: "bg-orange-500", trend: "Live" },
          { label: "Completed", value: stats.completedTasks, icon: CheckCircle, color: "bg-green-600", trend: "Done" },
          { label: "Volunteers", value: stats.availableVolunteers, icon: Users, color: "bg-green-500", trend: "Ready" },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-7 rounded-modern border-2 border-outline/60 custom-shadow hover:border-primary/40 transition-all group relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div className={`${stat.color} p-3 rounded-xl text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <stat.icon size={22} />
              </div>
              <span className="text-[10px] font-black px-2 py-0.5 bg-surface-variant text-secondary/60 rounded-full">
                {stat.trend}
              </span>
            </div>
            <div className="mt-6 relative z-10">
              <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">{stat.label}</p>
              <h3 className="text-3xl font-black text-on-surface tracking-tight">{stat.value}</h3>
            </div>
            {/* Background Decoration */}
            <div className={`absolute -right-4 -bottom-4 w-20 h-20 ${stat.color} opacity-[0.03] rounded-full blur-2xl group-hover:opacity-[0.08] transition-opacity`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Recent Activity Feed */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-modern border-2 border-outline/60 custom-shadow overflow-hidden">
            <div className="px-8 py-6 border-b-2 border-outline/40 flex justify-between items-center bg-surface-variant/10">
              <h2 className="text-xl font-black text-on-surface flex items-center gap-3">
                <Clock size={22} className="text-primary" />
                Recent Activity
              </h2>
              <button 
                onClick={() => router.push("/ngo/tasks")}
                className="group px-4 py-2 text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-primary/5 rounded-full transition-all"
              >
                View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="divide-y-2 divide-outline/30">
              {stats.recentActivity?.length > 0 ? (
                stats.recentActivity.map((req: any) => (
                  <div key={req.requestId} className="p-7 hover:bg-surface-variant/5 transition-colors flex items-start gap-6 group/item">
                    <div className={`mt-1.5 w-3 h-3 rounded-full shadow-sm ring-4 ring-offset-2 ${
                      req.status === "completed" || req.status === "Completed" ? "bg-green-500 ring-green-100" :
                      req.status === "assigned_to_ngo" ? "bg-orange-500 ring-orange-100 animate-pulse" :
                      "bg-blue-500 ring-blue-100"
                    }`} />
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-black text-on-surface text-base group-hover/item:text-primary transition-colors">{req.title}</h4>
                        <span className="text-[10px] text-secondary/40 font-black uppercase tracking-widest">{new Date(req.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                      <p className="text-sm text-on-surface-variant/80 font-medium leading-relaxed mb-4">
                        {req.status === "assigned_to_ngo" ? "New request waiting for your review." :
                         req.status === "Accepted" ? "Request accepted. Preparing volunteer and resource assignment." :
                         req.status === "assigned_to_volunteer" ? "Volunteers are on their way to the location." :
                         req.status === "completed" || req.status === "Completed" ? "The request has been successfully closed." :
                         `Status updated to: ${req.status.replace(/_/g, " ")}`}
                      </p>
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-black px-2.5 py-1 bg-surface-variant/50 text-secondary/60 rounded-lg uppercase tracking-widest border border-outline/30">
                          {req.category}
                        </span>
                        <span className="text-[9px] font-black px-2.5 py-1 bg-primary/5 text-primary rounded-lg uppercase tracking-widest border border-primary/20">
                          #{req.requestId.slice(-6).toUpperCase()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-20 text-center text-secondary/40">
                  <ClipboardList size={64} className="mx-auto mb-4 opacity-10" />
                  <p className="font-black uppercase tracking-widest text-xs">No recent activity</p>
                </div>
              )}
            </div>
          </div>
        </div>
 
        {/* Right Sidebar: Resources & Volunteer Insights */}
        <div className="lg:col-span-4 space-y-8">
          {/* Resource Summary */}
          <div className="bg-white p-8 rounded-modern border-2 border-outline/60 custom-shadow">
            <h3 className="text-xs font-black text-on-surface uppercase tracking-widest mb-8 flex items-center gap-2">
              <Package size={18} className="text-primary" />
              Inventory Status
            </h3>
            <div className="space-y-8">
              {[
                { label: "Food Supplies", value: stats.resources?.food, max: 100, color: "bg-orange-500", icon: Utensils },
                { label: "Medical Kits", value: stats.resources?.medicine, max: 100, color: "bg-blue-500", icon: Activity },
                { label: "Emergency Shelter", value: stats.resources?.shelter || 0, max: 50, color: "bg-purple-500", icon: Home },
              ].map((res, i) => (
                <div key={i} className="group/res">
                  <div className="flex justify-between items-center mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${res.color.replace('bg-', 'text-')} bg-surface-variant/20`}>
                        <res.icon size={14} />
                      </div>
                      <span className="text-xs font-black text-secondary/70 uppercase tracking-widest">{res.label}</span>
                    </div>
                    <span className="text-sm font-black text-on-surface tracking-tight">{res.value || 0} / {res.max}</span>
                  </div>
                  <div className="w-full bg-outline/20 h-2.5 rounded-full overflow-hidden shadow-inner">
                    <div 
                      className={`${res.color} h-full rounded-full transition-all duration-1000 shadow-[0_0_12px_-2px_rgba(0,0,0,0.2)]`} 
                      style={{ width: `${Math.min(((res.value || 0) / res.max) * 100, 100)}%` }} 
                    />
                  </div>
                </div>
              ))}
              <button 
                onClick={() => router.push("/ngo/resources")}
                className="w-full py-4 bg-on-surface text-white rounded-button text-xs font-black uppercase tracking-widest hover:bg-primary transition-all mt-4 shadow-md active:scale-[0.98]"
              >
                Manage Inventory
              </button>
            </div>
          </div>
 
          {/* Volunteer Insights */}
          <div className="bg-primary-container/20 p-8 rounded-modern border-2 border-primary-container/60 relative overflow-hidden">
            <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-8 flex items-center gap-2 relative z-10">
              <Users size={18} />
              Volunteer Team
            </h3>
            <div className="space-y-6 relative z-10">
              <div className="p-6 bg-white rounded-2xl border-2 border-primary-container/40 shadow-sm">
                <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">Total Volunteers</p>
                <div className="flex items-baseline gap-2">
                  <p className="text-4xl font-black text-on-surface tracking-tighter">{stats.totalVolunteers}</p>
                  <p className="text-[10px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded-full uppercase">Active</p>
                </div>
              </div>
              
              <div className="space-y-3">
                <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Skills Distribution</p>
                {stats.topSkills?.length > 0 ? (
                  stats.topSkills.map((skill: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-white p-4 rounded-xl border-2 border-outline/30 hover:border-primary/40 transition-all shadow-sm">
                      <span className="text-xs font-black text-on-surface uppercase tracking-tight">{skill.name}</span>
                      <span className="text-[10px] font-black px-2.5 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20">
                        {skill.count} Members
                      </span>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-secondary/40 italic p-4 text-center border-2 border-dashed border-outline/30 rounded-xl">No skill data available</p>
                )}
              </div>
            </div>
            {/* Decoration */}
            <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
