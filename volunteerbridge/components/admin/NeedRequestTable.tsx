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
};

const URGENCY_COLOR: Record<string, string> = {
  high:   "background:#fef2f2;color:#ba1a1a;border:1px solid #fecaca",
  medium: "background:#fffbeb;color:#b45309;border:1px solid #fde68a",
  low:    "background:#f0fdf4;color:#2e7d32;border:1px solid #bbf7d0",
};

export default function NeedRequestTable({ requests, onStatusChange, onDelete }: Props) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
                        background:"#f6f3ed",
                        borderTop:"1px solid #e8edca",
                        borderBottom:"1px solid #e8edca",
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
                          <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#6b7466", marginBottom:"0.4rem" }}>Beneficiaries</p>
                          <p style={{ fontSize:"1.6rem", fontWeight:900, color:"#1c1c18", lineHeight:1 }}>{req.beneficiaries.toLocaleString()}</p>
                          <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.12em", color:"#6b7466", margin:"0.85rem 0 0.4rem" }}>Urgency Level</p>
                          <p style={{ fontSize:"0.875rem", fontWeight:700, color: req.urgency === "high" ? "#ba1a1a" : req.urgency === "medium" ? "#b45309" : "#2e7d32", textTransform:"capitalize" }}>
                            {req.urgency}
                          </p>
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
