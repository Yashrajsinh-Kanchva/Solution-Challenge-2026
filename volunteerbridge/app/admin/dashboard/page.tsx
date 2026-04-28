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
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-semibold text-secondary/60">Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  const topArea = predictedAreas[0] ?? null;

  return (
    <>
      {/* ── Dispatch Modal ── */}
      {dispatchOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(28,29,23,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setDispatchOpen(false)}
        >
          <div
            className="bg-white rounded-modern border-2 border-outline/60 p-8 w-full max-w-md shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-black text-on-surface">Dispatch Teams</h2>
                <p className="text-sm text-secondary/60 mt-1">
                  Assign volunteers to {topArea?.area ?? "the area"}
                </p>
              </div>
              <button
                onClick={() => setDispatchOpen(false)}
                className="p-1.5 hover:bg-surface-variant rounded-lg transition-colors"
              >
                <X size={18} className="text-secondary/60" />
              </button>
            </div>
            <div className="space-y-3 mb-6">
              {dispatchVolunteers.length === 0 ? (
                <p className="text-sm text-secondary/60 italic py-4 text-center">No available volunteers found.</p>
              ) : (
                dispatchVolunteers.map((v: any) => (
                  <label key={v.volunteerId} className="flex items-center gap-3 p-3 border-2 border-outline/50 rounded-button cursor-pointer hover:border-primary/50 hover:bg-surface-variant/20 transition-all">
                    <input
                      type="checkbox"
                      className="w-4 h-4 rounded text-primary"
                      checked={selectedDispatch.has(v.volunteerId)}
                      onChange={() => setSelectedDispatch(prev => {
                        const n = new Set(prev);
                        n.has(v.volunteerId) ? n.delete(v.volunteerId) : n.add(v.volunteerId);
                        return n;
                      })}
                    />
                    <span className="text-sm font-semibold text-on-surface">
                      {v.name || v.volunteerId}
                      {v.skills?.length ? ` · ${v.skills.slice(0, 2).join(", ")}` : ""}
                    </span>
                  </label>
                ))
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setDispatchOpen(false)}
                className="flex-1 py-2.5 border-2 border-outline/70 text-secondary font-bold text-sm rounded-button hover:bg-surface-variant transition-colors"
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
                className="flex-1 py-2.5 bg-primary text-white font-bold text-sm rounded-button hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                {dispatching ? "Dispatching…" : `Confirm Dispatch (${selectedDispatch.size})`}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Review Modal ── */}
      {reviewOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(28,29,23,0.45)", backdropFilter: "blur(4px)" }}
          onClick={() => setReviewOpen(false)}
        >
          <div
            className="bg-white rounded-modern border-2 border-outline/60 p-8 w-full max-w-lg shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-xl font-black text-on-surface">AI Prediction Data</h2>
                <p className="text-sm text-secondary/60 mt-1">Top predicted high-need areas</p>
              </div>
              <button onClick={() => setReviewOpen(false)} className="p-1.5 hover:bg-surface-variant rounded-lg transition-colors">
                <X size={18} className="text-secondary/60" />
              </button>
            </div>
            <div className="space-y-3 mb-6">
              {predictedAreas.slice(0, 4).map((area: any, i: number) => (
                <div key={i} className="flex justify-between items-center p-4 bg-surface-variant/30 border border-outline/40 rounded-button">
                  <div>
                    <p className="font-bold text-sm text-on-surface">{area.area}</p>
                    <p className="text-xs text-secondary/60 mt-0.5">{area.needType ?? "General"}</p>
                  </div>
                  <span className="text-xs font-black px-3 py-1 rounded-full bg-error/10 text-error border border-error/20">
                    Score: {area.score ?? "—"}
                  </span>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setReviewOpen(false); router.push("/admin/predictions"); }}
              className="w-full py-2.5 bg-primary text-white font-bold text-sm rounded-button hover:bg-primary/90 transition-colors"
            >
              View Full Predictions
            </button>
          </div>
        </div>
      )}

      {/* ── Main Dashboard Grid ── */}
      <div className="grid grid-cols-12 gap-10">

        {/* Left Column */}
        <div className="col-span-8 space-y-10">

          {/* Primary Incident Card */}
          <section className="bg-white rounded-modern border border-outline-light overflow-hidden shadow-card">
            <div className="px-8 py-6 border-b border-outline-light flex justify-between items-start">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="bg-error text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-sm">
                    {topArea ? "High Need Area" : "Monitoring"}
                  </span>
                  <span className="text-xs font-bold text-secondary/50 flex items-center gap-1.5">
                    <Clock size={12} />
                    Live Prediction
                  </span>
                </div>
                <h2 className="text-3xl font-black text-on-surface leading-tight">
                  {topArea ? topArea.locationName || topArea.area : "System Nominal"}{" "}
                  <span className="text-secondary/30 font-medium">#PRED</span>
                </h2>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setReviewOpen(true)}
                  className="px-6 py-2.5 border-2 border-outline/80 text-secondary font-bold text-sm rounded-button hover:bg-surface-variant transition-colors active:scale-95"
                >
                  Review Data
                </button>
                <button
                  onClick={() => setDispatchOpen(true)}
                  className="px-8 py-2.5 bg-primary text-white font-bold text-sm rounded-button hover:bg-primary/90 transition-all shadow-[0_16px_32px_-18px_rgba(89,98,60,0.4)] active:scale-95"
                >
                  Dispatch Teams
                </button>
              </div>
            </div>

          {/* Priority cards + briefing — no fixed height, stacks naturally */}
            <div className="flex gap-0 border-t border-outline-light">
            {/* Left: stacked priority cards */}
            <div className="flex-1 min-w-0 p-6 space-y-4 overflow-y-auto no-scrollbar" style={{ maxHeight: "480px" }}>
              {predictedAreas.length > 0 ? (
                predictedAreas.slice(0, 3).map((area: any, index: number) => (
                  <div
                    key={area.id}
                    className="p-5 bg-white rounded-[14px] border-2 border-outline/50 shadow-sm"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-black text-secondary/50 uppercase tracking-wider">Priority #{index + 1}</span>
                      <strong className="text-sm font-black text-on-surface">{area.score}/100</strong>
                    </div>
                    <h3 className="text-base font-black text-on-surface mb-0.5">{area.area}</h3>
                    <p className="text-xs text-secondary/60 mb-2">{area.category}</p>
                    <p className="text-sm text-on-surface-variant leading-relaxed mb-3">{area.trigger}</p>
                    <div className="flex items-center gap-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                        area.trend === "up"
                          ? "bg-green-50 text-green-700 border border-green-200"
                          : area.trend === "down"
                          ? "bg-red-50 text-red-600 border border-red-200"
                          : "bg-surface-variant text-secondary border border-outline/40"
                      }`}>
                        {area.trend}
                      </span>
                      <p className="text-xs text-secondary/60 leading-snug">{area.outlook}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-48 gap-3 text-secondary/40">
                  <BarChart3 size={36} strokeWidth={1.5} />
                  <p className="text-sm font-semibold">No prediction data available</p>
                </div>
              )}
            </div>

            {/* Right: situation briefing */}
              <div
              className="w-72 flex-shrink-0 p-8 space-y-6 border-l border-outline-light overflow-y-auto no-scrollbar"
              style={{ maxHeight: "480px" }}
            >
              <div>
                <h3 className="text-[10px] font-black text-secondary/60 uppercase tracking-[0.2em] mb-3">
                  Situation Briefing
                </h3>
                <p className="text-sm text-on-surface-variant leading-relaxed">
                  {topArea
                    ? `AI predicts an imminent spike in needs around ${topArea.area}. Recommended to standby volunteers.`
                    : "No critical areas detected. Continue routine operations."}
                </p>
              </div>

              <div className="space-y-3">
                <div className="p-4 bg-white rounded-modern border-2 border-outline/50">
                  <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">Total Citizens</p>
                  <span className="text-2xl font-black text-on-surface">{data.metrics.totalCitizens}</span>
                </div>
                <div className="p-4 bg-white rounded-modern border-2 border-outline/50">
                  <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">Approved NGOs</p>
                  <span className="text-2xl font-black text-on-surface">{data.metrics.totalNgos}</span>
                </div>
              </div>

              <div>
                <h3 className="text-[10px] font-black text-secondary/60 uppercase tracking-[0.2em] mb-3">Platform Status</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-[11px] font-bold rounded-full border border-green-200">All Systems Go</span>
                  <span className="px-3 py-1 bg-green-50 text-green-700 text-[11px] font-bold rounded-full border border-green-200">API Live</span>
                </div>
              </div>
            </div>
          </div>
          </section>

          {/* Action Queue */}
          <section className="space-y-5">
            <div className="px-1">
              <h2 className="text-xl font-black text-on-surface">Action Queue</h2>
              <p className="text-sm text-secondary/50 font-medium">Recent registrations and pending approvals</p>
            </div>
            <div className="grid grid-cols-2 gap-6">

              {/* NGO Approvals Card */}
              <button
                onClick={() => router.push("/admin/ngo-approvals")}
                className="group text-left p-6 bg-white border border-outline-light rounded-modern hover:border-primary/50 hover:shadow-md transition-all duration-200 shadow-card w-full"
              >
                <div className="flex justify-between items-start mb-5">
                  <span className="bg-orange-600 text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    Needs Review
                  </span>
                  <span className="text-xs text-secondary/40 font-bold">{data.metrics.pendingNgoApprovals} Pending</span>
                </div>
                <h4 className="text-base font-black text-on-surface mb-1 group-hover:text-primary transition-colors">Pending NGO Approvals</h4>
                <p className="text-sm text-on-surface-variant mb-5 opacity-80">
                  Organizations waiting for admin verification.
                </p>
                <div className="flex flex-col gap-2 mb-5">
                  {data.recentNgos?.filter((n: any) => n.status === "pending").slice(0, 2).map((ngo: any) => (
                    <div key={ngo.id} className="text-sm text-on-surface font-semibold flex justify-between">
                      <span>{ngo.ngoName}</span>
                      <span className="text-secondary/60">{ngo.area}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t-2 border-outline/40">
                  <span className="text-primary font-black text-xs uppercase tracking-widest">Review All</span>
                  <ArrowRight size={14} className="text-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

              {/* Latest Users Card */}
              <button
                onClick={() => router.push("/admin/users")}
                className="group text-left p-6 bg-white border border-outline-light rounded-modern hover:border-primary/50 hover:shadow-md transition-all duration-200 shadow-card w-full"
              >
                <div className="flex justify-between items-start mb-5">
                  <span className="bg-primary text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest">
                    Recent Activity
                  </span>
                  <span className="text-xs text-secondary/40 font-bold">New signups</span>
                </div>
                <h4 className="text-base font-black text-on-surface mb-1 group-hover:text-primary transition-colors">Latest Users</h4>
                <p className="text-sm text-on-surface-variant mb-5 opacity-80">
                  Recent volunteer and citizen registrations.
                </p>
                <div className="flex flex-col gap-2 mb-5">
                  {data.recentUsers?.slice(0, 2).map((user: any) => (
                    <div key={user.id} className="text-sm text-on-surface font-semibold flex justify-between">
                      <span>{user.name}</span>
                      <span className="text-secondary/60">{formatDateLabel(user.registeredAt || new Date().toISOString())}</span>
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-between pt-4 border-t-2 border-outline/40">
                  <span className="text-primary font-black text-xs uppercase tracking-widest">View Directory</span>
                  <ArrowRight size={14} className="text-primary group-hover:translate-x-1 transition-transform" />
                </div>
              </button>

            </div>
          </section>
        </div>

        {/* Right Sidebar */}
        <div className="col-span-4 space-y-8">

          {/* Admin Tasks */}
          <div className="bg-white rounded-modern border border-outline-light overflow-hidden shadow-card">
            <div className="bg-surface-variant px-6 py-5 border-b border-outline-light flex justify-between items-center">
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-secondary/70">Admin Tasks</h3>
              <span className="text-xs font-bold text-secondary/40 bg-outline/20 px-2 py-0.5 rounded-full">
                {tasks.filter((t) => !t.done).length} open
              </span>
            </div>
            <div className="p-5">
              <div className="space-y-1">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center gap-3 p-3 hover:bg-surface-variant/20 rounded-button transition-all group"
                  >
                    <button
                      onClick={() => toggleTask(task.id)}
                      className="flex-shrink-0 text-secondary/40 hover:text-primary transition-colors"
                    >
                      {task.done
                        ? <CheckSquare size={20} className="text-primary" />
                        : <Square size={20} />}
                    </button>
                    <span className={`flex-1 text-sm font-semibold transition-all ${task.done ? "line-through text-secondary/40" : "text-on-surface"}`}>
                      {task.text}
                    </span>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="opacity-0 group-hover:opacity-100 p-0.5 hover:text-error transition-all"
                    >
                      <X size={14} className="text-secondary/40 hover:text-error" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Inline new task input */}
              {showNewTask ? (
                <div className="mt-3 flex gap-2">
                  <input
                    ref={inputRef}
                    value={newTaskText}
                    onChange={(e) => setNewTaskText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") addTask(); if (e.key === "Escape") { setShowNewTask(false); setNewTaskText(""); } }}
                    placeholder="Type task and press Enter..."
                    className="flex-1 text-sm border-2 border-primary/40 rounded-button px-3 py-2 outline-none focus:border-primary transition-colors"
                  />
                  <button onClick={addTask} className="px-3 py-2 bg-primary text-white rounded-button text-xs font-bold hover:bg-primary/90 transition-colors">
                    Add
                  </button>
                  <button onClick={() => { setShowNewTask(false); setNewTaskText(""); }} className="px-3 py-2 border-2 border-outline/60 rounded-button text-xs font-bold text-secondary hover:bg-surface-variant transition-colors">
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewTask(true)}
                  className="w-full mt-3 py-3 border-2 border-dashed border-outline/60 text-secondary/50 rounded-button text-[11px] font-black uppercase tracking-widest hover:border-primary/50 hover:text-primary transition-all flex items-center justify-center gap-2"
                >
                  <Plus size={14} />
                  Create Action Item
                </button>
              )}
            </div>
          </div>

          {/* Personnel Management */}
          <div className="bg-white rounded-modern border border-outline-light overflow-hidden shadow-card">
            <div className="bg-surface-variant px-6 py-5 border-b border-outline-light">
              <h3 className="font-black text-xs uppercase tracking-[0.2em] text-secondary/70">Personnel Mgmt</h3>
            </div>
            <div className="p-6 space-y-6">
              <div className="space-y-3">
                <div className="flex justify-between items-end">
                  <div>
                    <p className="text-[10px] font-black text-secondary/40 uppercase tracking-widest mb-1">Registered Volunteers</p>
                    <p className="text-3xl font-black text-on-surface">
                      {data.metrics.totalVolunteers}{" "}
                      <span className="text-secondary/30 text-xl">/ {data.metrics.totalUsers}</span>
                    </p>
                  </div>
                </div>
                <div className="w-full bg-outline/20 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-primary h-full rounded-full transition-all duration-1000"
                    style={{ width: `${Math.min((data.metrics.totalVolunteers / (data.metrics.totalUsers || 1)) * 100, 100)}%` }}
                  />
                </div>
              </div>
              <button
                onClick={() => router.push("/admin/users")}
                className="w-full py-3 bg-primary-container text-on-primary-container font-black text-xs uppercase tracking-widest rounded-button hover:bg-primary-container/80 transition-all active:scale-[0.98] shadow-sm flex items-center justify-center gap-2"
              >
                <Users size={14} />
                View Volunteers
              </button>
            </div>
          </div>

          {/* Quick Access */}
          <div className="p-6 bg-primary-container rounded-modern border border-outline-light">
            <h4 className="text-[10px] font-black text-secondary uppercase tracking-widest mb-4 flex items-center gap-2">
              <Zap size={14} />
              Quick Access
            </h4>
            <div className="space-y-2">
              {[
                { label: "User Directory", href: "/admin/users", Icon: Users },
                { label: "NGO Approval Queue", href: "/admin/ngo-approvals", Icon: ShieldCheck },
                { label: "Analytics Dashboard", href: "/admin/analytics", Icon: BarChart3 },
              ].map(({ label, href, Icon }) => (
                <button
                  key={href}
                  onClick={() => router.push(href)}
                  className="w-full flex items-center justify-between p-3 bg-white/80 hover:bg-white rounded-button text-xs font-bold text-primary transition-all border border-transparent hover:border-primary/20 shadow-sm group"
                >
                  <span className="flex items-center gap-2">
                    <Icon size={13} />
                    {label}
                  </span>
                  <ExternalLink size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                </button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
