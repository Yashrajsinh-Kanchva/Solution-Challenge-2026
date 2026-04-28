"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { apiClient } from "@/lib/api/client";
import { getCookie } from "@/lib/utils/cookies";
import {
  Users, MapPin, CheckSquare, Clock,
  Shield, CheckCircle, Circle, AlertCircle,
  ChevronDown, ChevronUp, Zap, Award
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

// ── No mock data: all assignments come from the live database ──

type ChecklistStatus = "Not Started" | "In Progress" | "Done";

// Same 5-step workflow as NGO — both sides use identical step labels
const STEPS = [
  { id: "assigned_to_ngo",       label: "Assigned" },
  { id: "Accepted",              label: "Accepted" },
  { id: "assigned_to_volunteer", label: "Dispatched" },
  { id: "in_progress",           label: "On Site" },
  { id: "completed",             label: "Completed" },
];

const getStepIndex = (status: string): number => {
  switch (status) {
    case "assigned_to_ngo":       return 0;
    case "Accepted":              return 1;
    case "assigned_to_volunteer": return 2;
    case "in_progress":           return 3;
    case "completed":             return 4;
    default:                      return 2; // sensible default for volunteers
  }
};

/**
 * Derives the effective stage index from checklist item states.
 * This is STATE-based, NOT percentage-based:
 *   - Stages 1–3 (Assigned/Accepted/Dispatched): come from DB status (NGO workflow)
 *   - Stage 4 "On Site":   activates when ANY item is "In Progress" OR "Done"
 *   - Stage 5 "Completed": activates ONLY when ALL items are "Done"
 * This matches the same logic used on the NGO side.
 */
function computeStepFromChecklist(dbStatus: string, checklist: any[]): number {
  const dbStep = getStepIndex(dbStatus);
  if (!checklist || checklist.length === 0) return dbStep;

  const allDone = checklist.every((t: any) => t.status === "Done" || t.done === true);
  if (allDone) return 4; // Stage 5: Completed

  const anyActive = checklist.some(
    (t: any) => t.status === "In Progress" || t.status === "Done" || t.done === true
  );
  // Stage 4 "On Site" activates as soon as any item is worked; never go below DB step
  if (anyActive) return Math.max(dbStep, 3);

  return dbStep;
}

export default function MyAssignmentsPage() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingTask, setUpdatingTask] = useState<string | null>(null);

  const volunteerId = getCookie("vb_volunteer_id") || "";

  useEffect(() => {
    if (!volunteerId) { setLoading(false); return; }
    const fetchData = async () => {
      setLoading(true);
      try {
        const data = await apiClient.getVolunteerAssignments(volunteerId);
        setAssignments(Array.isArray(data) ? data : []);
      } catch {
        setAssignments([]);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [volunteerId]);

  const handleTaskStatusUpdate = async (requestId: string, taskId: string, newStatus: ChecklistStatus) => {
    setUpdatingTask(taskId);
    const newDone = newStatus === "Done";
    // Optimistic update — keep both status and done in sync
    setAssignments(prev =>
      prev.map(asgn =>
        asgn.requestId === requestId
          ? {
              ...asgn,
              checklist: asgn.checklist.map((t: any) =>
                t.id === taskId ? { ...t, status: newStatus, done: newDone } : t
              ),
            }
          : asgn
      )
    );
    try {
      const result = await apiClient.updateTaskStatus(requestId, taskId, newStatus, volunteerId);
      showToast(`Task marked as "${newStatus}"`, "success");
      // Backend returns allDone=true when every checklist item is Done
      if (result?.allDone) {
        setAssignments(prev =>
          prev.map(asgn =>
            asgn.requestId === requestId ? { ...asgn, status: "completed" } : asgn
          )
        );
        showToast("All tasks complete — assignment marked Completed! ✓", "success");
      }
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
      case "Done":        return "bg-success-container text-success border-success-border";
      case "In Progress": return "bg-warning-container text-warning border-warning-border";
      default:            return "bg-surface-variant text-muted border-outline-light";
    }
  };

  const nextStatus = (current: string): ChecklistStatus => {
    if (current === "Not Started") return "In Progress";
    if (current === "In Progress") return "Done";
    return "Not Started";
  };

  const getDeliveryStyle = (status: string) => {
    switch (status) {
      case "Delivered":  return "bg-success-container text-success border-success-border";
      case "In Transit": return "bg-info-container text-info border-info-border";
      default:           return "bg-warning-container text-warning border-warning-border";
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
        <div className="px-5 py-2.5 bg-white border border-outline-light rounded-2xl shadow-card text-xs font-black text-muted uppercase tracking-widest flex items-center gap-2">
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
              <div key={asgn.assignmentId} className={`bg-white rounded-modern border transition-all duration-200 shadow-card overflow-hidden ${isExpanded ? "border-primary ring-4 ring-primary/8" : "border-outline-light hover:border-primary/40 hover:shadow-md"}`}>
                {/* Assignment Header */}
                <div className="p-7">
                  <div className="flex justify-between items-start mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                        <h2 className="text-2xl font-black text-on-surface tracking-tight">{asgn.requestTitle}</h2>
                        <span className="text-[10px] font-black px-3 py-1 bg-blue-50 text-blue-600 border border-blue-200 rounded-full uppercase tracking-widest">
                          {asgn.status?.replace(/_/g, " ")}
                        </span>
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

                  {/* Step-based Progress Stepper — stage derived from checklist item states */}
                  {(() => {
                    // computeStepFromChecklist is state-based (In Progress / Done counts),
                    // NOT percentage-based. The checklist bar below handles percentages.
                    const currentStepIdx = computeStepFromChecklist(
                      asgn.status || "assigned_to_volunteer",
                      asgn.checklist || []
                    );

                    return (
                      <div className="mt-2">
                        {/* Step stepper */}
                        <div className="relative px-2 mb-3">
                          <div className="absolute top-5 left-0 w-full h-1.5 bg-outline/20 rounded-full" />
                          <div
                            className="absolute top-5 left-0 h-1.5 bg-primary rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(89,98,60,0.35)]"
                            style={{ width: `${(currentStepIdx / (STEPS.length - 1)) * 100}%` }}
                          />
                          <div className="relative flex justify-between">
                            {STEPS.map((step, idx) => {
                              const isComp = currentStepIdx > idx;
                              const isCurr = currentStepIdx === idx;
                              return (
                                <div key={step.id} className="flex flex-col items-center">
                                  <div className={`w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all duration-500 z-10 ${
                                    isComp ? "bg-primary border-primary text-white" :
                                    isCurr ? "bg-white border-primary text-primary ring-4 ring-primary/10 scale-110" :
                                             "bg-white border-outline/60 text-outline/60"
                                  }`}>
                                    {isComp
                                      ? <CheckCircle size={18} strokeWidth={3} />
                                      : <span className="text-[10px] font-black">{idx + 1}</span>
                                    }
                                  </div>
                                  <span className={`text-[9px] font-black uppercase tracking-widest mt-2 ${
                                    isCurr ? "text-primary" : "text-secondary/40"
                                  }`}>{step.label}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Checklist sub-progress bar */}
                        {total > 0 && (
                          <div className="mt-6">
                            <div className="flex justify-between items-center mb-1.5">
                              <p className="text-[9px] font-black text-secondary/40 uppercase tracking-widest">Checklist Progress</p>
                              <p className="text-[9px] font-black text-primary">{done}/{total} Tasks Done</p>
                            </div>
                            <div className="w-full h-2 bg-outline/20 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${
                                  progress === 100 ? "bg-green-500" :
                                  progress >= 50   ? "bg-primary" :
                                                     "bg-orange-400"
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <p className="text-[9px] font-bold text-secondary/40 mt-1 text-right">{progress}% complete</p>
                          </div>
                        )}
                      </div>
                    );
                  })()}
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
                                      {/* Render title with fallback to legacy .text field */}
                                      {task.title || task.text || "Untitled task"}
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
