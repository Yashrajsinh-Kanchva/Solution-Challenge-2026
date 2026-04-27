"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { getCookie } from "@/lib/utils/cookies";
import {
  Zap, Users, CheckSquare, Search, ArrowRight,
  Clock, CheckCircle, MapPin, Bell, TrendingUp,
  Star, Award, Calendar, Activity
} from "lucide-react";

export default function VolunteerDashboard() {
  const router = useRouter();
  const [joinRequests, setJoinRequests] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const volunteerId = getCookie("vb_volunteer_id") || "vol-101";

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      const [reqData, oppData, assignData] = await Promise.allSettled([
        apiClient.getVolunteerJoinRequestsByVolunteerId(volunteerId),
        apiClient.getVolunteerOpportunities(),
        apiClient.getVolunteerAssignments(volunteerId),
      ]);
      if (reqData.status === "fulfilled") setJoinRequests(reqData.value || []);
      if (oppData.status === "fulfilled") setOpportunities((oppData.value || []).slice(0, 3));
      if (assignData.status === "fulfilled") setAssignments(assignData.value || []);
      setLoading(false);
    };
    fetchAll();
  }, [volunteerId]);

  const approvedRequests = joinRequests.filter(r => r.status === "APPROVED");
  const pendingRequests = joinRequests.filter(r => r.status === "PENDING");
  const activeAssignments = assignments.filter((a: any) => a.status !== "completed");

  const getUrgencyColor = (urgency: string) => {
    switch (urgency?.toLowerCase()) {
      case "critical": return "bg-red-500 text-white";
      case "high": return "bg-orange-500 text-white";
      case "medium": return "bg-yellow-500 text-white";
      default: return "bg-green-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-secondary/40 animate-pulse uppercase tracking-widest">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Volunteer Portal</h1>
          <p className="text-secondary/60 font-medium mt-1">
            Welcome back, <span className="text-primary font-black">{volunteerId}</span>
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-white px-5 py-3 rounded-2xl border-2 border-outline/60 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary font-black text-sm">
              {volunteerId.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest leading-none mb-0.5">Volunteer ID</p>
              <p className="text-sm font-bold text-on-surface">{volunteerId}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: "Active Memberships", value: approvedRequests.length, icon: CheckCircle, color: "bg-green-500", trend: "Approved" },
          { label: "Pending Requests", value: pendingRequests.length, icon: Clock, color: "bg-orange-500", trend: "Under Review" },
          { label: "Open Opportunities", value: opportunities.length, icon: Search, color: "bg-blue-500", trend: "Available" },
          { label: "Active Assignments", value: activeAssignments.length, icon: Activity, color: "bg-purple-500", trend: "Ongoing" },
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
            <div className={`absolute -right-4 -bottom-4 w-20 h-20 ${stat.color} opacity-[0.03] rounded-full blur-2xl group-hover:opacity-[0.08] transition-opacity`} />
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Open Opportunities Preview */}
        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white rounded-modern border-2 border-outline/60 custom-shadow overflow-hidden">
            <div className="px-8 py-6 border-b-2 border-outline/40 flex justify-between items-center bg-surface-variant/10">
              <h2 className="text-xl font-black text-on-surface flex items-center gap-3">
                <Search size={22} className="text-primary" />
                Open Opportunities
              </h2>
              <button
                onClick={() => router.push("/volunteer/opportunities")}
                className="group px-4 py-2 text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-primary/5 rounded-full transition-all"
              >
                Browse All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>

            <div className="divide-y-2 divide-outline/30">
              {opportunities.length > 0 ? (
                opportunities.map((opp: any) => (
                  <div
                    key={opp.id || opp.opportunityId}
                    className="p-7 hover:bg-surface-variant/5 transition-colors flex items-start gap-6 group/item cursor-pointer"
                    onClick={() => router.push(`/volunteer/opportunities/${opp.id || opp.opportunityId}`)}
                  >
                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-lg shrink-0 group-hover/item:bg-primary group-hover/item:text-white transition-all">
                      {(opp.ngoName || "N")?.[0]}
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h4 className="font-black text-on-surface text-base group-hover/item:text-primary transition-colors">{opp.title || "Volunteer Opportunity"}</h4>
                          <p className="text-xs font-bold text-secondary/60">{opp.ngoName || "NGO"}</p>
                        </div>
                        <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${getUrgencyColor(opp.urgency)}`}>
                          {opp.urgency || "Medium"}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 mt-2">
                        <div className="flex items-center gap-1.5 text-xs font-bold text-secondary/60">
                          <MapPin size={14} className="text-primary" />
                          {opp.location?.address || opp.location || "Location TBD"}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs font-bold text-secondary/60">
                          <Users size={14} className="text-primary" />
                          {opp.openPositions || 0} positions open
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        {(opp.requiredSkills || []).slice(0, 3).map((skill: string) => (
                          <span key={skill} className="text-[9px] font-black px-2.5 py-1 bg-surface-variant text-on-surface-variant rounded-lg uppercase tracking-widest border border-outline/40">
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center space-y-3">
                  <Search size={48} className="mx-auto text-secondary/10" />
                  <p className="font-black text-secondary/40 uppercase tracking-widest text-xs">No opportunities yet</p>
                  <p className="text-sm text-secondary/30 italic">NGO postings will appear here when available.</p>
                </div>
              )}
            </div>
          </div>

          {/* My Assignments Preview */}
          <div className="bg-white rounded-modern border-2 border-outline/60 custom-shadow overflow-hidden">
            <div className="px-8 py-6 border-b-2 border-outline/40 flex justify-between items-center bg-surface-variant/10">
              <h2 className="text-xl font-black text-on-surface flex items-center gap-3">
                <CheckSquare size={22} className="text-primary" />
                My Assignments
              </h2>
              <button
                onClick={() => router.push("/volunteer/assignments")}
                className="group px-4 py-2 text-primary font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-primary/5 rounded-full transition-all"
              >
                View All <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
            <div className="divide-y-2 divide-outline/30">
              {activeAssignments.length > 0 ? (
                activeAssignments.slice(0, 3).map((asgn: any, i: number) => (
                  <div key={i} className="p-7 hover:bg-surface-variant/5 transition-colors flex items-center justify-between">
                    <div>
                      <h4 className="font-black text-on-surface">{asgn.requestTitle || "Assignment"}</h4>
                      <p className="text-xs text-secondary/60 font-bold mt-1">Team: {asgn.teamName || "—"} · Leader: {asgn.teamLeader || "—"}</p>
                    </div>
                    <span className="text-[10px] font-black px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full uppercase tracking-widest">
                      {asgn.status || "Active"}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-16 text-center space-y-3">
                  <Award size={48} className="mx-auto text-secondary/10" />
                  <p className="font-black text-secondary/40 uppercase tracking-widest text-xs">No active assignments</p>
                  <p className="text-sm text-secondary/30 italic">After NGO approval you'll see your team here.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="lg:col-span-4 space-y-6">
          {/* Join Request Status */}
          <div className="bg-white p-8 rounded-modern border-2 border-outline/60 custom-shadow">
            <h3 className="text-xs font-black text-on-surface uppercase tracking-widest mb-6 flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              Join Request Status
            </h3>
            {joinRequests.length > 0 ? (
              <div className="space-y-4">
                {joinRequests.slice(0, 4).map((req: any) => (
                  <div key={req.id} className="flex items-center justify-between p-4 rounded-2xl border-2 border-outline/30 hover:border-primary/30 transition-all">
                    <div>
                      <p className="text-xs font-black text-on-surface">Request #{req.id?.slice(-6)?.toUpperCase() || "—"}</p>
                      <p className="text-[10px] font-bold text-secondary/50 mt-0.5">{new Date(req.createdAt).toLocaleDateString()}</p>
                    </div>
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${
                      req.status === "APPROVED" ? "bg-green-50 text-green-600 border border-green-200" :
                      req.status === "REJECTED" ? "bg-red-50 text-red-600 border border-red-200" :
                      "bg-orange-50 text-orange-600 border border-orange-200"
                    }`}>
                      {req.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 space-y-2">
                <Clock size={36} className="mx-auto text-secondary/10" />
                <p className="text-xs font-bold text-secondary/40 italic">No join requests yet</p>
                <button
                  onClick={() => router.push("/volunteer/opportunities")}
                  className="mt-4 px-6 py-2.5 bg-primary text-white rounded-button text-[10px] font-black uppercase tracking-widest hover:bg-primary/90 transition-all"
                >
                  Browse NGOs
                </button>
              </div>
            )}
          </div>

          {/* Impact Banner */}
          <div className="bg-on-surface rounded-modern p-8 text-white relative overflow-hidden custom-shadow">
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Star size={18} className="text-yellow-400 fill-yellow-400" />
                <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Impact Level</p>
              </div>
              <h3 className="text-3xl font-black mb-2">{approvedRequests.length > 0 ? "Active Hero" : "Ready to Help"}</h3>
              <p className="text-white/60 font-medium leading-relaxed text-sm">
                {approvedRequests.length > 0
                  ? "You're an approved team member. Check your assignments and make a difference."
                  : "Browse opportunities and apply to join an NGO team. Your skills matter."}
              </p>
              <button
                onClick={() => router.push("/volunteer/opportunities")}
                className="mt-6 flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 transition-all rounded-xl text-xs font-black uppercase tracking-widest border border-white/20"
              >
                <TrendingUp size={14} /> Find Opportunities
              </button>
            </div>
            <Zap className="absolute -right-8 -bottom-8 text-white/5" size={180} strokeWidth={3} />
          </div>

          {/* Quick Actions */}
          <div className="bg-white p-8 rounded-modern border-2 border-outline/60 custom-shadow">
            <h3 className="text-xs font-black text-on-surface uppercase tracking-widest mb-6 flex items-center gap-2">
              <Zap size={18} className="text-primary" />
              Quick Actions
            </h3>
            <div className="space-y-3">
              {[
                { label: "Browse Opportunities", href: "/volunteer/opportunities", icon: Search },
                { label: "My Task Checklist", href: "/volunteer/tasks", icon: CheckSquare },
                { label: "View Assignments", href: "/volunteer/assignments", icon: Calendar },
                { label: "Update Profile", href: "/volunteer/profile", icon: Activity },
              ].map((action) => (
                <button
                  key={action.href}
                  onClick={() => router.push(action.href)}
                  className="w-full flex items-center gap-3 p-4 rounded-2xl border-2 border-outline/40 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <div className="p-2 bg-surface-variant/50 rounded-xl group-hover:bg-primary group-hover:text-white transition-all text-secondary/60">
                    <action.icon size={16} />
                  </div>
                  <span className="text-sm font-black text-on-surface group-hover:text-primary transition-colors">{action.label}</span>
                  <ArrowRight size={14} className="ml-auto text-secondary/30 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
