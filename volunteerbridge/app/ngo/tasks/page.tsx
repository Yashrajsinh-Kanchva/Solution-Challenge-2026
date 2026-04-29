"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiClient } from "@/lib/api/client";
import { getCookie } from "@/lib/utils/cookies";
import { 
  ClipboardList, CheckCircle, XCircle, 
  MapPin, AlertTriangle, Info, UserCheck,
  ChevronDown, ChevronUp, Star, Zap,
  Navigation, Award, Package, Utensils, Activity, Home
} from "lucide-react";

export default function NgoTasks() {
  const router = useRouter();
  const [requests, setRequests] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [resourceQuantities, setResourceQuantities] = useState<Record<string, number>>({});
  const [ngoStats, setNgoStats] = useState<any>(null);
  
  const ngoId = getCookie("vb_ngo_id") || "ngo-1";

  useEffect(() => {
    fetchData();
  }, [ngoId]);

  const fetchData = async () => {
    setLoading(true);
    const [reqData, volData, statsData] = await Promise.all([
      apiClient.getNgoRequests(ngoId),
      apiClient.getNgoVolunteers(ngoId),
      apiClient.getNgoStats(ngoId)
    ]);
    setRequests(reqData || []);
    setVolunteers((volData || []).filter((v: any) => v.availability && v.name && (v.id || v.volunteerId)));
    setNgoStats(statsData);
    setLoading(false);
  };

  const handleAssignResources = async (requestId: string, type: string) => {
    const qty = resourceQuantities[`${requestId}-${type}`] || 0;
    if (qty <= 0) return;

    try {
      await apiClient.assignResourcesToTask(ngoId, requestId, { [type]: qty });
      setResourceQuantities(prev => ({ ...prev, [`${requestId}-${type}`]: 0 }));
      await fetchData();
    } catch (error) {
      console.error("Failed to assign resources:", error);
    }
  };

  const handleStatusUpdate = async (requestId: string, status: string) => {
    try {
      await apiClient.updateRequestStatus(requestId, status);
      await fetchData();
    } catch (error) {
      console.error("Failed to update status:", error);
    }
  };

  const handleAssignVolunteer = async (requestId: string, volunteerId: string) => {
    setAssigningId(volunteerId);
    try {
      await apiClient.assignVolunteer(requestId, volunteerId);
      await fetchData();
    } catch (error) {
      console.error("Failed to assign volunteer:", error);
    } finally {
      setAssigningId(null);
    }
  };

  const handleUnassignVolunteer = async (requestId: string, volunteerId: string) => {
    try {
      await apiClient.unassignVolunteer(requestId, volunteerId);
      await fetchData();
    } catch (error) {
      console.error("Failed to unassign volunteer:", error);
    }
  };

  // Matching Score Logic: Skills vs Category (60%), Availability (20%), Distance Simulation (20%)
  const calculateMatchScore = (volunteer: any, request: any) => {
    let score = 20; // Base score for availability (already filtered)
    
    const hasSkill = volunteer.skills?.some((s: string) => 
      s.toLowerCase().includes(request.category.toLowerCase()) ||
      request.title.toLowerCase().includes(s.toLowerCase())
    );
    if (hasSkill) score += 60;
    
    // Simulate distance proximity (random 10-20% for demo)
    score += Math.floor(Math.random() * 11) + 10;
    
    return score;
  };

  const getUrgencyStyles = (urgency: string) => {
    const u = urgency.toLowerCase();
    if (u === "critical" || u === "high") return "bg-red-500 text-white";
    if (u === "medium") return "bg-orange-500 text-white";
    return "bg-green-500 text-white";
  };

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "Accepted": return "bg-blue-50 text-blue-700 border-blue-200";
      case "assigned_to_volunteer": return "bg-green-50 text-green-700 border-green-200";
      case "completed": return "bg-gray-50 text-gray-700 border-gray-200";
      case "Rejected": return "bg-red-50 text-red-700 border-red-200";
      default: return "bg-orange-50 text-orange-700 border-orange-200";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-bold text-secondary/40 animate-pulse uppercase tracking-widest">Fetching Requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">Requests</h1>
          <p className="text-secondary/60 font-medium mt-1">Review and manage help requests from the community.</p>
        </div>
        <div className="px-5 py-2.5 bg-white border-2 border-outline/60 rounded-2xl shadow-sm text-xs font-black text-secondary/60 uppercase tracking-widest flex items-center gap-2">
          <ClipboardList size={16} />
          {requests.length} Total
        </div>
      </div>

      <div className="grid gap-8">
        {requests.length > 0 ? (
          requests.map((req) => {
            const isExpanded = expandedId === req.requestId;
            const suggestedVolunteers = volunteers
              .map(v => ({ ...v, score: calculateMatchScore(v, req) }))
              .sort((a, b) => b.score - a.score)
              .slice(0, 3);

            const urgency = req?.urgency?.toLowerCase() || "medium";
            const isCritical = urgency === "critical" || urgency === "high";

            return (
              <div key={req.requestId} className={`bg-white rounded-modern border-2 transition-all duration-300 ${
                isExpanded ? "border-primary ring-8 ring-primary/5" : "border-outline/60 hover:border-primary/30"
              } custom-shadow overflow-hidden group`}>
                <div className="p-10">
                  <div className="flex justify-between items-start mb-8">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <span className={`text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest shadow-sm ${getUrgencyStyles(req.urgency)}`}>
                          {req.urgency}
                        </span>
                        <span className="text-[10px] font-black px-4 py-1.5 bg-surface-variant text-secondary/60 rounded-full uppercase tracking-widest flex items-center gap-2 border border-outline/40">
                          <Zap size={12} className="text-primary" />
                          {req.aiCategory || req.category}
                        </span>
                      </div>
                      <h3 className="text-3xl font-black text-on-surface tracking-tight group-hover:text-primary transition-colors duration-300">{req.title}</h3>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-2">Status</p>
                      <div className="flex flex-col items-end gap-3">
                        <span className={`text-xs font-black px-4 py-1.5 rounded-xl uppercase border-2 shadow-sm ${getStatusStyles(req?.status)}`}>
                          {req?.status?.replace(/_/g, " ") || "unknown"}
                        </span>
                        
                        {(req.assignedVolunteers?.length > 0 || ((req.assignedResources || req.allocatedResources) && Object.values(req.assignedResources || req.allocatedResources).some(v => (v as number) > 0))) && (
                          <div className="flex flex-col items-end gap-2 p-3 bg-surface-variant/20 rounded-2xl border border-outline/30 mt-1">
                            {req.assignedVolunteers?.length > 0 && (
                              <div className="flex flex-col items-end gap-1.5">
                                <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest">Assigned Team</p>
                                <div className="flex -space-x-2">
                                  {req.assignedVolunteers.map((vol: any) => (
                                    <div key={vol.volunteerId} title={vol.name ?? "Volunteer"} className="w-9 h-9 rounded-full bg-primary/10 border-2 border-white flex items-center justify-center text-[11px] font-black text-primary custom-shadow relative group/avatar">
                                      {vol.name?.[0] ?? "?"}
                                      <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {(() => {
                              const res = req.assignedResources || req.allocatedResources;
                              if (!res || !Object.values(res).some(v => (v as number) > 0)) return null;
                              return (
                                <div className="flex flex-col items-end gap-1.5 mt-2 border-t border-outline/20 pt-2 w-full">
                                  <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest">Assigned Resources</p>
                                  <div className="flex flex-wrap justify-end gap-2">
                                    {res.food > 0 && <span className="text-[9px] font-black px-2 py-0.5 bg-orange-50 text-orange-600 rounded-lg border border-orange-200 uppercase tracking-tighter">Food: {res.food}</span>}
                                    {res.medicine > 0 && <span className="text-[9px] font-black px-2 py-0.5 bg-blue-50 text-blue-600 rounded-lg border border-blue-200 uppercase tracking-tighter">Med: {res.medicine}</span>}
                                    {res.shelter > 0 && <span className="text-[9px] font-black px-2 py-0.5 bg-purple-50 text-purple-600 rounded-lg border border-purple-200 uppercase tracking-tighter">Shelter: {res.shelter}</span>}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
                    <div className="space-y-1.5 p-4 bg-surface-variant/10 rounded-2xl border border-outline/30">
                      <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Location</p>
                      <div className="flex items-center gap-2.5 text-sm font-bold text-on-surface">
                        <MapPin size={18} className="text-primary" />
                        {typeof req?.location === "string" ? req?.location : req?.location?.address ?? "Location Not Specified"}
                      </div>
                    </div>
                    <div className="space-y-1.5 p-4 bg-surface-variant/10 rounded-2xl border border-outline/30 text-center">
                      <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Request ID</p>
                      <p className="text-sm font-black text-primary tracking-widest">#{req?.requestId?.slice(-8).toUpperCase() || "unknown"}</p>
                    </div>
                    <div className="space-y-1.5 p-4 bg-surface-variant/10 rounded-2xl border border-outline/30 text-right">
                      <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Date Reported</p>
                      <p className="text-sm font-bold text-on-surface uppercase tracking-tighter">{new Date(req.createdAt).toLocaleDateString([], { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    </div>
                  </div>

                  <div className="relative mb-10 group/desc">
                    <div className="absolute -left-5 top-0 bottom-0 w-1 bg-primary/20 group-hover/desc:bg-primary transition-colors rounded-full" />
                    <p className="text-base text-on-surface-variant leading-relaxed font-medium pl-4">
                      {req.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center pt-8 border-t-2 border-outline/30">
                    <div className="flex gap-4">
                      {req.status === "assigned_to_ngo" && (
                        <>
                          <button 
                            onClick={() => handleStatusUpdate(req.requestId, "Accepted")}
                            className="flex items-center gap-2 px-10 py-4 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-button hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95"
                          >
                            <CheckCircle size={18} /> Accept Request
                          </button>
                          <button 
                            onClick={() => handleStatusUpdate(req.requestId, "Rejected")}
                            className="flex items-center gap-2 px-10 py-4 border-2 border-red-500/20 text-red-500 font-black text-xs uppercase tracking-widest rounded-button hover:bg-red-50 transition-all active:scale-95"
                          >
                            <XCircle size={18} /> Reject
                          </button>
                        </>
                      )}
                      {(req.status === "Accepted" || req.status === "assigned_to_volunteer") && (
                        <button 
                          onClick={() => setExpandedId(isExpanded ? null : req.requestId)}
                          className={`flex items-center gap-2 px-10 py-4 font-black text-xs uppercase tracking-widest rounded-button transition-all shadow-lg active:scale-95 ${
                            isExpanded ? "bg-on-surface text-white" : "bg-primary text-white shadow-primary/20"
                          }`}
                        >
                          <UserCheck size={18} /> 
                          {isExpanded ? "Close" : req.assignedVolunteers?.length > 0 ? "Edit Assignment" : "Assign Team"}
                        </button>
                      )}
                      {(req.status === "assigned_to_volunteer" || req.status === "in_progress") && (
                        <button 
                          onClick={() => handleStatusUpdate(req.requestId, "completed")}
                          className="flex items-center gap-2 px-10 py-4 bg-green-600 text-white font-black text-xs uppercase tracking-widest rounded-button hover:bg-green-700 transition-all shadow-lg shadow-green-600/20 active:scale-95"
                        >
                          <CheckCircle size={18} /> Task Completed
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Resource & Volunteer Assignment Section */}
                {isExpanded && (
                  <div className="bg-surface-variant/10 border-t-2 border-outline/30 p-10 animate-in slide-in-from-top duration-500 space-y-12">
                    {/* Resource Assignment */}
                    <div className="bg-white p-8 rounded-modern border-2 border-outline/60 custom-shadow overflow-hidden relative group/res">
                      <div className="flex items-center justify-between mb-8 relative z-10">
                        <div>
                          <h4 className="text-xl font-black text-on-surface flex items-center gap-2">
                            <Package size={22} className="text-primary" />
                            Send Resources
                          </h4>
                          <p className="text-xs font-bold text-secondary/40 mt-1 uppercase tracking-widest">Select items to send based on the request needs.</p>
                        </div>
                        <div className="flex gap-4">
                          <div className="px-5 py-2.5 bg-orange-50 rounded-2xl border-2 border-orange-100 text-[10px] font-black text-orange-600 uppercase tracking-widest shadow-sm">
                            Food: {ngoStats?.resources?.food || 0}
                          </div>
                          <div className="px-5 py-2.5 bg-blue-50 rounded-2xl border-2 border-blue-100 text-[10px] font-black text-blue-600 uppercase tracking-widest shadow-sm">
                            Med: {ngoStats?.resources?.medicine || 0}
                          </div>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
                        {[
                          { id: "food", label: "Food Supplies", icon: Utensils, color: "text-orange-500", match: req.category.toLowerCase().includes("food") },
                          { id: "medicine", label: "Medical Kits", icon: Activity, color: "text-blue-500", match: req.category.toLowerCase().includes("health") || req.category.toLowerCase().includes("medical") },
                          { id: "shelter", label: "Shelter Units", icon: Home, color: "text-purple-500", match: req.category.toLowerCase().includes("shelter") }
                        ].map((res) => (
                          <div key={res.id} className={`p-6 rounded-2xl border-2 transition-all duration-300 ${res.match ? "border-primary/40 bg-primary/5 ring-4 ring-primary/5" : "border-outline/40 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"}`}>
                            <div className="flex items-center gap-3 mb-6">
                              <div className={`p-3 rounded-xl bg-white shadow-md ${res.color}`}>
                                <res.icon size={20} />
                              </div>
                              <span className="text-sm font-black text-on-surface uppercase tracking-tight">{res.label}</span>
                            </div>
                            <div className="flex gap-3">
                              <input 
                                type="number" 
                                min="0"
                                value={resourceQuantities[`${req.requestId}-${res.id}`] || 0}
                                onChange={(e) => setResourceQuantities(prev => ({ ...prev, [`${req.requestId}-${res.id}`]: parseInt(e.target.value) || 0 }))}
                                className="flex-1 px-4 py-3 bg-white border-2 border-outline/60 rounded-button text-xs font-bold focus:border-primary outline-none transition-all"
                                placeholder="Qty"
                              />
                              <button 
                                onClick={() => handleAssignResources(req.requestId, res.id)}
                                className="px-6 py-3 bg-on-surface text-white rounded-button text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-lg shadow-on-surface/10"
                              >
                                Send
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl group-hover/res:bg-primary/10 transition-colors" />
                    </div>

                    <div className="pt-8 relative">
                      <div className="flex items-center justify-between mb-10">
                        <div>
                          <h4 className="text-xl font-black text-on-surface flex items-center gap-2">
                            <Award size={22} className="text-primary" />
                            Suggested Volunteers
                          </h4>
                          <p className="text-xs font-bold text-secondary/40 mt-1 uppercase tracking-widest">Recommended volunteers based on their skills and location.</p>
                        </div>
                        <div className="px-5 py-2.5 bg-white rounded-2xl border-2 border-outline/60 text-[10px] font-black text-secondary/40 uppercase tracking-widest shadow-sm">
                          Available: {volunteers.length}
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {suggestedVolunteers.map((vol) => (
                          <div key={vol.volunteerId} className="bg-white p-8 rounded-modern border-2 border-outline/60 hover:border-primary transition-all duration-300 flex flex-col justify-between custom-shadow relative group/vol">
                            <div>
                              <div className="flex justify-between items-start mb-6">
                                <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary font-black text-2xl shadow-sm border border-primary/20">
                                  {vol.name?.[0] ?? "?"}
                                </div>
                                <div className="flex flex-col items-end">
                                  <span className="text-[10px] font-black text-primary uppercase tracking-tighter bg-primary/10 px-3 py-1 rounded-full border border-primary/20 shadow-sm">
                                    {vol.score}% Match
                                  </span>
                                  <div className="flex gap-0.5 mt-2">
                                    {[...Array(5)].map((_, i) => (
                                      <Star key={i} size={11} className={i < 4 ? "text-yellow-400 fill-yellow-400" : "text-gray-200"} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                              
                              <h5 className="text-lg font-black text-on-surface mb-1">{vol.name ?? "Unknown Volunteer"}</h5>
                              <div className="flex items-center gap-1.5 text-xs font-bold text-secondary/60 mb-6">
                                <Navigation size={14} className="text-primary" />
                                {vol?.location?.address ?? "Location unavailable"}
                              </div>

                              <div className="flex flex-wrap gap-2 mb-8">
                                {(vol.skills ?? []).map((skill: string, i: number) => (
                                  <span key={i} className="text-[9px] font-black px-2.5 py-1.5 bg-surface-variant text-on-surface-variant rounded-lg uppercase tracking-widest border border-outline/40">
                                    {skill}
                                  </span>
                                ))}
                              </div>
                            </div>

                            {req.assignedVolunteers?.some((v: any) => v.volunteerId === vol.volunteerId) ? (
                              <button 
                                onClick={() => handleUnassignVolunteer(req.requestId, vol.volunteerId)}
                                className="w-full py-4 border-2 border-red-500/20 text-red-500 rounded-button text-[10px] font-black uppercase tracking-widest hover:bg-red-50 transition-all active:scale-95 flex items-center justify-center gap-2"
                              >
                                Remove
                              </button>
                            ) : (
                              <button 
                                disabled={assigningId === vol.volunteerId}
                                onClick={() => handleAssignVolunteer(req.requestId, vol.volunteerId)}
                                className="w-full py-4 bg-on-surface text-white rounded-button text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-on-surface/10"
                              >
                                {assigningId === vol.volunteerId ? (
                                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                ) : (
                                  <>
                                    <Zap size={14} />
                                    Assign
                                  </>
                                )}
                              </button>
                            )}
                            <div className="absolute -right-2 -bottom-2 w-16 h-16 bg-primary/5 rounded-full blur-2xl group-hover/vol:bg-primary/10 transition-colors" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })

        ) : (
          <div className="bg-white p-20 rounded-modern border-2 border-dashed border-outline/60 text-center space-y-4">
            <AlertTriangle size={48} className="mx-auto text-secondary/20" />
            <h3 className="text-xl font-black text-secondary/40">No tasks currently assigned</h3>
            <p className="text-sm text-secondary/40 font-medium">When the admin assigns requests to your NGO, they will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
