"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import AssignmentTable from "@/components/admin/AssignmentTable";
import { areaOptions } from "@/lib/mock/admin";
import { apiClient } from "@/lib/api/client";
import {
  Plus, X, Search, RefreshCw, Download,
  Building2, MapPin, Users, CheckCircle,
} from "lucide-react";

export default function AssignmentsPage() {
  const [approvedNgos, setApprovedNgos] = useState<string[]>([]);
  const [assignments,  setAssignments]  = useState<any[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [submitting,   setSubmitting]   = useState(false);
  const [showForm,     setShowForm]     = useState(false);

  // Form state
  const [ngoName,     setNgoName]     = useState("");
  const [campus,      setCampus]      = useState(areaOptions[0]);
  const [coordinator, setCoordinator] = useState("Admin Desk");

  // Filters
  const [search,    setSearch]    = useState("");
  const [campusF,   setCampusF]   = useState("all");

  useEffect(() => {
    Promise.all([apiClient.getNgos(), apiClient.getAssignments()])
      .then(([ngos, assigns]) => {
        const approved = ngos
          .filter((n: any) => n.status === "approved")
          .map((n: any) => n.ngoName || n.name);
        setApprovedNgos(approved);
        if (approved.length > 0) setNgoName(approved[0]);
        setAssignments(Array.isArray(assigns) ? assigns : []);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  // Derived stats
  const stats = useMemo(() => {
    const uniqueNgos   = new Set(assignments.map((a: any) => a.ngoName)).size;
    const uniqueAreas  = new Set(assignments.map((a: any) => a.campus)).size;
    const uncovered    = areaOptions.filter(
      area => !assignments.some((a: any) => a.campus === area)
    ).length;
    return { total: assignments.length, uniqueNgos, uniqueAreas, uncovered };
  }, [assignments]);

  // Filtered list
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return assignments.filter((a: any) => {
      if (campusF !== "all" && a.campus !== campusF) return false;
      if (q && !a.ngoName?.toLowerCase().includes(q) &&
               !a.campus?.toLowerCase().includes(q) &&
               !a.coordinator?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [assignments, search, campusF]);

  // Coverage summary per area
  const areaCoverage = useMemo(() =>
    areaOptions.map(area => ({
      area,
      ngos: assignments.filter((a: any) => a.campus === area).map((a: any) => a.ngoName),
    })),
  [assignments]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ngoName || !campus || !coordinator) return;
    setSubmitting(true);
    try {
      const newAssign = await apiClient.createAssignment({ ngoName, campus, coordinator });
      setAssignments(cur => [newAssign, ...cur]);
      setShowForm(false);
    } catch { alert("Failed to create assignment."); }
    finally { setSubmitting(false); }
  };

  const onDelete = (id: string) => {
    if (!confirm("Remove this assignment?")) return;
    setAssignments(cur => cur.filter((a: any) => a.id !== id));
  };

  const onEdit = (id: string, updates: any) => {
    setAssignments(cur => cur.map((a: any) => a.id === id ? { ...a, ...updates } : a));
  };

  const onExport = () => {
    const rows = [
      ["ID","NGO","Campus","Coordinator","Assigned At"],
      ...filtered.map((a: any) => [a.id, a.ngoName, a.campus, a.coordinator, a.assignedAt]),
    ];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type:"text/csv" });
    const el = Object.assign(document.createElement("a"), {
      href: URL.createObjectURL(blob), download:"assignments.csv",
    });
    el.click(); URL.revokeObjectURL(el.href);
  };

  return (
    <div className="page-stack">

      {/* ── Header ── */}
      <section className="page-header">
        <div>
          <p className="page-header__eyebrow">Feature 7</p>
          <h2>NGO Assignment Management</h2>
          <p>Assign approved NGOs to campuses, manage coordinators, and track area coverage.</p>
        </div>
        <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", alignItems:"center" }}>
          <button className="ghost-button" onClick={onExport}
            style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
            <Download size={14} /> Export CSV
          </button>
          <button className="primary-button" onClick={() => setShowForm(v => !v)}
            style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
            {showForm ? <X size={14} /> : <Plus size={14} />}
            {showForm ? "Cancel" : "New Assignment"}
          </button>
        </div>
      </section>

      {/* ── KPI Strip ── */}
      <div className="metric-grid">
        {[
          { label:"Total Assignments",  val:stats.total,      Icon:CheckCircle, color:"#59623c" },
          { label:"NGOs Assigned",      val:stats.uniqueNgos, Icon:Building2,   color:"#2e7d32" },
          { label:"Areas Covered",      val:stats.uniqueAreas,Icon:MapPin,      color:"#b45309" },
          { label:"Uncovered Areas",    val:stats.uncovered,  Icon:Users,       color:"#ba1a1a" },
        ].map(({ label, val, Icon, color }) => (
          <div key={label} className="metric-card">
            <div className="metric-card__meta">
              <p>{label}</p>
              <h3>{val}</h3>
              <span>{label === "Uncovered Areas" ? "of " + areaOptions.length + " total" : "active"}</span>
            </div>
            <div className="metric-card__icon" style={{ background: color + "18", color }}>
              <Icon size={20} strokeWidth={2} />
            </div>
          </div>
        ))}
      </div>

      {/* ── Create Form ── */}
      {showForm && (
        <section className="tool-surface" style={{ border:"2px solid #ccd6a6" }}>
          <div className="surface-header">
            <div className="section-copy">
              <p className="section-kicker">Create Assignment</p>
              <h3>Assign an approved NGO to a campus area</h3>
            </div>
          </div>

          {approvedNgos.length === 0 ? (
            <div style={{ padding:"1rem", background:"#fffbeb", border:"1px solid #fde68a", borderRadius:8, fontSize:"0.875rem", color:"#b45309" }}>
              ⚠ No approved NGOs available. Go to{" "}
              <a href="/admin/ngo-approvals" style={{ color:"#59623c", fontWeight:700, textDecoration:"underline" }}>
                NGO Approvals
              </a>{" "}
              to approve NGOs first.
            </div>
          ) : (
            <form onSubmit={onSubmit} style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr auto", gap:"0.75rem", alignItems:"end" }}>
              <div>
                <label style={{ fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#6b7466", display:"block", marginBottom:"0.35rem" }}>
                  NGO
                </label>
                <select className="text-input" style={{ margin:0 }} value={ngoName}
                  onChange={e => setNgoName(e.target.value)} required>
                  <option value="" disabled>Select NGO</option>
                  {approvedNgos.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#6b7466", display:"block", marginBottom:"0.35rem" }}>
                  Campus / Area
                </label>
                <select className="text-input" style={{ margin:0 }} value={campus}
                  onChange={e => setCampus(e.target.value)}>
                  {areaOptions.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label style={{ fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#6b7466", display:"block", marginBottom:"0.35rem" }}>
                  Coordinator
                </label>
                <input className="text-input" style={{ margin:0 }} placeholder="Coordinator name"
                  value={coordinator} onChange={e => setCoordinator(e.target.value)} required />
              </div>
              <button type="submit" className="primary-button" disabled={submitting}
                style={{ whiteSpace:"nowrap", height:"2.75rem" }}>
                {submitting ? "Assigning…" : "Assign NGO"}
              </button>
            </form>
          )}
        </section>
      )}

      {/* ── Area Coverage Map ── */}
      <section className="tool-surface">
        <div className="surface-header">
          <div className="section-copy">
            <p className="section-kicker">Coverage Overview</p>
            <h3>NGO presence by area</h3>
          </div>
        </div>
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(180px, 1fr))", gap:"0.75rem" }}>
          {areaCoverage.map(({ area, ngos }) => (
            <div key={area} onClick={() => setCampusF(campusF === area ? "all" : area)}
              style={{
                padding:"0.85rem 1rem",
                borderRadius:12,
                border: `2px solid ${ngos.length > 0 ? "#ccd6a6" : "#fecaca"}`,
                background: ngos.length > 0 ? (campusF === area ? "#dce4b8" : "#f6f9ee") : "#fff8f8",
                cursor:"pointer",
                transition:"all 0.15s",
              }}
            >
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"0.4rem" }}>
                <span style={{ fontSize:"0.7rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#6b7466" }}>
                  {area}
                </span>
                <span style={{
                  fontSize:"0.65rem", fontWeight:700, padding:"0.15rem 0.5rem", borderRadius:999,
                  background: ngos.length > 0 ? "#dce4b8" : "#fecaca",
                  color: ngos.length > 0 ? "#59623c" : "#ba1a1a",
                }}>
                  {ngos.length > 0 ? `${ngos.length} NGO${ngos.length > 1 ? "s" : ""}` : "None"}
                </span>
              </div>
              {ngos.length > 0 ? (
                <p style={{ fontSize:"0.75rem", color:"#46483e", lineHeight:1.4 }}>
                  {ngos.slice(0, 2).join(", ")}{ngos.length > 2 ? ` +${ngos.length - 2}` : ""}
                </p>
              ) : (
                <p style={{ fontSize:"0.75rem", color:"#ba1a1a" }}>Not covered</p>
              )}
            </div>
          ))}
        </div>
        {campusF !== "all" && (
          <button className="ghost-button" onClick={() => setCampusF("all")}
            style={{ marginTop:"0.75rem", display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.8rem" }}>
            <RefreshCw size={13} /> Show all areas
          </button>
        )}
      </section>

      {/* ── Table Section ── */}
      <section className="tool-surface">
        <div className="surface-header">
          <div className="section-copy">
            <p className="section-kicker">Current Assignments</p>
            <h3>Live campus coverage table</h3>
          </div>
          <div style={{ display:"flex", gap:"0.75rem", alignItems:"center", flexWrap:"wrap" }}>
            {/* Search */}
            <div style={{ position:"relative", minWidth:200 }}>
              <Search size={13} style={{ position:"absolute", left:"0.65rem", top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }} />
              <input className="text-input" style={{ paddingLeft:"2rem", margin:0, fontSize:"0.82rem" }}
                placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            {/* Area filter */}
            <select className="text-input" style={{ margin:0, width:"auto", fontSize:"0.82rem" }}
              value={campusF} onChange={e => setCampusF(e.target.value)}>
              <option value="all">All Areas</option>
              {areaOptions.map(o => <option key={o}>{o}</option>)}
            </select>
            {(search || campusF !== "all") && (
              <button className="ghost-button" onClick={() => { setSearch(""); setCampusF("all"); }}
                style={{ display:"flex", alignItems:"center", gap:"0.35rem", fontSize:"0.8rem" }}>
                <X size={12} /> Clear
              </button>
            )}
            <span style={{ fontSize:"0.8rem", color:"#6b7466", fontWeight:600, whiteSpace:"nowrap" }}>
              {filtered.length} of {stats.total}
            </span>
          </div>
        </div>

        {loading ? (
          <div style={{ padding:"2rem", display:"flex", alignItems:"center", gap:"0.75rem", color:"#6b7466" }}>
            <div style={{ width:18, height:18, border:"2px solid #ccd6a6", borderTopColor:"#59623c", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
            Loading assignments…
          </div>
        ) : (
          <AssignmentTable
            assignments={filtered}
            onDelete={onDelete}
            onEdit={onEdit}
          />
        )}
      </section>

    </div>
  );
}
