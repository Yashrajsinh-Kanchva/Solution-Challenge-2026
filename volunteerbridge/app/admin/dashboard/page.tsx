"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import NeedHeatmap from "@/components/admin/NeedHeatmap";
import { apiClient } from "@/lib/api/client";
import { formatDateLabel } from "@/lib/utils/formatters";
import {
  ExternalLink, CheckSquare, Square, Plus, X, Users,
  ShieldCheck, BarChart3, ArrowRight, Clock, Zap,
} from "lucide-react";

interface Task {
  id: number;
  text: string;
  done: boolean;
}

export default function DashboardPage() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [predictedAreas, setPredictedAreas] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Admin Tasks state
  const [tasks, setTasks] = useState<Task[]>([]);
  const [showNewTask, setShowNewTask] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Dispatch / Review modals
  const [dispatchOpen, setDispatchOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [dispatchVolunteers, setDispatchVolunteers] = useState<any[]>([]);
  const [selectedDispatch, setSelectedDispatch] = useState<Set<string>>(new Set());
  const [dispatching, setDispatching] = useState(false);

  useEffect(() => {
    Promise.all([apiClient.getDashboardStats(), apiClient.getPredictions(), apiClient.getAllVolunteers()])
      .then(([stats, predictions, volunteers]) => {
        setData(stats);
        setPredictedAreas(predictions || []);
        setDispatchVolunteers((volunteers || []).filter((v: any) => v.availability || v.status === "idle").slice(0, 10));
        setTasks([
          { id: 1, text: `Review ${stats?.metrics?.pendingNgoApprovals ?? 0} NGO Applications`, done: false },
          { id: 2, text: "Verify system backups", done: false },
        ]);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (showNewTask) inputRef.current?.focus();
  }, [showNewTask]);

  const toggleTask = (id: number) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, done: !t.done } : t)));

  const addTask = () => {
    const text = newTaskText.trim();
    if (!text) return;
    setTasks((prev) => [...prev, { id: Date.now(), text, done: false }]);
    setNewTaskText("");
    setShowNewTask(false);
  };

  const deleteTask = (id: number) =>
    setTasks((prev) => prev.filter((t) => t.id !== id));

  if (loading || !data) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center space-y-2">
          <div className="w-8 h-8 border-2 border-[#4D5A2C] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-[#6B7160]">Initialising Tactical Display...</p>
        </div>
      </div>
    );
  }

  const topArea = predictedAreas[0] ?? null;

  return (
    <div className="page-stack max-w-[1440px] mx-auto">
      {/* Header Section */}
      <section className="flex flex-col xl:flex-row justify-between items-center gap-8 mb-12">
        <div className="max-w-3xl w-full text-center xl:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1C15] tracking-tight leading-[1.1] mb-3">
            Operational Overview
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#6B7160] leading-relaxed">
            Real-time system health, tactical predictions, and administrative action queue.
          </p>
        </div>
        <div className="flex flex-wrap gap-3 w-full xl:w-auto justify-center xl:justify-end">
          <div className="px-6 py-4 bg-[#F7F5EE] border-2 border-[#E8EDD0] rounded-[24px] flex items-center gap-4">
             <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[11px] font-black uppercase tracking-widest text-[#4D5A2C]">System Live</span>
             </div>
             <div className="w-[2px] h-4 bg-[#E8EDD0]" />
             <span className="text-[11px] font-bold text-[#6B7160] uppercase tracking-widest">
               {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
             </span>
          </div>
        </div>
      </section>

      {/* Dispatch Modal */}
      {dispatchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(28,29,23,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setDispatchOpen(false)}
        >
          <div
            className="bg-white rounded-[48px] border-2 border-[#E8EDD0] p-10 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black text-[#1A1C15] tracking-tight">Dispatch Teams</h2>
                <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest mt-1">
                  Assign volunteers to {topArea?.area ?? "the area"}
                </p>
              </div>
              <button
                onClick={() => setDispatchOpen(false)}
                className="p-2 hover:bg-[#F7F5EE] rounded-2xl transition-all"
              >
                <X size={20} className="text-[#6B7160]" />
              </button>
            </div>
            <div className="space-y-3 mb-8 max-h-[300px] overflow-y-auto no-scrollbar">
              {dispatchVolunteers.length === 0 ? (
                <p className="text-xs font-bold text-[#6B7160] italic py-8 text-center bg-[#F7F5EE] rounded-[32px]">No available volunteers found.</p>
              ) : (
                dispatchVolunteers.map((v: any) => (
                  <label key={v.volunteerId} className={`flex items-center gap-4 p-4 border-2 rounded-[24px] cursor-pointer transition-all ${selectedDispatch.has(v.volunteerId) ? "border-[#4D5A2C] bg-[#EEF3D2]" : "border-[#F7F5EE] hover:border-[#E8EDD0]"}`}>
                    <input
                      type="checkbox"
                      className="w-5 h-5 rounded-lg border-2 border-[#CCD6A6] text-[#4D5A2C] focus:ring-[#4D5A2C]"
                      checked={selectedDispatch.has(v.volunteerId)}
                      onChange={() => setSelectedDispatch(prev => {
                        const n = new Set(prev);
                        n.has(v.volunteerId) ? n.delete(v.volunteerId) : n.add(v.volunteerId);
                        return n;
                      })}
                    />
                    <div>
                      <p className="text-sm font-black text-[#1A1C15]">{v.name || v.volunteerId}</p>
                      <p className="text-[10px] font-bold text-[#6B7160] uppercase tracking-widest">
                        {v.skills?.length ? v.skills.slice(0, 2).join(", ") : "Generalist"}
                      </p>
                    </div>
                  </label>
                ))
              )}
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setDispatchOpen(false)}
                className="flex-1 py-4 border-2 border-[#E8EDD0] text-[#6B7160] font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#F7F5EE] transition-all"
              >
                Cancel
              </button>
              <button
                disabled={dispatching || selectedDispatch.size === 0}
                onClick={async () => {
                  const topRequest = data?.recentRequests?.[0];
                  if (!topRequest?.requestId && !topRequest?.id) {
                    alert("No active request found to dispatch to.");
                    return;
                  }
                  const reqId = topRequest.requestId || topRequest.id;
                  setDispatching(true);
                  try {
                    await Promise.all([...selectedDispatch].map(vid => apiClient.assignVolunteer(reqId, vid)));
                    setSelectedDispatch(new Set());
                    setDispatchOpen(false);
                    alert(`${selectedDispatch.size} volunteer(s) dispatched to request ${reqId}.`);
                  } catch {
                    alert("Dispatch failed — check API connection.");
                  } finally {
                    setDispatching(false);
                  }
                }}
                className="flex-1 py-4 bg-[#4D5A2C] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#647A39] transition-all disabled:opacity-50 shadow-lg shadow-[#4D5A2C]/20"
              >
                {dispatching ? "Dispatching…" : `Confirm (${selectedDispatch.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {reviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(28,29,23,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setReviewOpen(false)}
        >
          <div
            className="bg-white rounded-[48px] border-2 border-[#E8EDD0] p-10 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-8">
              <div>
                <h2 className="text-2xl font-black text-[#1A1C15] tracking-tight">AI Prediction Data</h2>
                <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest mt-1">Top predicted high-need areas</p>
              </div>
              <button onClick={() => setReviewOpen(false)} className="p-2 hover:bg-[#F7F5EE] rounded-2xl transition-all">
                <X size={20} className="text-[#6B7160]" />
              </button>
            </div>
            <div className="space-y-4 mb-10">
              {predictedAreas.slice(0, 4).map((area: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-5 bg-[#F7F5EE] border-2 border-transparent hover:border-[#E8EDD0] rounded-[32px] transition-all">
                  <div>
                    <p className="text-[15px] font-black text-[#1A1C15]">{area.area}</p>
                    <p className="text-[10px] font-bold text-[#6B7160] uppercase tracking-widest mt-0.5">{area.needType ?? "General"}</p>
                  </div>
                  <span className="text-[11px] font-black px-4 py-1.5 rounded-full bg-white text-[#BA1A1A] border-2 border-[#FEE2E2] shadow-sm">
                    {area.score}% Risk
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setReviewOpen(false); router.push("/admin/predictions"); }}
              className="w-full py-5 bg-[#4D5A2C] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#647A39] transition-all shadow-lg shadow-[#4D5A2C]/20"
            >
              View Full Intelligence Report
            </button>
          </div>
        </div>
      )}

      {/* Main Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">

        {/* Left Column */}
        <div className="flex flex-col gap-12 lg:col-span-8">

          {/* Primary Incident Card */}
          <section className="bg-white border-2 border-[#E8EDD0] rounded-[48px] overflow-hidden shadow-sm">
            <div className="px-8 sm:px-12 py-10 border-b-2 border-[#F7F5EE] flex flex-col sm:flex-row justify-between items-start gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border-2 ${topArea ? "bg-[#FEE2E2] text-[#BA1A1A] border-[#FEE2E2]" : "bg-[#EEF3D2] text-[#4D5A2C] border-[#EEF3D2]"}`}>
                    {topArea ? "High Need Area" : "Monitoring"}
                  </span>
                  <div className="flex items-center gap-2 text-[10px] font-black text-[#6B7160] uppercase tracking-widest opacity-60">
                    <Clock size={12} strokeWidth={2.5} />
                    Live Analysis
                  </div>
                </div>
                <h2 className="text-3xl sm:text-5xl font-black text-[#1A1C15] tracking-tight leading-[1.1]">
                  {topArea ? topArea.locationName || topArea.area : "System Nominal"}
                </h2>
              </div>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={() => setReviewOpen(true)}
                  className="flex-1 sm:flex-none px-8 py-4 border-2 border-[#E8EDD0] text-[#4D5A2C] font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#F7F5EE] transition-all"
                >
                  Briefing
                </button>
                <button
                  onClick={() => setDispatchOpen(true)}
                  className="flex-1 sm:flex-none px-8 py-4 bg-[#4D5A2C] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#647A39] transition-all shadow-lg shadow-[#4D5A2C]/20"
                >
                  Dispatch
                </button>
              </div>
            </div>

            <div className="flex flex-col xl:flex-row divide-y-2 xl:divide-y-0 xl:divide-x-2 divide-[#F7F5EE]">
              {/* Left: Priority feed */}
              <div className="flex-1 p-8 sm:p-10 space-y-6 max-h-[520px] overflow-y-auto no-scrollbar">
                <h3 className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest mb-6 opacity-60">Critical Areas Queue</h3>
                {predictedAreas.length > 0 ? (
                  predictedAreas.slice(0, 3).map((area: any, index: number) => (
                    <div
                      key={area.id}
                      className="group p-6 bg-[#F7F5EE] border-2 border-transparent hover:border-[#E8EDD0] rounded-[32px] transition-all"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <span className="text-[9px] font-black text-[#4D5A2C] bg-[#EEF3D2] px-3 py-1 rounded-full uppercase tracking-widest">Zone {index + 1}</span>
                        <div className="text-sm font-black text-[#1A1C15]">
                          {area.score}% <span className="text-[#6B7160] opacity-50 font-bold">Conf.</span>
                        </div>
                      </div>
                      <h3 className="text-xl font-black text-[#1A1C15] mb-2 group-hover:text-[#4D5A2C] transition-colors">{area.area}</h3>
                      <p className="text-xs font-bold text-[#6B7160] mb-6 leading-relaxed line-clamp-2">{area.trigger}</p>
                      <div className="flex items-center gap-4">
                         <div className={`flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest ${area.trend === "up" ? "text-[#BA1A1A]" : "text-[#166534]"}`}>
                            <Zap size={10} fill="currentColor" />
                            {area.trend === "up" ? "Escalating" : "Stable"}
                         </div>
                         <div className="w-1 h-1 bg-[#CCD6A6] rounded-full" />
                         <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest opacity-60">{area.category}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 gap-4 text-[#6B7160]/40">
                    <BarChart3 size={48} strokeWidth={2} />
                    <p className="text-xs font-black uppercase tracking-widest">Awaiting prediction sweep</p>
                  </div>
                )}
              </div>

              {/* Right: Operational briefing */}
              <div className="xl:w-96 p-8 sm:p-10 space-y-10 bg-[#F7F5EE]/30">
                <div>
                  <h3 className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest mb-6 opacity-60">Situation Briefing</h3>
                  <p className="text-lg font-black text-[#1A1C15] leading-tight mb-4">
                    {topArea
                      ? `Neural engine predicts high requirements in ${topArea.area}.`
                      : "Environment scan complete. Current status: Nominal."}
                  </p>
                  <p className="text-xs font-medium text-[#6B7160] leading-relaxed">
                    Volunteer readiness levels remain high. Cross-referencing current weather patterns with localized need reports.
                  </p>
                </div>

                <div className="grid grid-cols-2 xl:grid-cols-1 gap-4">
                  <div className="p-6 bg-white border-2 border-[#E8EDD0] rounded-[32px] shadow-sm">
                    <p className="text-[9px] font-black text-[#6B7160] uppercase tracking-widest mb-2">Total Outreach</p>
                    <span className="text-3xl font-black text-[#1A1C15]">{data.metrics.totalCitizens}</span>
                  </div>
                  <div className="p-6 bg-white border-2 border-[#E8EDD0] rounded-[32px] shadow-sm">
                    <p className="text-[9px] font-black text-[#6B7160] uppercase tracking-widest mb-2">Partner NGOs</p>
                    <span className="text-3xl font-black text-[#1A1C15]">{data.metrics.totalNgos}</span>
                  </div>
                </div>

                <div>
                   <h3 className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest mb-4 opacity-60">Fleet Status</h3>
                   <div className="flex flex-wrap gap-2">
                     <div className="flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-2xl border-2 border-emerald-100">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Network Secure</span>
                     </div>
                   </div>
                </div>
              </div>
            </div>
          </section>

          {/* Action Queue */}
          <section className="space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#1A1C15] tracking-tight">Action Queue</h2>
                <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest mt-1">Pending administrative reviews</p>
              </div>
              <button 
                onClick={() => router.push("/admin/ngo-approvals")}
                className="p-3 bg-[#F7F5EE] border-2 border-[#E8EDD0] rounded-2xl text-[#4D5A2C] font-black hover:bg-[#EEF3D2] transition-all"
              >
                <ArrowRight size={20} strokeWidth={2.5} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* NGO Approvals */}
              <button
                onClick={() => router.push("/admin/ngo-approvals")}
                className="group relative p-8 bg-white border-2 border-[#E8EDD0] rounded-[48px] shadow-sm hover:border-[#4D5A2C] transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-8">
                    <div className="w-12 h-12 bg-[#FFF7ED] text-[#C2410C] rounded-2xl flex items-center justify-center">
                      <ShieldCheck size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-4xl font-black text-[#1A1C15] opacity-20 group-hover:opacity-100 transition-opacity">
                      {data.metrics.pendingNgoApprovals}
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-[#1A1C15] mb-2 group-hover:text-[#4D5A2C] transition-colors">NGO Registrations</h4>
                  <p className="text-xs font-bold text-[#6B7160] mb-8 leading-relaxed">Verification required for new social sector partners.</p>
                  
                  <div className="flex items-center gap-2 text-[10px] font-black text-[#4D5A2C] uppercase tracking-widest">
                    Process Queue
                    <ArrowRight size={12} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>

              {/* Latest Users */}
              <button
                onClick={() => router.push("/admin/users")}
                className="group relative p-8 bg-white border-2 border-[#E8EDD0] rounded-[48px] shadow-sm hover:border-[#4D5A2C] transition-all text-left overflow-hidden"
              >
                <div className="relative z-10">
                  <div className="flex justify-between items-center mb-8">
                    <div className="w-12 h-12 bg-[#EEF3D2] text-[#4D5A2C] rounded-2xl flex items-center justify-center">
                      <Users size={24} strokeWidth={2.5} />
                    </div>
                    <span className="text-4xl font-black text-[#1A1C15] opacity-20 group-hover:opacity-100 transition-opacity">
                      {data.recentUsers?.length || 0}
                    </span>
                  </div>
                  <h4 className="text-xl font-black text-[#1A1C15] mb-2 group-hover:text-[#4D5A2C] transition-colors">User Directory</h4>
                  <p className="text-xs font-bold text-[#6B7160] mb-8 leading-relaxed">Recent volunteer and citizen community signups.</p>
                  
                  <div className="flex items-center gap-2 text-[10px] font-black text-[#4D5A2C] uppercase tracking-widest">
                    Manage Access
                    <ArrowRight size={12} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              </button>
            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="flex flex-col gap-12 lg:col-span-4">

          {/* Admin Tasks */}
          <div className="bg-white border-2 border-[#E8EDD0] rounded-[48px] overflow-hidden shadow-sm">
            <div className="bg-[#F7F5EE] px-8 py-6 border-b-2 border-[#F7F5EE] flex justify-between items-center">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-[#6B7160]">Admin Tasks</h3>
              <span className="text-[10px] font-black text-[#4D5A2C] bg-[#EEF3D2] px-3 py-1 rounded-full uppercase tracking-widest">
                {tasks.filter((t) => !t.done).length} Open
              </span>
            </div>
            <div className="p-8">
              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-4 p-4 hover:bg-[#F7F5EE] rounded-[24px] transition-all group"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="flex-shrink-0 text-[#CCD6A6] hover:text-[#4D5A2C] transition-colors"
                    >
                      {task.done
                        ? <CheckSquare size={22} className="text-[#4D5A2C]" />
                        : <Square size={22} />}
                    </button>
                    <span className={`flex-1 text-sm font-black transition-all ${task.done ? "line-through text-[#CCD6A6]" : "text-[#1A1C15]"}`}>
                      {task.text}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:text-[#BA1A1A] transition-all"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>

              {showNewTask ? (
                <div className="mt-6 flex flex-col gap-3">
                  <input
                    ref={inputRef}
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addTask(); if (e.key === "Escape") { setShowNewTask(false); setNewTaskText(""); } }}
                    placeholder="Describe mission requirement..."
                    className="w-full text-sm font-black border-2 border-[#E8EDD0] rounded-2xl px-5 py-3 outline-none focus:border-[#4D5A2C] transition-colors"
                  />
                  <div className="flex gap-2">
                    <button onClick={addTask} className="flex-1 py-3 bg-[#4D5A2C] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#647A39] transition-all">
                      Add Item
                    </button>
                    <button onClick={() => { setShowNewTask(false); setNewTaskText(""); }} className="flex-1 py-3 border-2 border-[#E8EDD0] rounded-2xl text-[10px] font-black uppercase tracking-widest text-[#6B7160] hover:bg-[#F7F5EE] transition-all">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewTask(true)}
                  className="w-full mt-6 py-4 border-2 border-dashed border-[#CCD6A6] text-[#6B7160] rounded-[24px] text-[10px] font-black uppercase tracking-widest hover:border-[#4D5A2C] hover:text-[#4D5A2C] transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={16} strokeWidth={3} />
                  Add Mission Target
                </button>
              )}
            </div>
          </div>

          {/* Personnel Management */}
          <div className="bg-white border-2 border-[#E8EDD0] rounded-[48px] overflow-hidden shadow-sm">
            <div className="bg-[#F7F5EE] px-8 py-6 border-b-2 border-[#F7F5EE]">
              <h3 className="font-black text-[10px] uppercase tracking-widest text-[#6B7160]">Tactical Assets</h3>
            </div>
            <div className="p-8 space-y-8">
              <div className="space-y-4">
                 <div>
                    <p className="text-[9px] font-black text-[#6B7160] uppercase tracking-widest mb-2">Registered Personnel</p>
                    <p className="text-4xl font-black text-[#1A1C15]">
                      {data.metrics.totalVolunteers}
                      <span className="text-xl text-[#CCD6A6] ml-2">/ {data.metrics.totalUsers}</span>
                    </p>
                 </div>
                 <div className="w-full bg-[#F7F5EE] h-3 rounded-full overflow-hidden">
                    <div
                      className="bg-[#4D5A2C] h-full rounded-full transition-all duration-1000"
                      style={{ width: `${Math.min((data.metrics.totalVolunteers / (data.metrics.totalUsers || 1)) * 100, 100)}%` }}
                    />
                 </div>
              </div>
              <button
                onClick={() => router.push("/admin/users")}
                className="w-full py-5 bg-[#EEF3D2] text-[#4D5A2C] font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#E8EDD0] transition-all shadow-sm flex items-center justify-center gap-2"
              >
                <Users size={16} strokeWidth={2.5} />
                Asset Directory
              </button>
            </div>
          </div>

          {/* Quick Access */}
          <div className="p-8 bg-[#4D5A2C] rounded-[48px] shadow-lg shadow-[#4D5A2C]/20 text-white">
            <h4 className="text-[10px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 opacity-60">
              <Zap size={14} fill="currentColor" />
              Direct Uplinks
            </h4>
            <div className="space-y-3">
              {[
                { label: "Community Heatmap", href: "/admin/maps", Icon: Zap },
                { label: "Intelligence Hub", href: "/admin/analytics", Icon: BarChart3 },
                { label: "Deployment Plan", href: "/admin/assignments", Icon: ShieldCheck },
              ].map(({ label, href, Icon }) => (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className="w-full flex items-center justify-between p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all border border-white/5 group"
                >
                  <span className="flex items-center gap-3">
                    <Icon size={16} strokeWidth={2.5} />
                    {label}
                  </span>
                  <ExternalLink size={14} className="opacity-40 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
