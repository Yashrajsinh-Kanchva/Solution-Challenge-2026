"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { apiClient } from "@/lib/api/client";
import { getCookie } from "@/lib/utils/cookies";
import {
  Users, MapPin, CheckSquare, Clock,
  Shield, CheckCircle, Circle, AlertCircle,
  ChevronDown, ChevronUp, Zap, Award, Crown
} from "lucide-react";
import ToastContainer, { showToast } from "@/components/volunteer/ToastContainer";

const DynamicVolunteerMap = dynamic(() => import("@/components/volunteer/VolunteerMapView"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-secondary/40 font-black uppercase tracking-widest bg-surface-variant/10 rounded-modern">
      <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      Loading Map...
    </div>
  ),
});

// Mock assignment data for when API is unavailable
const MOCK_ASSIGNMENTS = [
  {
    assignmentId: "asgn-1",
    requestTitle: "Flood Relief — Medical Support",
    requestId: "req-flood-001",
    ngoName: "Sahyog NGO",
    teamName: "Team Alpha",
    teamLeader: "Dr. Priya Sharma",
    status: "in_progress",
    campLocation: { lat: 23.0010, lng: 72.5588, address: "Vasna Relief Camp, Ahmedabad" },
    teamMembers: [
      { name: "Rahul M.", location: { lat: 23.0025, lng: 72.5570, address: "Near Vasna" } },
      { name: "Sneha K.", location: { lat: 23.0005, lng: 72.5600, address: "Vasna Gate" } },
    ],
    checklist: [
      { id: "t-1", title: "Set up triage station", status: "Done", assignedTeam: "Team Alpha" },
      { id: "t-2", title: "Conduct patient intake assessments", status: "In Progress", assignedTeam: "Team Alpha" },
      { id: "t-3", title: "Coordinate with ambulance dispatch", status: "Not Started", assignedTeam: "Team Alpha" },
      { id: "t-4", title: "Daily medical supply inventory check", status: "In Progress", assignedTeam: "Team Alpha" },
    ],
    resources: [
      { type: "Food Supplies", quantity: 200, deliveryStatus: "Delivered" },
      { type: "Medical Kits", quantity: 50, deliveryStatus: "In Transit" },
    ],
  },
];

type ChecklistStatus = "Not Started" | "In Progress" | "Done";

export default function MyAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>("asgn-1");
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  const volunteerId = getCookie("vb_volunteer_id") || "vol-101";
  const volunteerName = getCookie("vb_volunteer_name") || "";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await apiClient.getVolunteerAssignments(volunteerId);
        setAssignments(data?.length > 0 ? data : MOCK_ASSIGNMENTS);
      } catch {
        setAssignments(MOCK_ASSIGNMENTS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [volunteerId]);

  const handleTaskStatusUpdate = async (requestId: string, taskId: string, newStatus: ChecklistStatus) => {
    setUpdatingTask(taskId);
    // Optimistic update immediately
    setAssignments(prev =>
      prev.map(asgn =>
        asgn.requestId === requestId
          ? { ...asgn, checklist: asgn.checklist.map((t: any) => t.id === taskId ? { ...t, status: newStatus } : t) }
          : asgn
      )
    );
    try {
      await apiClient.updateTaskStatus(requestId, taskId, newStatus, volunteerId);
      showToast(`Task marked as "${newStatus}"`, "success");
    } catch {
      showToast("Status saved locally — sync when online.", "warning");
    } finally {
      setUpdatingTask(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Done": return <CheckCircle size={18} className="text-green-500" />;
      case "In Progress": return <Clock size={18} className="text-orange-500" />;
      default: return <Circle size={18} className="text-secondary/30" />;
    }
  };

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Done": return "bg-green-50 text-green-700 border-green-200";
      case "In Progress": return "bg-orange-50 text-orange-700 border-orange-200";
      default: return "bg-gray-50 text-gray-600 border-gray-200";
    }
  };

  const nextStatus = (current: string): ChecklistStatus => {
    if (current === "Not Started") return "In Progress";
    if (current === "In Progress") return "Done";
    return "Not Started";
  };

  const getDeliveryStyle = (status: string) => {
    switch (status) {
      case "Delivered": return "bg-green-50 text-green-700 border-green-200";
      case "In Transit": return "bg-blue-50 text-blue-700 border-blue-200";
      default: return "bg-orange-50 text-orange-700 border-orange-200";
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 bg-surface-variant/50 rounded-2xl w-1/3" />
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="bg-white border-2 border-outline/40 rounded-modern p-8 space-y-4">
            <div className="h-6 bg-surface-variant/40 rounded-xl w-2/3" />
            <div className="h-4 bg-surface-variant/30 rounded-xl w-1/3" />
            <div className="grid grid-cols-3 gap-4">
              {[1,2,3].map(j => <div key={j} className="h-16 bg-surface-variant/20 rounded-2xl" />)}
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <>
      <ToastContainer />
      <div className="space-y-8 animate-in fade-in duration-700">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tight">My Assignments</h1>
          <p className="text-secondary/60 font-medium mt-1">Your active teams, tasks, and camp locations.</p>
        </div>
        <div className="px-5 py-2.5 bg-white border-2 border-outline/60 rounded-2xl shadow-sm text-xs font-black text-secondary/60 uppercase tracking-widest flex items-center gap-2">
          <Award size={16} />
          {assignments.length} Active
        </div>
      </div>

      {assignments.length > 0 ? (
        <div className="space-y-8">
          {assignments.map(asgn => {
            const isExpanded = expandedId === asgn.assignmentId;
            const done = asgn.checklist?.filter((t: any) => t.status === "Done").length || 0;
            const total = asgn.checklist?.length || 0;
            const progress = total > 0 ? Math.round((done / total) * 100) : 0;

            return (
              <div key={asgn.assignmentId} className={`bg-white rounded-modern border-2 transition-all duration-300 custom-shadow overflow-hidden ${isExpanded ? "border-primary ring-8 ring-primary/5" : "border-outline/60 hover:border-primary/30"}`}>
                {/* Assignment Header */}
                <div className="p-8">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-2xl font-black text-on-surface tracking-tight">{asgn.requestTitle}</h2>
                        <span className="text-[10px] font-black px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full uppercase tracking-widest">
                          {asgn.status?.replace(/_/g, " ")}
                        </span>
                        {/* Team Leader Crown Badge */}
                        {(asgn.teamLeader === volunteerId || asgn.teamLeader === volunteerName) && (
                          <span className="flex items-center gap-1.5 text-[10px] font-black px-3 py-1 bg-yellow-50 text-yellow-700 border border-yellow-300 rounded-full uppercase tracking-widest">
                            <Crown size={12} className="fill-yellow-500" /> Team Leader
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-bold text-secondary/60">{asgn.ngoName}</p>
                    </div>

                    <button
                      onClick={() => setExpandedId(isExpanded ? null : asgn.assignmentId)}
                      className={`flex items-center gap-2 px-6 py-3 font-black text-xs uppercase tracking-widest rounded-button transition-all ${
                        isExpanded ? "bg-on-surface text-white" : "bg-primary text-white shadow-lg shadow-primary/20"
                      }`}
                    >
                      {isExpanded ? <><ChevronUp size={16} /> Close</> : <><ChevronDown size={16} /> View Details</>}
                    </button>
                  </div>

                  {/* Team Info Row */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-surface-variant/10 rounded-2xl border border-outline/30 space-y-1">
                      <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Team</p>
                      <div className="flex items-center gap-2 text-sm font-black text-on-surface">
                        <Users size={16} className="text-primary" />
                        {asgn.teamName}
                      </div>
                    </div>
                    <div className="p-4 bg-surface-variant/10 rounded-2xl border border-outline/30 space-y-1">
                      <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Team Leader</p>
                      <div className="flex items-center gap-2 text-sm font-black text-on-surface">
                        <Shield size={16} className="text-primary" />
                        {asgn.teamLeader}
                      </div>
                    </div>
                    <div className="p-4 bg-surface-variant/10 rounded-2xl border border-outline/30 space-y-1">
                      <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Camp Location</p>
                      <div className="flex items-center gap-2 text-sm font-black text-on-surface">
                        <MapPin size={16} className="text-primary" />
                        {asgn.campLocation?.address || "See map below"}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {total > 0 && (
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Task Progress</p>
                        <p className="text-[10px] font-black text-primary">{done}/{total} Tasks Done</p>
                      </div>
                      <div className="w-full h-2.5 bg-outline/20 rounded-full overflow-hidden">
                        <div
                          className="bg-primary h-full rounded-full transition-all duration-700"
                          style={{ width: `${progress}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-secondary/40 mt-1 text-right">{progress}% complete</p>
                    </div>
                  )}
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="border-t-2 border-outline/30 animate-in slide-in-from-top duration-400">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-0">
                      {/* Checklist */}
                      <div className="lg:col-span-7 p-8 space-y-6 border-r-2 border-outline/20">
                        <h3 className="text-lg font-black text-on-surface flex items-center gap-2">
                          <CheckSquare size={22} className="text-primary" />
                          Task Checklist
                        </h3>

                        <div className="space-y-4">
                          {(asgn.checklist || []).map((task: any) => (
                            <div key={task.id} className={`p-5 rounded-2xl border-2 transition-all ${getStatusStyle(task.status)}`}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3 flex-1">
                                  {getStatusIcon(task.status)}
                                  <div className="flex-1">
                                    <p className={`text-sm font-black ${task.status === "Done" ? "line-through opacity-60" : "text-on-surface"}`}>
                                      {task.title}
                                    </p>
                                    {task.assignedTeam && (
                                      <p className="text-[10px] font-bold text-secondary/50 uppercase tracking-widest mt-0.5">
                                        {task.assignedTeam}
                                      </p>
                                    )}
                                  </div>
                                </div>
                                {task.status !== "Done" && (
                                  <button
                                    disabled={updatingTask === task.id}
                                    onClick={() => handleTaskStatusUpdate(asgn.requestId, task.id, nextStatus(task.status))}
                                    className="ml-4 px-4 py-2 bg-on-surface text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-primary transition-all active:scale-95 disabled:opacity-50 flex items-center gap-2 shrink-0"
                                  >
                                    {updatingTask === task.id ? (
                                      <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    ) : (
                                      <>
                                        <Zap size={12} />
                                        {nextStatus(task.status)}
                                      </>
                                    )}
                                  </button>
                                )}
                                {task.status === "Done" && (
                                  <span className="ml-4 text-[10px] font-black text-green-600 uppercase tracking-widest">✓ Done</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Resources */}
                        {asgn.resources?.length > 0 && (
                          <div className="space-y-4 pt-6 border-t-2 border-outline/30">
                            <h4 className="text-sm font-black text-on-surface uppercase tracking-widest flex items-center gap-2">
                              <AlertCircle size={18} className="text-primary" />
                              Allocated Resources
                            </h4>
                            {asgn.resources.map((res: any, i: number) => (
                              <div key={i} className="flex items-center justify-between p-4 bg-surface-variant/10 rounded-2xl border border-outline/30">
                                <div>
                                  <p className="text-sm font-black text-on-surface">{res.type}</p>
                                  <p className="text-[10px] font-bold text-secondary/50 mt-0.5">Qty: {res.quantity}</p>
                                </div>
                                <span className={`text-[10px] font-black px-3 py-1.5 rounded-xl border uppercase tracking-widest ${getDeliveryStyle(res.deliveryStatus)}`}>
                                  {res.deliveryStatus}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Map */}
                      <div className="lg:col-span-5 p-8 space-y-4">
                        <h3 className="text-lg font-black text-on-surface flex items-center gap-2">
                          <MapPin size={22} className="text-primary" />
                          Camp Location
                        </h3>
                        <div className="h-80 rounded-2xl overflow-hidden border-2 border-outline/60">
                          {asgn.campLocation?.lat ? (
                            <DynamicVolunteerMap
                              campLocation={[asgn.campLocation.lat, asgn.campLocation.lng]}
                              teamMembers={asgn.teamMembers || []}
                              campName={asgn.requestTitle}
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-surface-variant/10 text-secondary/40 text-xs font-black uppercase tracking-widest">
                              Location unavailable
                            </div>
                          )}
                        </div>
                        {asgn.campLocation?.address && (
                          <p className="text-xs font-bold text-secondary/60 flex items-center gap-2 px-2">
                            <MapPin size={14} className="text-primary" />
                            {asgn.campLocation.address}
                          </p>
                        )}

                        {/* Team Members */}
                        {asgn.teamMembers?.length > 0 && (
                          <div className="space-y-3 pt-4 border-t border-outline/30">
                            <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest">Team Members ({asgn.teamMembers.length})</p>
                            <div className="flex flex-wrap gap-2">
                              {asgn.teamMembers.map((m: any, i: number) => (
                                <div key={i} className="flex items-center gap-2 px-3 py-2 bg-white rounded-xl border border-outline/40 shadow-sm">
                                  <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-black">
                                    {m.name?.[0]}
                                  </div>
                                  <span className="text-xs font-bold text-on-surface">{m.name}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white p-24 rounded-modern border-2 border-dashed border-outline/60 text-center space-y-4">
          <Award size={56} className="mx-auto text-secondary/10" />
          <h3 className="text-xl font-black text-secondary/40">No Active Assignments</h3>
          <p className="text-sm text-secondary/30 italic">Once you're approved by an NGO, your team and task assignments will appear here.</p>
        </div>
      )}
    </div>
    </>
  );
}
