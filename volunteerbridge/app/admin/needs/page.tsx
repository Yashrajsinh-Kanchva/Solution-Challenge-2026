"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import NeedRequestTable from "@/components/admin/NeedRequestTable";
import { apiClient } from "@/lib/api/client";
import type { ManagedNeedRequest } from "@/lib/types/admin";
import {
  Plus, X, Search, Filter, Download, RefreshCw,
  ClipboardList, CheckCircle, XCircle, Clock,
} from "lucide-react";

const CATEGORIES = ["Food", "Health", "Shelter", "Education", "Employment", "Safety"];
type UrgencyLevel = ManagedNeedRequest["urgency"];
type StatusFilter  = "all" | "pending" | "approved" | "rejected";

const DEFAULT_FORM = {
  title: "", category: CATEGORIES[0], location: "",
  urgency: "medium" as UrgencyLevel, requestedBy: "",
  beneficiaries: "50", summary: "",
};

export default function NeedsPage() {
  const [requests,   setRequests]   = useState<any[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showForm,   setShowForm]   = useState(false);
  const [formState,  setFormState]  = useState(DEFAULT_FORM);

  // Filters
  const [search,     setSearch]     = useState("");
  const [statusF,    setStatusF]    = useState<StatusFilter>("all");
  const [categoryF,  setCategoryF]  = useState("all");
  const [urgencyF,   setUrgencyF]   = useState("all");

  useEffect(() => {
    apiClient.getRequests()
      .then(data => setRequests(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Computed stats
  const stats = useMemo(() => ({
    total:    requests.length,
    pending:  requests.filter(r => r.status === "pending").length,
    approved: requests.filter(r => r.status === "approved").length,
    rejected: requests.filter(r => r.status === "rejected").length,
  }), [requests]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return requests.filter(r => {
      if (statusF   !== "all" && r.status   !== statusF)   return false;
      if (categoryF !== "all" && r.category !== categoryF) return false;
      if (urgencyF  !== "all" && r.urgency  !== urgencyF)  return false;
      if (q && !r.title.toLowerCase().includes(q) &&
               !r.requestedBy.toLowerCase().includes(q) &&
               !r.location.toLowerCase().includes(q))      return false;
      return true;
    });
  }, [requests, search, statusF, categoryF, urgencyF]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const newReq = await apiClient.createRequest({
        ...formState,
        beneficiaries: Number(formState.beneficiaries),
        status: "pending",
        createdAt: new Date().toISOString().slice(0, 10),
      });
      setRequests(cur => [newReq, ...cur]);
      setFormState(DEFAULT_FORM);
      setShowForm(false);
    } catch {
      alert("Failed to create request.");
    } finally {
      setSubmitting(false);
    }
  };

  const onStatusChange = async (id: string, next: "approved" | "rejected") => {
    try {
      await apiClient.updateRequestStatus(id, next);
      setRequests(cur => cur.map(r => r.id === id ? { ...r, status: next } : r));
    } catch {
      alert("Failed to update status.");
    }
  };

  const onDelete = (id: string) => {
    if (!confirm("Delete this request permanently?")) return;
    setRequests(cur => cur.filter(r => r.id !== id));
  };

  const onExport = () => {
    const rows = [
      ["ID", "Title", "Category", "Location", "Urgency", "Beneficiaries", "Status", "Requested By", "Created"],
      ...filtered.map(r => [r.id, r.title, r.category, r.location, r.urgency, r.beneficiaries, r.status, r.requestedBy, r.createdAt]),
    ];
    const csv  = rows.map(r => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = "need-requests.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const field = (key: keyof typeof formState) => ({
    value: formState[key],
    onChange: (e: any) => setFormState(c => ({ ...c, [key]: e.target.value })),
  });

  return (
    <div className="page-stack">

      {/* ── Header ── */}
      <section className="page-header">
        <div>
          <p className="page-header__eyebrow">Feature 4</p>
          <h2>NGO Need Request Management</h2>
          <p>Create, review, approve or reject needs — filter by status, urgency, and category.</p>
        </div>
        <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap" }}>
          {stats.pending > 0 && (
            <span className="highlight-chip">{stats.pending} pending</span>
          )}
          <button className="ghost-button" onClick={onExport}
            style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
            <Download size={14} /> Export CSV
          </button>
          <button className="primary-button" onClick={() => setShowForm(v => !v)}
            style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Cancel" : "New Request"}
          </button>
        </div>
      </section>

      {/* ── KPI strip ── */}
      <div className="metric-grid">
        {[
          { label:"Total",    val:stats.total,    Icon:ClipboardList, color:"#59623c" },
          { label:"Pending",  val:stats.pending,  Icon:Clock,         color:"#b45309" },
          { label:"Approved", val:stats.approved, Icon:CheckCircle,   color:"#2e7d32" },
          { label:"Rejected", val:stats.rejected, Icon:XCircle,       color:"#ba1a1a" },
        ].map(({ label, val, Icon, color }) => (
          <div key={label} className="metric-card" style={{ cursor:"pointer" }}
            onClick={() => setStatusF(label.toLowerCase() as StatusFilter)}>
            <div className="metric-card__meta">
              <p>{label} Requests</p>
              <h3>{val}</h3>
              <span>Click to filter</span>
            </div>
            <div className="metric-card__icon" style={{ background: color + "18", color }}>
              <Icon size={20} strokeWidth={2} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Create Form (slide-in) ── */}
      {showForm && (
        <section className="tool-surface" style={{ border:"2px solid #ccd6a6", borderRadius:16 }}>
          <div className="surface-header">
            <div className="section-copy">
              <p className="section-kicker">Create Need Request</p>
              <h3>Raise a new NGO request manually</h3>
            </div>
          </div>
          <form className="form-grid" onSubmit={onSubmit}>
            <input className="text-input" placeholder="Request title" required {...field("title")} />
            <select className="text-input" {...field("category")}>
              {CATEGORIES.map(c => <option key={c}>{c}</option>)}
            </select>
            <input className="text-input" placeholder="Location / area" required {...field("location")} />
            <input className="text-input" placeholder="NGO / requester" required {...field("requestedBy")} />
            <select className="text-input" {...field("urgency")}>
              <option value="low">Low urgency</option>
              <option value="medium">Medium urgency</option>
              <option value="high">High urgency</option>
            </select>
            <input className="text-input" type="number" min="1" placeholder="Beneficiaries" {...field("beneficiaries")} />
            <textarea className="text-area" placeholder="Request summary (min 20 chars)" required {...field("summary")} />
            <div className="form-actions" style={{ gap:"0.75rem" }}>
              <button type="button" className="ghost-button" onClick={() => { setShowForm(false); setFormState(DEFAULT_FORM); }}>
                Cancel
              </button>
              <button type="submit" className="primary-button" disabled={submitting}>
                {submitting ? "Saving…" : "Create Request"}
              </button>
            </div>
          </form>
        </section>
      )}

      {/* ── Search + Filter bar ── */}
      <div className="tool-surface" style={{ padding:"1rem 1.25rem" }}>
        <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", alignItems:"center" }}>
          {/* Search */}
          <div style={{ position:"relative", flex:1, minWidth:"200px" }}>
            <Search size={14} style={{ position:"absolute", left:"0.75rem", top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }} />
            <input
              className="text-input"
              style={{ paddingLeft:"2.25rem", margin:0 }}
              placeholder="Search by title, NGO, or location…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>

          {/* Status filter */}
          <select className="text-input" style={{ width:"auto", margin:0 }} value={statusF} onChange={e => setStatusF(e.target.value as StatusFilter)}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          {/* Category filter */}
          <select className="text-input" style={{ width:"auto", margin:0 }} value={categoryF} onChange={e => setCategoryF(e.target.value)}>
            <option value="all">All Categories</option>
            {CATEGORIES.map(c => <option key={c}>{c}</option>)}
          </select>

          {/* Urgency filter */}
          <select className="text-input" style={{ width:"auto", margin:0 }} value={urgencyF} onChange={e => setUrgencyF(e.target.value)}>
            <option value="all">All Urgencies</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          {/* Clear filters */}
          {(search || statusF !== "all" || categoryF !== "all" || urgencyF !== "all") && (
            <button className="ghost-button" onClick={() => { setSearch(""); setStatusF("all"); setCategoryF("all"); setUrgencyF("all"); }}
              style={{ display:"flex", alignItems:"center", gap:"0.4rem", whiteSpace:"nowrap" }}>
              <RefreshCw size={13} /> Clear
            </button>
          )}

          <span style={{ fontSize:"0.8rem", color:"#6b7466", fontWeight:600, whiteSpace:"nowrap", marginLeft:"auto" }}>
            {filtered.length} of {stats.total} results
          </span>
        </div>
      </div>

      {/* ── Table ── */}
      <section className="tool-surface">
        <div className="surface-header">
          <div className="section-copy">
            <p className="section-kicker">Submitted Requests</p>
            <h3>Approval workflow</h3>
          </div>
          <div style={{ display:"flex", gap:"0.5rem" }}>
            <div className="tab-row" style={{ marginBottom:0, padding:"0.2rem" }}>
              {(["all","pending","approved","rejected"] as StatusFilter[]).map(s => (
                <button key={s} onClick={() => setStatusF(s)}
                  className={`tab-button ${statusF === s ? "active" : ""}`}
                  style={{ padding:"0.3rem 0.7rem", fontSize:"0.78rem" }}>
                  {s.charAt(0).toUpperCase()+s.slice(1)}
                  {s !== "all" && (
                    <strong>{stats[s as keyof typeof stats]}</strong>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ padding:"2rem", display:"flex", alignItems:"center", gap:"0.75rem", color:"#6b7466" }}>
            <div style={{ width:18, height:18, border:"2px solid #ccd6a6", borderTopColor:"#59623c", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
            Loading requests from database…
          </div>
        ) : (
          <NeedRequestTable
            requests={filtered}
            onStatusChange={onStatusChange}
            onDelete={onDelete}
          />
        )}
      </section>

    </div>
  );
}
