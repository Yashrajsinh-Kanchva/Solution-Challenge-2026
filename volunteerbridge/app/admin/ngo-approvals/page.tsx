"use client";

import { useMemo, useState, useEffect } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatDateLabel } from "@/lib/utils/formatters";
import { apiClient } from "@/lib/api/client";
import {
  Search, RefreshCw, Download, ChevronDown, ChevronUp,
  Check, X, Mail, Phone, MapPin, FileText, Building2,
  Clock, CheckCircle, XCircle, Users,
} from "lucide-react";

type StatusFilter = "all" | "pending" | "approved" | "rejected";

export default function NgoApprovalsPage() {
  const [registrations, setRegistrations] = useState<any[]>([]);
  const [reasons,       setReasons]       = useState<Record<string, string>>({});
  const [loading,       setLoading]       = useState(true);
  const [expandedId,    setExpandedId]    = useState<string | null>(null);
  const [search,        setSearch]        = useState("");
  const [statusF,       setStatusF]       = useState<StatusFilter>("all");
  const [processing,    setProcessing]    = useState<string | null>(null);

  useEffect(() => {
    apiClient.getNgos()
      .then(data => setRegistrations(Array.isArray(data) ? data : []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const stats = useMemo(() => ({
    total:    registrations.length,
    pending:  registrations.filter(r => r.status === "pending").length,
    approved: registrations.filter(r => r.status === "approved").length,
    rejected: registrations.filter(r => r.status === "rejected").length,
  }), [registrations]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return registrations.filter(r => {
      if (statusF !== "all" && r.status !== statusF) return false;
      if (q && !r.ngoName?.toLowerCase().includes(q) &&
               !r.contactName?.toLowerCase().includes(q) &&
               !r.area?.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [registrations, search, statusF]);

  const onApprove = async (id: string) => {
    setProcessing(id);
    try {
      await apiClient.approveNgo(id, "approved");
      setRegistrations(cur => cur.map(r => r.id === id ? { ...r, status: "approved" } : r));
      setExpandedId(null);
    } catch { alert("Failed to approve NGO."); }
    finally { setProcessing(null); }
  };

  const onReject = async (id: string) => {
    const reason = reasons[id]?.trim();
    if (!reason) { alert("Please enter a rejection reason before rejecting."); return; }
    setProcessing(id);
    try {
      await apiClient.approveNgo(id, "rejected", reason);
      setRegistrations(cur => cur.map(r => r.id === id ? { ...r, status: "rejected", reviewReason: reason } : r));
      setExpandedId(null);
    } catch { alert("Failed to reject NGO."); }
    finally { setProcessing(null); }
  };

  const onRevoke = async (id: string) => {
    if (!confirm("Revoke approval and move back to pending?")) return;
    setProcessing(id);
    try {
      await apiClient.approveNgo(id, "pending" as any);
      setRegistrations(cur => cur.map(r => r.id === id ? { ...r, status: "pending", reviewReason: undefined } : r));
    } catch { alert("Failed to revoke."); }
    finally { setProcessing(null); }
  };

  const onExport = () => {
    const rows = [
      ["ID","Name","Contact","Email","Phone","Area","Status","Submitted"],
      ...filtered.map(r => [r.id, r.ngoName, r.contactName, r.email, r.phone, r.area, r.status, r.submittedAt]),
    ];
    const blob = new Blob([rows.map(r => r.join(",")).join("\n")], { type: "text/csv" });
    const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: "ngo-approvals.csv" });
    a.click(); URL.revokeObjectURL(a.href);
  };

  return (
    <div className="page-stack">

      {/* Header */}
      <section className="page-header">
        <div>
          <p className="page-header__eyebrow">Feature 6</p>
          <h2>NGO Registration Approvals</h2>
          <p>Validate submitted organizations, review documents, and approve or reject with recorded reasons.</p>
        </div>
        <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", alignItems:"center" }}>
          {stats.pending > 0 && (
            <span className="highlight-chip">{stats.pending} awaiting review</span>
          )}
          <button className="ghost-button" onClick={onExport}
            style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
            <Download size={14} /> Export CSV
          </button>
        </div>
      </section>

      {/* KPI cards */}
      <div className="metric-grid">
        {[
          { label:"Total NGOs",   val:stats.total,    Icon:Building2,   color:"#59623c", filter:"all"      },
          { label:"Pending",      val:stats.pending,  Icon:Clock,       color:"#b45309", filter:"pending"  },
          { label:"Approved",     val:stats.approved, Icon:CheckCircle, color:"#2e7d32", filter:"approved" },
          { label:"Rejected",     val:stats.rejected, Icon:XCircle,     color:"#ba1a1a", filter:"rejected" },
        ].map(({ label, val, Icon, color, filter }) => (
          <div key={label} className="metric-card" style={{ cursor:"pointer" }}
            onClick={() => setStatusF(filter as StatusFilter)}>
            <div className="metric-card__meta">
              <p>{label}</p>
              <h3>{val}</h3>
              <span>Click to filter</span>
            </div>
            <div className="metric-card__icon" style={{ background: color + "18", color }}>
              <Icon size={20} strokeWidth={2} />
            </div>
          </div>
        ))}
      </div>

      {/* Search + filter bar */}
      <div className="tool-surface" style={{ padding:"0.85rem 1.25rem" }}>
        <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", alignItems:"center" }}>
          <div style={{ position:"relative", flex:1, minWidth:"200px" }}>
            <Search size={14} style={{ position:"absolute", left:"0.75rem", top:"50%", transform:"translateY(-50%)", color:"#9ca3af" }} />
            <input
              className="text-input"
              style={{ paddingLeft:"2.25rem", margin:0 }}
              placeholder="Search by NGO name, contact, or area…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <div className="tab-row" style={{ marginBottom:0, padding:"0.2rem" }}>
            {(["all","pending","approved","rejected"] as StatusFilter[]).map(s => (
              <button key={s} onClick={() => setStatusF(s)}
                className={`tab-button ${statusF === s ? "active" : ""}`}
                style={{ padding:"0.3rem 0.75rem", fontSize:"0.78rem" }}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
                {s !== "all" && <strong>{stats[s as keyof typeof stats]}</strong>}
              </button>
            ))}
          </div>
          {(search || statusF !== "all") && (
            <button className="ghost-button" onClick={() => { setSearch(""); setStatusF("all"); }}
              style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
              <RefreshCw size={13} /> Clear
            </button>
          )}
          <span style={{ fontSize:"0.8rem", color:"#6b7466", fontWeight:600, marginLeft:"auto", whiteSpace:"nowrap" }}>
            {filtered.length} of {stats.total}
          </span>
        </div>
      </div>

      {/* Cards grid */}
      {loading ? (
        <div style={{ padding:"3rem", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.75rem", color:"#6b7466" }}>
          <div style={{ width:20, height:20, border:"2px solid #ccd6a6", borderTopColor:"#59623c", borderRadius:"50%", animation:"spin 0.8s linear infinite" }} />
          Loading NGO registrations…
        </div>
      ) : filtered.length === 0 ? (
        <div className="tool-surface" style={{ textAlign:"center", padding:"3rem", color:"#6b7466" }}>
          No NGOs match your filters.
        </div>
      ) : (
        <section style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(340px, 1fr))", gap:"1.25rem" }}>
          {filtered.map((reg) => {
            const isPending  = reg.status === "pending";
            const isApproved = reg.status === "approved";
            const isExpanded = expandedId === reg.id;
            const isBusy     = processing === reg.id;

            return (
              <article key={reg.id} className="approval-card" style={{
                borderColor: isPending ? "#fde68a" : isApproved ? "#bbf7d0" : "#fecaca",
                borderWidth: 2,
              }}>
                {/* Card top */}
                <div className="approval-card__top">
                  <div style={{ flex:1, minWidth:0 }}>
                    <p className="section-kicker">Submitted {formatDateLabel(reg.submittedAt)}</p>
                    <h3 style={{ fontSize:"1rem", fontWeight:800, marginBottom:"0.3rem", wordBreak:"break-word" }}>
                      {reg.ngoName}
                    </h3>
                    <p style={{ fontSize:"0.82rem", color:"#46483e", lineHeight:1.55 }}>{reg.mission}</p>
                  </div>
                  <StatusBadge status={reg.status} />
                </div>

                {/* Core details */}
                <div className="detail-list">
                  <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                    <Users size={13} style={{ color:"#6b7466", flexShrink:0 }} />
                    <div>
                      <span>Contact</span>
                      <strong>{reg.contactName}</strong>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                    <MapPin size={13} style={{ color:"#6b7466", flexShrink:0 }} />
                    <div>
                      <span>Area</span>
                      <strong>{reg.area}</strong>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                    <FileText size={13} style={{ color:"#6b7466", flexShrink:0 }} />
                    <div>
                      <span>Documents ({reg.documents?.length ?? 0})</span>
                      <strong>{reg.documents?.join(", ") || "None"}</strong>
                    </div>
                  </div>
                </div>

                {/* Expand toggle */}
                <button
                  onClick={() => setExpandedId(isExpanded ? null : reg.id)}
                  style={{
                    display:"flex", alignItems:"center", gap:"0.4rem",
                    background:"#f6f3ed", border:"1px solid #ccd6a6", borderRadius:8,
                    padding:"0.4rem 0.75rem", fontSize:"0.75rem", fontWeight:700,
                    color:"#59623c", cursor:"pointer", width:"fit-content",
                  }}
                >
                  {isExpanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  {isExpanded ? "Less details" : "Full details"}
                </button>

                {/* Expanded detail section */}
                {isExpanded && (
                  <div style={{
                    background:"#f6f3ed", borderRadius:10, padding:"1rem",
                    border:"1px solid #e8edca", display:"grid", gap:"0.75rem",
                  }}>
                    <div style={{ display:"flex", gap:"1.5rem", flexWrap:"wrap" }}>
                      <div>
                        <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#6b7466", marginBottom:2 }}>Email</p>
                        <a href={`mailto:${reg.email}`} style={{ fontSize:"0.85rem", color:"#59623c", fontWeight:600, display:"flex", alignItems:"center", gap:"0.3rem" }}>
                          <Mail size={12} /> {reg.email}
                        </a>
                      </div>
                      <div>
                        <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#6b7466", marginBottom:2 }}>Phone</p>
                        <a href={`tel:${reg.phone}`} style={{ fontSize:"0.85rem", color:"#59623c", fontWeight:600, display:"flex", alignItems:"center", gap:"0.3rem" }}>
                          <Phone size={12} /> {reg.phone}
                        </a>
                      </div>
                    </div>
                    <div>
                      <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#6b7466", marginBottom:2 }}>Coverage</p>
                      <p style={{ fontSize:"0.875rem", color:"#1c1c18" }}>{reg.coverage}</p>
                    </div>
                    {/* Document checklist */}
                    <div>
                      <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#6b7466", marginBottom:"0.5rem" }}>Document checklist</p>
                      <div style={{ display:"flex", flexDirection:"column", gap:"0.35rem" }}>
                        {(reg.documents || []).map((doc: string) => (
                          <div key={doc} style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.82rem", color:"#2e7d32", fontWeight:600 }}>
                            <Check size={13} color="#2e7d32" /> {doc}
                          </div>
                        ))}
                        {["Registration Certificate", "Tax Exemption", "Field Photos", "Audit Report", "Volunteer Roster"]
                          .filter(d => !(reg.documents || []).includes(d))
                          .map(missing => (
                            <div key={missing} style={{ display:"flex", alignItems:"center", gap:"0.5rem", fontSize:"0.82rem", color:"#9ca3af", fontWeight:500 }}>
                              <X size={13} color="#9ca3af" /> {missing} <span style={{ fontSize:"0.7rem" }}>(missing)</span>
                            </div>
                          ))}
                      </div>
                    </div>
                    {reg.reviewReason && (
                      <div style={{ background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"0.75rem" }}>
                        <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#ba1a1a", marginBottom:4 }}>Rejection reason</p>
                        <p style={{ fontSize:"0.82rem", color:"#1c1c18" }}>{reg.reviewReason}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Rejection reason input — only for pending */}
                {isPending && (
                  <textarea
                    className="text-area"
                    style={{ minHeight:70, fontSize:"0.82rem" }}
                    placeholder="Enter rejection reason (required to reject)…"
                    value={reasons[reg.id] ?? ""}
                    onChange={e => setReasons(cur => ({ ...cur, [reg.id]: e.target.value }))}
                  />
                )}

                {/* Action buttons */}
                <div className="inline-actions">
                  {isPending && (
                    <>
                      <button
                        type="button"
                        className="action-button"
                        disabled={isBusy}
                        onClick={() => onApprove(reg.id)}
                        style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}
                      >
                        <Check size={13} />
                        {isBusy ? "Processing…" : "Approve"}
                      </button>
                      <button
                        type="button"
                        className="action-button action-button--danger"
                        disabled={isBusy || !reasons[reg.id]?.trim()}
                        onClick={() => onReject(reg.id)}
                        style={{ display:"flex", alignItems:"center", gap:"0.4rem", opacity: !reasons[reg.id]?.trim() ? 0.45 : 1 }}
                        title={!reasons[reg.id]?.trim() ? "Enter a rejection reason first" : "Reject this NGO"}
                      >
                        <X size={13} />
                        {isBusy ? "Processing…" : "Reject"}
                      </button>
                    </>
                  )}
                  {isApproved && (
                    <button
                      type="button"
                      className="action-button action-button--danger"
                      disabled={isBusy}
                      onClick={() => onRevoke(reg.id)}
                      style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}
                    >
                      <XCircle size={13} />
                      {isBusy ? "Processing…" : "Revoke Approval"}
                    </button>
                  )}
                  {reg.status === "rejected" && (
                    <button
                      type="button"
                      className="action-button"
                      disabled={isBusy}
                      onClick={() => onRevoke(reg.id)}
                      style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}
                    >
                      <RefreshCw size={13} />
                      {isBusy ? "Processing…" : "Reopen for Review"}
                    </button>
                  )}
                  {/* Email contact button */}
                  <a
                    href={`mailto:${reg.email}`}
                    className="action-button"
                    style={{ display:"flex", alignItems:"center", gap:"0.4rem", background:"#f6f3ed", border:"1px solid #ccd6a6", color:"#59623c" }}
                  >
                    <Mail size={13} /> Email
                  </a>
                </div>
              </article>
            );
          })}
        </section>
      )}

    </div>
  );
}
