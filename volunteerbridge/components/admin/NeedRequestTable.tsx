"use client";

import { useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import type { ManagedNeedRequest } from "@/lib/types/admin";
import { formatDateLabel } from "@/lib/utils/formatters";
import { Check, X, Eye, ChevronDown, ChevronUp } from "lucide-react";

type Props = {
  requests: ManagedNeedRequest[];
  onStatusChange: (id: string, status: "approved" | "rejected") => void;
  onDelete?: (id: string) => void;
  ngos?: any[];
  onAssignNgo?: (requestId: string, ngoId: string) => void;
};

const URGENCY_COLOR: Record<string, string> = {
  critical: "background:#FDECEA;color:#A81919;border:1.5px solid #F1A8A8",
  high:     "background:#FDECEA;color:#A81919;border:1.5px solid #F1A8A8",
  medium:   "background:#FEF6E7;color:#92540A;border:1.5px solid #F5C87A",
  low:      "background:#EAF5EB;color:#2E6B32;border:1.5px solid #A8D5AB",
};

export default function NeedRequestTable({ requests, onStatusChange, onDelete, ngos = [], onAssignNgo }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [selectedNgo, setSelectedNgo] = useState<Record<string, string>>({});

  if (requests.length === 0) {
    return (
      <div style={{ padding:"2rem", textAlign:"center", color:"#6b7466" }}>
        No requests found matching the current filters.
      </div>
    );
  }

  return (
    <div className="table-scroll">
      <table className="admin-table">
        <thead>
          <tr>
            <th>Title &amp; Summary</th>
            <th>Type</th>
            <th>Category</th>
            <th>Location</th>
            <th>Urgency</th>
            <th>Beneficiaries</th>
            <th>Status</th>
            <th>Requested By</th>
            <th>Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((req) => {
            const isExpanded = expandedId === req.id;
            const isPending  = req.status === "pending";

            return (
              <>
                <tr key={req.id} style={{ background: isExpanded ? "#f6f3ed" : undefined }}>
                  {/* Title */}
                  <td>
                    <div className="table-primary">
                      <strong>{req.title}</strong>
                      <span style={{ fontSize:"0.75rem", color:"#6b7466", marginTop:"2px" }}>
                        {req.summary.slice(0, 60)}{req.summary.length > 60 ? "…" : ""}
                      </span>
                    </div>
                  </td>

                  {/* Type */}
                  <td>
                    <span style={{ 
                      fontSize:"0.65rem", fontWeight:800, padding:"0.2rem 0.5rem", borderRadius:"6px", textTransform:"uppercase",
                      background: req.requestType === "HELP" ? "#ede9fe" : "#e0f2fe",
                      color: req.requestType === "HELP" ? "#5b21b6" : "#0369a1",
                      border: `1px solid ${req.requestType === "HELP" ? "#ddd6fe" : "#bae6fd"}`
                    }}>
                      {req.requestType === "HELP" ? "Help" : "Issue"}
                    </span>
                  </td>

                  {/* Category */}
                  <td>
                    <span style={{ fontSize:"0.8rem", fontWeight:600 }}>{req.category}</span>
                  </td>

                  {/* Location */}
                  <td style={{ fontSize:"0.875rem" }}>{req.location}</td>

                  {/* Urgency */}
                  <td>
                    <span
                      style={{
                        ...Object.fromEntries(
                          URGENCY_COLOR[req.urgency]?.split(";").map(s => {
                            const [k, v] = s.split(":");
                            return [k.trim().replace(/-([a-z])/g, (_,c) => c.toUpperCase()), v?.trim()];
                          }) ?? []
                        ),
                        borderRadius:"999px",
                        padding:"0.2rem 0.65rem",
                        fontSize:"0.7rem",
                        fontWeight:700,
                        textTransform:"uppercase",
                        letterSpacing:"0.06em",
                        display:"inline-block",
                      }}
                    >
                      {req.urgency}
                    </span>
                  </td>

                  {/* Beneficiaries */}
                  <td style={{ fontWeight:700, fontSize:"0.9rem" }}>
                    {req.beneficiaries.toLocaleString()}
                  </td>

                  {/* Status */}
                  <td><StatusBadge status={req.status} /></td>

                  {/* Requested By */}
                  <td style={{ fontSize:"0.875rem" }}>{req.requestedBy}</td>

                  {/* Created */}
                  <td style={{ fontSize:"0.8rem", color:"#6b7466" }}>
                    {formatDateLabel(req.createdAt)}
                  </td>

                  {/* Actions */}
                  <td>
                    <div className="inline-actions" style={{ flexWrap:"nowrap" }}>
                      {/* Expand detail */}
                      <button
                        type="button"
                        className="action-button"
                        style={{ background:"#f6f3ed", border:"1px solid #ccd6a6", color:"#59623c" }}
                        onClick={() => setExpandedId(isExpanded ? null : req.id)}
                        title="View details"
                      >
                        <Eye size={13} />
                        {isExpanded ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
                      </button>

                      {isPending && (
                        <>
                          <button
                            type="button"
                            className="action-button"
                            onClick={() => onStatusChange(req.id, "approved")}
                            title="Approve"
                          >
                            <Check size={13} />
                            Approve
                          </button>
                          <button
                            type="button"
                            className="action-button action-button--danger"
                            onClick={() => onStatusChange(req.id, "rejected")}
                            title="Reject"
                          >
                            <X size={13} />
                            Reject
                          </button>
                        </>
                      )}

                      {!isPending && onDelete && (
                        <button
                          type="button"
                          className="action-button action-button--danger"
                          onClick={() => onDelete(req.id)}
                          title="Delete"
                          style={{ padding:"0.4rem 0.6rem" }}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>

                {/* Expanded detail row */}
                {isExpanded && (
                  <tr key={`${req.id}-detail`}>
                    <td colSpan={9} style={{ padding:0 }}>
                      <div style={{
                        background:"#F7F5EE",
                        borderTop:"1.5px solid #E8EDD0",
                        borderBottom:"1.5px solid #E8EDD0",
                        padding:"1.25rem 1.5rem",
                        display:"grid",
                        gridTemplateColumns:"1fr 1fr 1fr",
                        gap:"1.5rem",
                      }}>
                        <div>
                          <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#6b7466", marginBottom:"0.4rem" }}>Full Summary</p>
                          <p style={{ fontSize:"0.875rem", color:"#1c1c18", lineHeight:1.65 }}>{req.summary}</p>
                        </div>
                        <div>
                          <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#6b7466", marginBottom:"0.4rem" }}>Request ID</p>
                          <p style={{ fontSize:"0.875rem", fontFamily:"monospace", color:"#59623c", fontWeight:700 }}>{req.id}</p>
                          <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#6b7466", margin:"0.85rem 0 0.4rem" }}>Category</p>
                          <p style={{ fontSize:"0.875rem", color:"#1c1c18", fontWeight:600 }}>{req.category}</p>
                        </div>
                        <div>
                          <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#6b7466", marginBottom:"0.4rem" }}>Assign NGO</p>
                          {(req.status as string) === "approved" || (req.status as string) === "assigned_to_ngo" ? (
                            <div style={{ display:"flex", gap:"0.5rem", alignItems:"center" }}>
                              <select 
                                className="text-input" 
                                style={{ margin:0, padding:"0.4rem", fontSize:"0.8rem", flex:1 }}
                                value={selectedNgo[req.id] || (req as any).assignedNgoId || ""}
                                onChange={(e) => setSelectedNgo(prev => ({ ...prev, [req.id]: e.target.value }))}
                              >
                                <option value="" disabled>Select NGO</option>
                                {ngos.map(n => (
                                  <option key={n.ngoId} value={n.ngoId}>{n.ngoName || n.name}</option>
                                ))}
                              </select>
                              <button 
                                onClick={() => onAssignNgo?.(req.id, selectedNgo[req.id] || (req as any).assignedNgoId || "")}
                                className="primary-button"
                                style={{ padding:"0.4rem 0.8rem", fontSize:"0.75rem", whiteSpace:"nowrap" }}
                                disabled={!(selectedNgo[req.id] || (req as any).assignedNgoId)}
                              >
                                {(req as any).assignedNgoId ? "Reassign" : "Assign"}
                              </button>
                            </div>
                          ) : (
                            <p style={{ fontSize:"0.75rem", color:"#6b7466", fontStyle:"italic" }}>
                              Approve request first to assign an NGO.
                            </p>
                          )}
                          {(req as any).assignedNgoId && (
                             <p style={{ fontSize:"0.7rem", color:"#2e7d32", fontWeight:700, marginTop:"0.5rem" }}>
                               Current: {ngos.find(n => n.ngoId === (req as any).assignedNgoId)?.ngoName || (req as any).assignedNgoId}
                             </p>
                          )}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
