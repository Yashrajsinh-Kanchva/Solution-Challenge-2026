"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AppRole, ROLES } from "@/constants/roles";
import { Loader2, User, ChevronRight, CheckCircle2, ShieldCheck, Plus, Zap } from "lucide-react";
import { apiClient } from "@/lib/api/client";

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

  // Shared
  const [role, setRole] = useState<AppRole>(ROLES.ADMIN);

  // Citizen
  const [citizens,      setCitizens]      = useState<CitizenSlim[]>([]);
  const [citizenId,     setCitizenId]     = useState<string>("");
  const [loadingList,   setLoadingList]   = useState(false);
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [citizenError,  setCitizenError]  = useState("");

  // NGO / Volunteer (from mihir/ngo branch)
  const [selectedNgoId,     setSelectedNgoId]     = useState<string>("");
  const [ngos,              setNgos]              = useState<any[]>([]);
  const [showRegistration,  setShowRegistration]  = useState(false);
  const [showVolunteerJoin, setShowVolunteerJoin] = useState(false);
  const [submitting,        setSubmitting]        = useState(false);

  const [ngoForm, setNgoForm] = useState({
    ngoName: "", contactName: "", email: "", phone: "", mission: "", area: "",
  });
  const [volunteerForm, setVolunteerForm] = useState({
    name: "", skills: "", location: "", phone: "", email: "", ngoId: "", volunteerId: "",
  });

  /* ── Fetch citizens when Citizen role selected ── */
  useEffect(() => {
    if (role !== ROLES.CITIZEN) return;
    setLoadingList(true);
    setCitizenError("");
    fetch("/api/citizens")
      .then(r => r.json())
      .then(data => {
        setCitizens(data.citizens ?? []);
        setCitizenId(data.citizens?.[0]?.id ?? "");
      })
      .catch(() => setCitizenError("Failed to load citizens from database."))
      .finally(() => setLoadingList(false));
  }, [role]);

  /* ── Fetch NGOs when NGO/Volunteer role selected ── */
  const fetchNgos = () => {
    apiClient.getNgos().then((data: any[]) => {
      if (data && data.length > 0) {
        const filtered = data.filter((n: any) => n.status !== "rejected");
        setNgos(filtered);
        const first = filtered.find((n: any) => n.status === "approved");
        if (first) {
          setSelectedNgoId(first.ngoId || first.id);
          setVolunteerForm(prev => ({ ...prev, ngoId: first.ngoId || first.id }));
        }
      }
    });
  };

  useEffect(() => {
    if (role === ROLES.NGO || role === ROLES.VOLUNTEER) fetchNgos();
  }, [role]);

  /* ── Submit ── */
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (role === ROLES.CITIZEN && !citizenId) {
      setCitizenError("Please select a citizen."); return;
    }
    const selected = ngos.find(n => (n.ngoId || n.id) === selectedNgoId);
    if (role === ROLES.NGO && selected?.status === "pending") {
      alert("This NGO registration is still pending approval."); return;
    }

    setLoadingSubmit(true);
    document.cookie = `vb_role=${role}; path=/`;
    if (role === ROLES.CITIZEN)   document.cookie = `vb_citizen_id=${citizenId}; path=/`;
    if (role === ROLES.NGO)       document.cookie = `vb_ngo_id=${selectedNgoId}; path=/`;
    if (role === ROLES.VOLUNTEER) {
      document.cookie = `vb_volunteer_id=${volunteerForm.volunteerId || "vol-101"}; path=/`;
    }

    const destinations: Record<AppRole, string> = {
      [ROLES.ADMIN]:     "/admin/dashboard",
      [ROLES.CITIZEN]:   "/citizen/report",
      [ROLES.NGO]:       "/ngo/dashboard",
      [ROLES.VOLUNTEER]: "/volunteer/dashboard",
    };
    router.push(destinations[role] ?? "/");
  };

  /* ── NGO Registration ── */
  const handleRegisterNgo = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await apiClient.registerNgo(ngoForm);
      alert("NGO registration submitted! It will appear as (Under Review) until approved.");
      setShowRegistration(false);
      fetchNgos();
    } catch { alert("Failed to submit registration."); }
    finally { setSubmitting(false); }
  };

  /* ── Volunteer Join ── */
  const handleVolunteerJoin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const payload = {
        ...volunteerForm,
        volunteerId: `vol-${Date.now()}`,
        skills: volunteerForm.skills.split(",").map(s => s.trim()),
      };
      await apiClient.submitVolunteerJoinRequest(volunteerForm.ngoId, payload);
      alert("Join request sent! The NGO will review your application.");
      setShowVolunteerJoin(false);
    } catch { alert("Failed to send request."); }
    finally { setSubmitting(false); }
  };

  /* ── NGO Registration Screen ── */
  if (showRegistration) {
    return (
      <section className="bg-white rounded-modern border-2 border-outline/60 p-12 custom-shadow w-full max-w-xl animate-in zoom-in duration-500">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <ShieldCheck size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tight leading-none">Organization Onboarding</h1>
            <p className="text-xs font-bold text-secondary/40 mt-1 uppercase tracking-widest">Apply to join the VolunteerBridge network</p>
          </div>
        </div>
        <form onSubmit={handleRegisterNgo} className="space-y-5">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">NGO Name</label>
              <input required value={ngoForm.ngoName} onChange={e => setNgoForm({...ngoForm, ngoName: e.target.value})} placeholder="e.g. Hope Foundation" className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Area of Operations</label>
              <input required value={ngoForm.area} onChange={e => setNgoForm({...ngoForm, area: e.target.value})} placeholder="e.g. Gujarat Region" className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Email Domain</label>
              <input type="email" required value={ngoForm.email} onChange={e => setNgoForm({...ngoForm, email: e.target.value})} placeholder="official@ngo.org" className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Main Coordinator</label>
              <input required value={ngoForm.contactName} onChange={e => setNgoForm({...ngoForm, contactName: e.target.value})} placeholder="Contact name" className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Strategic Mission</label>
            <textarea required value={ngoForm.mission} onChange={e => setNgoForm({...ngoForm, mission: e.target.value})} placeholder="Describe your organization's core objectives..." rows={4} className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner resize-none" />
          </div>
          <div className="flex gap-4 pt-6 border-t border-outline/30 mt-8">
            <button type="submit" disabled={submitting} className="flex-1 py-4 bg-primary text-white rounded-button font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50">
              {submitting ? "Processing..." : "Submit Application"}
            </button>
            <button type="button" onClick={() => setShowRegistration(false)} className="flex-1 py-4 border-2 border-outline/60 text-secondary font-black text-xs uppercase tracking-widest rounded-button hover:bg-surface-variant/20 transition-all active:scale-95">
              Return to Login
            </button>
          </div>
        </form>
      </section>
    );
  }

  /* ── Volunteer Join Screen ── */
  if (showVolunteerJoin) {
    return (
      <section className="bg-white rounded-modern border-2 border-outline/60 p-12 custom-shadow w-full max-w-xl animate-in zoom-in duration-500">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Plus size={28} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-on-surface tracking-tight leading-none">Join Organization</h1>
            <p className="text-xs font-bold text-secondary/40 mt-1 uppercase tracking-widest">Send a request to join an NGO</p>
          </div>
        </div>
        <form onSubmit={handleVolunteerJoin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Your Full Name</label>
            <input required value={volunteerForm.name} onChange={e => setVolunteerForm({...volunteerForm, name: e.target.value})} placeholder="e.g. Rahul Sharma" className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner" />
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Email Address</label>
              <input type="email" required value={volunteerForm.email} onChange={e => setVolunteerForm({...volunteerForm, email: e.target.value})} placeholder="rahul@example.com" className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Phone Number</label>
              <input required value={volunteerForm.phone} onChange={e => setVolunteerForm({...volunteerForm, phone: e.target.value})} placeholder="+91 XXXXX XXXXX" className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Skills (comma separated)</label>
            <input required value={volunteerForm.skills} onChange={e => setVolunteerForm({...volunteerForm, skills: e.target.value})} placeholder="e.g. First Aid, Driving, Logistics" className="w-full px-5 py-3.5 bg-surface-variant/20 border-2 border-outline/60 rounded-xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner" />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Select Organization</label>
            <select required value={volunteerForm.ngoId} onChange={e => setVolunteerForm({...volunteerForm, ngoId: e.target.value})} className="w-full px-5 py-4 bg-surface-variant/20 border-2 border-outline/60 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner appearance-none cursor-pointer">
              {ngos.map(ngo => <option key={ngo.ngoId || ngo.id} value={ngo.ngoId || ngo.id}>{ngo.ngoName || ngo.name}</option>)}
            </select>
          </div>
          <div className="flex gap-4 pt-6 border-t border-outline/30 mt-8">
            <button type="submit" disabled={submitting} className="flex-1 py-4 bg-primary text-white rounded-button font-black text-xs uppercase tracking-widest hover:bg-primary/90 transition-all shadow-lg shadow-primary/20 active:scale-95 disabled:opacity-50">
              {submitting ? "Sending..." : "Send Join Request"}
            </button>
            <button type="button" onClick={() => setShowVolunteerJoin(false)} className="flex-1 py-4 border-2 border-outline/60 text-secondary font-black text-xs uppercase tracking-widest rounded-button hover:bg-surface-variant/20 transition-all active:scale-95">
              Cancel
            </button>
          </div>
        </form>
      </section>
    );
  }

  /* ── Main Login Screen ── */
  return (
    <div style={shell}>
      <div style={card}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <div style={logoBox}><Zap size={22} color="#fff" strokeWidth={2.5} /></div>
          <h1 style={heading}>VolunteerBridge</h1>
          <p style={subtext}>Select your role to enter the platform</p>
        </div>

        <form onSubmit={onSubmit} style={{ display: "grid", gap: "1.25rem" }}>

          {/* Role picker grid */}
          <div>
            <label style={labelStyle}>Role</label>
            <div style={roleGrid}>
              {roleOptions.map(r => (
                <button key={r} type="button" onClick={() => setRole(r)} style={{
                  ...roleBtn,
                  background:  role === r ? "#dce4b8" : "#fff",
                  borderColor: role === r ? "#59623c" : "#ccd6a6",
                  fontWeight:  role === r ? 700 : 500,
                  boxShadow:   role === r ? "0 0 0 3px rgba(89,98,60,0.15)" : "none",
                }}>
                  {ROLE_LABELS[r]}
                  {role === r && <CheckCircle2 size={14} color="#59623c" style={{ marginLeft: "auto" }} />}
                </button>
              ))}
            </div>
          </div>

          {/* Citizen — Firebase picker */}
          {role === ROLES.CITIZEN && (
            <div style={{ animation: "fadeUp 0.25s ease both" }}>
              <label style={labelStyle}>
                Select Citizen
                <span style={{ fontWeight: 400, color: "#6b7466", marginLeft: "0.4rem" }}>(fetched from Firebase)</span>
              </label>
              {loadingList ? (
                <div style={loadingBox}>
                  <Loader2 size={18} style={{ animation: "vb-spin 1s linear infinite" }} />
                  Loading citizens from database…
                </div>
              ) : (
                <select id="citizen-select" value={citizenId} onChange={e => setCitizenId(e.target.value)} style={selectStyle}>
                  {citizens.map((c, idx) => (
                    <option key={c.id} value={c.id}>
                      {idx + 1}. {c.name} — {c.area} {c.status === "pending" ? "(pending)" : ""}
                    </option>
                  ))}
                </select>
              )}
              {citizenId && !loadingList && (() => {
                const sel = citizens.find(c => c.id === citizenId);
                return sel ? (
                  <div style={previewChip}>
                    <User size={14} />
                    <strong>{sel.name}</strong>
                    <span style={{ color: "#6b7466" }}>·</span>
                    <span>{sel.area}</span>
                    <span style={{ marginLeft: "auto", fontSize: "0.7rem", fontWeight: 700, color: sel.status === "active" ? "#2e7d32" : "#b45309" }}>
                      {sel.status.toUpperCase()}
                    </span>
                  </div>
                ) : null;
              })()}
              {citizenError && <p style={{ color: "#ba1a1a", fontSize: "0.8rem", marginTop: "0.4rem" }}>{citizenError}</p>}
            </div>
          )}

          {/* NGO — select existing or register new */}
          {role === ROLES.NGO && (
            <div className="space-y-3 animate-in slide-in-from-top duration-500">
              <div className="flex justify-between items-center px-1">
                <label htmlFor="ngoId" className="text-[10px] font-black text-on-surface uppercase tracking-widest">Select NGO Entity</label>
                <button type="button" onClick={() => setShowRegistration(true)} className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline flex items-center gap-1">
                  <Plus size={12} strokeWidth={3} /> Request New
                </button>
              </div>
              <select id="ngoId" value={selectedNgoId} onChange={e => setSelectedNgoId(e.target.value)} className="w-full px-5 py-4 bg-surface-variant/20 border-2 border-outline/60 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner appearance-none cursor-pointer">
                {ngos.map(ngo => {
                  const isPending = ngo.status === "pending";
                  return (
                    <option key={ngo.ngoId || ngo.id} value={ngo.ngoId || ngo.id} disabled={isPending}>
                      {ngo.ngoName || ngo.name}{isPending ? " (Under Review)" : ""}
                    </option>
                  );
                })}
              </select>
            </div>
          )}

          {/* Volunteer — enter ID or request to join */}
          {role === ROLES.VOLUNTEER && (
            <div className="space-y-3 animate-in slide-in-from-top duration-500">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-on-surface uppercase tracking-widest ml-1">Volunteer ID (for Login)</label>
                <input value={volunteerForm.volunteerId} onChange={e => setVolunteerForm({...volunteerForm, volunteerId: e.target.value})} placeholder="e.g. vol-101" className="w-full px-5 py-4 bg-surface-variant/20 border-2 border-outline/60 rounded-2xl text-sm font-bold focus:border-primary focus:bg-white outline-none transition-all shadow-inner" />
              </div>
              <button type="button" onClick={() => setShowVolunteerJoin(true)} className="w-full py-4 border-2 border-dashed border-outline/60 text-secondary/60 rounded-2xl font-bold text-sm hover:border-primary hover:text-primary transition-all flex items-center justify-center gap-2">
                <Plus size={18} /> Request to Join NGO
              </button>
            </div>
          )}

          <button id="login-submit-btn" type="submit" disabled={loadingSubmit || (role === ROLES.CITIZEN && loadingList)} style={submitBtn}>
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
const shell: React.CSSProperties        = { minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#FCF9F3", padding:"1rem" };
const card: React.CSSProperties         = { background:"#fff", border:"2px solid #ccd6a6", borderRadius:"20px", padding:"2.5rem 2rem", width:"min(500px,100%)", boxShadow:"0 18px 40px -20px rgba(89,98,60,0.2)" };
const logoBox: React.CSSProperties      = { width:"52px", height:"52px", borderRadius:"16px", background:"#59623c", display:"inline-flex", alignItems:"center", justifyContent:"center", marginBottom:"0.75rem", boxShadow:"0 12px 24px -16px rgba(89,98,60,0.45)" };
const heading: React.CSSProperties      = { fontSize:"1.5rem", fontWeight:900, color:"#1c1c18", letterSpacing:"-0.025em", margin:"0 0 0.35rem" };
const subtext: React.CSSProperties      = { color:"#46483e", fontSize:"0.875rem" };
const labelStyle: React.CSSProperties   = { display:"block", fontWeight:700, fontSize:"0.82rem", color:"#1c1c18", marginBottom:"0.6rem" };
const roleGrid: React.CSSProperties     = { display:"grid", gridTemplateColumns:"1fr 1fr", gap:"0.5rem" };
const roleBtn: React.CSSProperties      = { border:"2px solid", borderRadius:"10px", padding:"0.65rem 0.9rem", fontSize:"0.85rem", cursor:"pointer", transition:"all 0.18s", display:"flex", alignItems:"center", gap:"0.4rem", fontFamily:"'Public Sans', sans-serif" };
const selectStyle: React.CSSProperties  = { width:"100%", border:"2px solid #ccd6a6", borderRadius:"10px", padding:"0.75rem 1rem", fontSize:"0.875rem", color:"#1c1c18", background:"#fff", outline:"none", fontFamily:"'Public Sans', sans-serif", cursor:"pointer" };
const previewChip: React.CSSProperties  = { marginTop:"0.6rem", display:"flex", alignItems:"center", gap:"0.5rem", background:"#f6f3ed", border:"1px solid #ccd6a6", borderRadius:"10px", padding:"0.6rem 0.9rem", fontSize:"0.82rem", color:"#1c1c18" };
const loadingBox: React.CSSProperties   = { display:"flex", alignItems:"center", gap:"0.5rem", color:"#6b7466", fontSize:"0.85rem", padding:"0.75rem", background:"#f6f3ed", borderRadius:"10px", border:"1px solid #ccd6a6" };
const submitBtn: React.CSSProperties    = { width:"100%", padding:"0.9rem", background:"#59623c", color:"#fff", border:"none", borderRadius:"12px", fontWeight:800, fontSize:"0.95rem", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem", cursor:"pointer", fontFamily:"'Public Sans', sans-serif", boxShadow:"0 16px 32px -18px rgba(89,98,60,0.5)", transition:"all 0.2s" };
