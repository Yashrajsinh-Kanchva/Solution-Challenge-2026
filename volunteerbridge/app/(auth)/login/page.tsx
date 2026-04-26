"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppRole, ROLES } from "@/constants/roles";
import { Loader2, User, ChevronRight, CheckCircle2 } from "lucide-react";

type CitizenSlim = { id: string; name: string; area: string; status: string };

const roleOptions: AppRole[] = [ROLES.ADMIN, ROLES.NGO, ROLES.CITIZEN, ROLES.VOLUNTEER];

const ROLE_LABELS: Record<AppRole, string> = {
  admin:     "👑 Admin",
  ngo:       "🏢 NGO",
  citizen:   "🧑 Citizen",
  volunteer: "🙋 Volunteer",
};

export default function LoginPage() {
  const router = useRouter();

  const [role,          setRole]          = useState<AppRole>(ROLES.ADMIN);
  const [step,          setStep]          = useState<"role" | "citizen">("role");
  const [citizens,      setCitizens]      = useState<CitizenSlim[]>([]);
  const [citizenId,     setCitizenId]     = useState<string>("");
  const [loadingList,   setLoadingList]   = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [error,         setError]         = useState("");

  // When role changes to citizen, fetch list from Firebase API
  useEffect(() => {
    if (role !== ROLES.CITIZEN) { setStep("role"); return; }
    setStep("citizen");
    setLoadingList(true);
    setError("");
    fetch("/api/citizens")
      .then(r => r.json())
      .then(data => {
        setCitizens(data.citizens ?? []);
        setCitizenId(data.citizens?.[0]?.id ?? "");
      })
      .catch(() => setError("Failed to load citizens from database."))
      .finally(() => setLoadingList(false));
  }, [role]);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (role === ROLES.CITIZEN && !citizenId) { setError("Please select a citizen."); return; }

    setLoadingSubmit(true);
    document.cookie = `vb_role=${role}; path=/`;
    if (role === ROLES.CITIZEN) document.cookie = `vb_citizen_id=${citizenId}; path=/`;

    const destinations: Record<AppRole, string> = {
      [ROLES.ADMIN]:     "/admin/dashboard",
      [ROLES.CITIZEN]:   "/citizen/report",
      [ROLES.NGO]:       "/ngo/dashboard",
      [ROLES.VOLUNTEER]: "/volunteer/dashboard",
    };
    router.push(destinations[role] ?? "/");
  };

  return (
    <div style={shell}>
      <div style={card}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={logoBox}>⚡</div>
          <h1 style={heading}>VolunteerBridge</h1>
          <p style={subtext}>Select your role to enter the platform</p>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: "1.25rem" }}>

          {/* Role picker */}
          <div>
            <label style={labelStyle}>Role</label>
            <div style={roleGrid}>
              {roleOptions.map(r => (
                <button
                  key={r} type="button"
                  onClick={() => setRole(r)}
                  style={{
                    ...roleBtn,
                    background:  role === r ? "#dce4b8" : "#fff",
                    borderColor: role === r ? "#59623c" : "#ccd6a6",
                    fontWeight:  role === r ? 700 : 500,
                    boxShadow:   role === r ? "0 0 0 3px rgba(89,98,60,0.15)" : "none",
                  }}
                >
                  {ROLE_LABELS[r]}
                  {role === r && <CheckCircle2 size={14} color="#59623c" style={{ marginLeft: "auto" }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Citizen picker — shown when citizen role selected */}
          {role === ROLES.CITIZEN && (
            <div style={{ animation: "fadeUp 0.25s ease both" }}>
              <label style={labelStyle}>
                Select Citizen
                <span style={{ fontWeight: 400, color: "#6b7466", marginLeft: "0.4rem" }}>
                  (fetched from Firebase)
                </span>
              </label>

              {loadingList ? (
                <div style={loadingBox}>
                  <Loader2 size={18} style={{ animation: "vb-spin 1s linear infinite" }} />
                  Loading citizens from database…
                </div>
              ) : (
                <select
                  id="citizen-select"
                  value={citizenId}
                  onChange={e => setCitizenId(e.target.value)}
                  style={selectStyle}
                >
                  {citizens.map((c, idx) => (
                    <option key={c.id} value={c.id}>
                      {idx + 1}. {c.name} — {c.area} {c.status === "pending" ? "(pending)" : ""}
                    </option>
                  ))}
                </select>
              )}

              {/* Preview chip */}
              {citizenId && !loadingList && (() => {
                const selected = citizens.find(c => c.id === citizenId);
                return selected ? (
                  <div style={previewChip}>
                    <User size={14} />
                    <strong>{selected.name}</strong>
                    <span style={{ color: "#6b7466" }}>·</span>
                    <span>{selected.area}</span>
                    <span style={{
                      marginLeft: "auto", fontSize: "0.7rem", fontWeight: 700,
                      color: selected.status === "active" ? "#2e7d32" : "#b45309",
                    }}>
                      {selected.status.toUpperCase()}
                    </span>
                  </div>
                ) : null;
              })()}
            </div>
          )}

          {error && <p style={{ color: "#ba1a1a", fontSize: "0.8rem", textAlign: "center" }}>{error}</p>}

          <button
            id="login-submit-btn"
            type="submit"
            disabled={loadingSubmit || (role === ROLES.CITIZEN && loadingList)}
            style={submitBtn}
          >
            {loadingSubmit
              ? <><Loader2 size={16} style={{ animation: "vb-spin 1s linear infinite" }} /> Entering…</>
              : <><ChevronRight size={16} /> Continue as {ROLE_LABELS[role].split(" ")[1]}</>
            }
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.75rem", color: "#6b7466" }}>
          This is a simulated login for demo purposes.
        </p>
      </div>

      <style>{`
        @keyframes fadeUp  { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }
        @keyframes vb-spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── Styles ── */
const shell: React.CSSProperties = {
  minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
  background: "#FCF9F3", padding: "1rem",
};

const card: React.CSSProperties = {
  background: "#fff", border: "2px solid #ccd6a6", borderRadius: "20px",
  padding: "2.5rem 2rem", width: "min(480px, 100%)",
  boxShadow: "0 18px 40px -20px rgba(89,98,60,0.2)",
};

const logoBox: React.CSSProperties = {
  width: "52px", height: "52px", borderRadius: "16px",
  background: "#59623c", color: "#fff", fontSize: "1.4rem",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  marginBottom: "0.75rem", boxShadow: "0 12px 24px -16px rgba(89,98,60,0.45)",
};

const heading: React.CSSProperties = {
  fontSize: "1.5rem", fontWeight: 900, color: "#1c1c18",
  letterSpacing: "-0.025em", margin: "0 0 0.35rem",
};

const subtext: React.CSSProperties = {
  color: "#46483e", fontSize: "0.875rem",
};

const labelStyle: React.CSSProperties = {
  display: "block", fontWeight: 700, fontSize: "0.82rem", color: "#1c1c18",
  marginBottom: "0.6rem",
};

const roleGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem",
};

const roleBtn: React.CSSProperties = {
  border: "2px solid", borderRadius: "10px", padding: "0.65rem 0.9rem",
  fontSize: "0.85rem", cursor: "pointer", transition: "all 0.18s",
  display: "flex", alignItems: "center", gap: "0.4rem",
  fontFamily: "'Public Sans', sans-serif",
};

const selectStyle: React.CSSProperties = {
  width: "100%", border: "2px solid #ccd6a6", borderRadius: "10px",
  padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#1c1c18",
  background: "#fff", outline: "none", fontFamily: "'Public Sans', sans-serif",
  cursor: "pointer",
};

const previewChip: React.CSSProperties = {
  marginTop: "0.6rem", display: "flex", alignItems: "center", gap: "0.5rem",
  background: "#f6f3ed", border: "1px solid #ccd6a6", borderRadius: "10px",
  padding: "0.6rem 0.9rem", fontSize: "0.82rem", color: "#1c1c18",
};

const loadingBox: React.CSSProperties = {
  display: "flex", alignItems: "center", gap: "0.5rem",
  color: "#6b7466", fontSize: "0.85rem", padding: "0.75rem",
  background: "#f6f3ed", borderRadius: "10px", border: "1px solid #ccd6a6",
};

const submitBtn: React.CSSProperties = {
  width: "100%", padding: "0.9rem", background: "#59623c", color: "#fff",
  border: "none", borderRadius: "12px", fontWeight: 800, fontSize: "0.95rem",
  display: "flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
  cursor: "pointer", fontFamily: "'Public Sans', sans-serif",
  boxShadow: "0 16px 32px -18px rgba(89,98,60,0.5)", transition: "all 0.2s",
};
