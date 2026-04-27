"use client";

import { useState, useRef, useCallback, useEffect, DragEvent, ChangeEvent } from "react";
import {
  MapPin, Upload, X, AlertTriangle, CheckCircle2,
  Loader2, ImageIcon, Video,
} from "lucide-react";

/* ── Types ────────────────────────────────────────────────── */
type Severity   = "low" | "medium" | "high" | "critical";
type Urgency    = "immediate" | "24h" | "can_wait" | "";
type MediaFile  = { file: File; preview: string; type: "image" | "video" };

interface RequestPayload {
  title:         string;
  category:      string;
  description:   string;
  summary:       string;
  urgency:       string; // mapped to low/medium/high for DB
  location:      { lat: string; lng: string; area_name: string };
  beneficiaries: number;
  requestedBy:   string;
}

/* ── Constants ────────────────────────────────────────────── */
const CATEGORIES = [
  { id: "sanitation",      label: "Sanitation",         icon: "🗑️" },
  { id: "water",           label: "Water Supply",        icon: "💧" },
  { id: "electricity",     label: "Electricity",         icon: "⚡" },
  { id: "roads",           label: "Roads & Infrastructure", icon: "🛣️" },
  { id: "healthcare",      label: "Healthcare",          icon: "🏥" },
  { id: "education",       label: "Education",           icon: "📚" },
  { id: "public_safety",   label: "Public Safety",       icon: "🚨" },
  { id: "environment",     label: "Environment",         icon: "🌱" },
  { id: "others",          label: "Others",              icon: "📋" },
] as const;

const SEVERITY_OPTIONS: { value: Severity; label: string; color: string }[] = [
  { value: "low",      label: "Low",      color: "#2e7d32" },
  { value: "medium",   label: "Medium",   color: "#b45309" },
  { value: "high",     label: "High",     color: "#c84b00" },
  { value: "critical", label: "Critical", color: "#ba1a1a" },
];

const URGENCY_OPTIONS: { value: Urgency; label: string }[] = [
  { value: "immediate", label: "🚨 Immediate Attention Needed" },
  { value: "24h",       label: "⏰ Within 24 Hours" },
  { value: "can_wait",  label: "🕐 Can Wait" },
];

/* ── Component ────────────────────────────────────────────── */
export default function NeedForm() {
  // Inject keyframe for spinner — avoids SSR hydration mismatch from inline <style>
  useEffect(() => {
    if (document.getElementById("vb-spin-kf")) return;
    const s = document.createElement("style");
    s.id = "vb-spin-kf";
    s.textContent = "@keyframes vb-spin { to { transform: rotate(360deg); } }";
    document.head.appendChild(s);
  }, []);
  const [category,     setCategory]     = useState<string>("");
  const [title,        setTitle]        = useState("");
  const [description,  setDescription]  = useState("");
  const [severity,     setSeverity]     = useState<Severity | "">("");
  const [urgency,      setUrgency]      = useState<Urgency>("");
  const [beneficiaries,setBeneficiaries]= useState<number>(1);
  const [location,     setLocation]     = useState({ lat: "", lng: "", area_name: "" });
  const [media,        setMedia]        = useState<MediaFile[]>([]);
  const [locLoading,   setLocLoading]   = useState(false);
  const [locError,     setLocError]     = useState("");
  const [isDragging,   setIsDragging]   = useState(false);
  const [errors,       setErrors]       = useState<Partial<Record<string, string>>>({});
  const [status,       setStatus]       = useState<"idle"|"submitting"|"success">("idle");

  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── Location ─────────────────────────────────────────── */
  const getLocation = () => {
    if (!navigator.geolocation) { setLocError("Geolocation not supported"); return; }
    setLocLoading(true); setLocError("");
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        let area_name = `${lat}, ${lng}`;
        try {
          const res  = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`);
          const data = await res.json();
          area_name  = data.display_name?.split(",").slice(0, 3).join(", ") ?? area_name;
        } catch { /* keep coord fallback */ }
        setLocation({ lat, lng, area_name });
        setLocLoading(false);
      },
      () => { setLocError("Could not get location. Please try again."); setLocLoading(false); }
    );
  };

  /* ── Media ────────────────────────────────────────────── */
  const addFiles = (files: File[]) => {
    const valid = files.filter(f => f.type.startsWith("image/") || f.type.startsWith("video/"));
    const mapped: MediaFile[] = valid.map(f => ({
      file:    f,
      preview: URL.createObjectURL(f),
      type:    f.type.startsWith("image/") ? "image" : "video",
    }));
    setMedia(prev => [...prev, ...mapped].slice(0, 6));
  };

  const onDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault(); setIsDragging(false);
    addFiles(Array.from(e.dataTransfer.files));
  }, []);

  const onDragOver  = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true);  };
  const onDragLeave = (e: DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };

  const onFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) addFiles(Array.from(e.target.files));
  };

  const removeMedia = (idx: number) => {
    setMedia(prev => { URL.revokeObjectURL(prev[idx].preview); return prev.filter((_, i) => i !== idx); });
  };

  /* ── Validation ───────────────────────────────────────── */
  const validate = () => {
    const e: Partial<Record<string, string>> = {};
    if (!category)              e.category    = "Please select a category.";
    if (!description.trim())    e.description = "Please describe the issue.";
    if (!location.lat)          e.location    = "Please set your location.";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  /* ── Submit ───────────────────────────────────────────── */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setStatus("submitting");

    // Map urgency label to DB urgency value (low/medium/high)
    const urgencyMap: Record<string, string> = {
      immediate: "high",
      "24h":     "medium",
      can_wait:  "low",
    };

    // Auto-generate summary from first sentence of description
    const summaryText = description.trim().split(/[.!?]/)[0]?.trim().slice(0, 120) || description.trim().slice(0, 120);

    const payload: RequestPayload = {
      title:         title.trim() || CATEGORIES.find(c => c.id === category)?.label || category,
      category,
      description:   description.trim(),
      summary:       summaryText,
      urgency:       urgencyMap[urgency] ?? "low",
      location,
      beneficiaries,
      requestedBy:   "", // filled server-side from citizenId
    };

    try {
      const res = await fetch("/api/requests", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error ?? "Failed to save request");
      }
      setStatus("success");
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      setErrors({ submit: msg });
      setStatus("idle");
    }
  };

  /* ── Success Screen ───────────────────────────────────── */
  if (status === "success") {
    return (
      <div style={successWrap}>
        <div style={successCard}>
          <div style={successIconWrap}><CheckCircle2 size={52} color="#2e7d32" strokeWidth={1.5} /></div>
          <h2 style={{ fontSize:"1.6rem", fontWeight:800, color:"#1c1c18", letterSpacing:"-0.025em", marginBottom:"0.5rem" }}>
            Issue Reported!
          </h2>
          <p style={{ color:"#46483e", fontSize:"0.95rem", lineHeight:1.6, maxWidth:"340px", margin:"0 auto 1.75rem" }}>
            Your issue has been saved to the database and will be reviewed shortly.
          </p>
          <div style={{ display:"flex", flexDirection:"column", gap:"0.65rem" }}>
            <button
              style={{ ...btnPrimary, padding:"0.75rem 2rem", fontSize:"0.95rem" }}
              onClick={() => {
                setStatus("idle"); setCategory(""); setTitle(""); setDescription("");
                setSeverity(""); setUrgency(""); setLocation({ lat:"", lng:"", area_name:"" }); setMedia([]);
              }}
            >
              Report Another Issue
            </button>
            <a
              href="/citizen/history"
              style={{
                display:"flex", alignItems:"center", justifyContent:"center", gap:"0.5rem",
                background:"#f6f3ed", border:"2px solid #ccd6a6", borderRadius:"12px",
                padding:"0.7rem 2rem", fontWeight:700, fontSize:"0.9rem",
                color:"#59623c", textDecoration:"none", transition:"background 0.2s",
              }}
            >
              View My Reports →
            </a>
          </div>
        </div>
      </div>
    );
  }

  /* ── Form ─────────────────────────────────────────────── */
  return (
    <form onSubmit={handleSubmit} noValidate style={{ display:"grid", gap:"1.5rem" }}>

      {/* ── 1. Category ── */}
      <section style={sectionStyle}>
        <SectionHeader step="1" title="Category" required />
        <p style={sectionHint}>Select the type of issue you are reporting.</p>
        <div style={categoryGrid}>
          {CATEGORIES.map(cat => (
            <button
              key={cat.id} type="button"
              onClick={() => { setCategory(cat.id); setErrors(p => ({ ...p, category: "" })); }}
              style={{
                ...categoryBtn,
                background:   category === cat.id ? "#dce4b8" : "#fff",
                borderColor:  category === cat.id ? "#59623c" : (errors.category ? "#ba1a1a" : "#ccd6a6"),
                boxShadow:    category === cat.id ? "0 0 0 3px rgba(89,98,60,0.15)" : "none",
                transform:    category === cat.id ? "translateY(-2px)" : "none",
              }}
            >
              <span style={{ fontSize:"1.5rem", lineHeight:1 }}>{cat.icon}</span>
              <span style={{ fontSize:"0.78rem", fontWeight:600, color: category===cat.id ? "#171e01" : "#46483e", marginTop:"0.35rem" }}>{cat.label}</span>
            </button>
          ))}
        </div>
        {errors.category && <FieldError msg={errors.category} />}
      </section>

      {/* ── 2. Title ── */}
      <section style={sectionStyle}>
        <SectionHeader step="2" title="Issue Title" />
        <input
          id="report-title"
          type="text"
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="e.g., Water leakage near street corner"
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor="#59623c"; e.target.style.boxShadow="0 0 0 3px rgba(89,98,60,0.12)"; }}
          onBlur={e =>  { e.target.style.borderColor="#ccd6a6"; e.target.style.boxShadow="none"; }}
        />
      </section>

      {/* ── 3. Description ── */}
      <section style={sectionStyle}>
        <SectionHeader step="3" title="Description" required />
        <textarea
          id="report-description"
          value={description}
          onChange={e => { setDescription(e.target.value); if (e.target.value.trim()) setErrors(p => ({ ...p, description:"" })); }}
          placeholder={"What is the issue?\nSince when has this been happening?\nWho is affected?"}
          rows={5}
          style={{ ...inputStyle, resize:"vertical", minHeight:"120px" }}
          onFocus={e => { e.target.style.borderColor="#59623c"; e.target.style.boxShadow="0 0 0 3px rgba(89,98,60,0.12)"; }}
          onBlur={e =>  { e.target.style.borderColor=errors.description?"#ba1a1a":"#ccd6a6"; e.target.style.boxShadow="none"; }}
        />
        {errors.description && <FieldError msg={errors.description} />}
      </section>

      {/* ── 4. Location ── */}
      <section style={sectionStyle}>
        <SectionHeader step="4" title="Location" required />
        <div style={locationBox}>
          <div style={{ display:"flex", alignItems:"center", gap:"0.75rem", marginBottom:"1rem" }}>
            <div style={locationIconWrap}><MapPin size={22} color="#59623c" /></div>
            <div>
              <p style={{ fontWeight:700, color:"#1c1c18", marginBottom:"0.2rem" }}>
                {location.lat ? location.area_name : "No location set"}
              </p>
              {location.lat && (
                <p style={{ fontSize:"0.75rem", color:"#6b7466" }}>
                  {location.lat}, {location.lng}
                </p>
              )}
            </div>
          </div>
          <button type="button" onClick={getLocation} disabled={locLoading} style={locationBtn}>
            {locLoading ? <Loader2 size={16} style={{ animation:"spin 1s linear infinite" }} /> : <MapPin size={16} />}
            {locLoading ? "Getting Location…" : location.lat ? "Update My Location" : "Use My Location"}
          </button>
          {locError && <p style={{ marginTop:"0.6rem", color:"#ba1a1a", fontSize:"0.8rem" }}>{locError}</p>}
        </div>
        {errors.location && <FieldError msg={errors.location} />}
      </section>

      {/* ── 5 & 6. Severity + Urgency ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))", gap:"1.5rem" }}>
        <section style={sectionStyle}>
          <SectionHeader step="5" title="Severity" />
          <select
            id="report-severity"
            value={severity}
            onChange={e => setSeverity(e.target.value as Severity | "")}
            style={{ ...inputStyle, cursor:"pointer" }}
            onFocus={e => { e.target.style.borderColor="#59623c"; e.target.style.boxShadow="0 0 0 3px rgba(89,98,60,0.12)"; }}
            onBlur={e =>  { e.target.style.borderColor="#ccd6a6"; e.target.style.boxShadow="none"; }}
          >
            <option value="">Select severity…</option>
            {SEVERITY_OPTIONS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
          {severity && (
            <span style={{
              display:"inline-flex", alignItems:"center", gap:"0.4rem",
              marginTop:"0.5rem", fontSize:"0.78rem", fontWeight:700,
              color: SEVERITY_OPTIONS.find(s=>s.value===severity)?.color,
            }}>
              <AlertTriangle size={13} />
              {SEVERITY_OPTIONS.find(s=>s.value===severity)?.label} severity
            </span>
          )}
        </section>

        <section style={sectionStyle}>
          <SectionHeader step="6" title="Urgency Tag" hint="(Optional)" />
          <select
            id="report-urgency"
            value={urgency}
            onChange={e => setUrgency(e.target.value as Urgency)}
            style={{ ...inputStyle, cursor:"pointer" }}
            onFocus={e => { e.target.style.borderColor="#59623c"; e.target.style.boxShadow="0 0 0 3px rgba(89,98,60,0.12)"; }}
            onBlur={e =>  { e.target.style.borderColor="#ccd6a6"; e.target.style.boxShadow="none"; }}
          >
            <option value="">Select urgency…</option>
            {URGENCY_OPTIONS.map(u => <option key={u.value} value={u.value}>{u.label}</option>)}
          </select>
        </section>
      </div>

      {/* ── 7. Beneficiaries ── */}
      <section style={sectionStyle}>
        <SectionHeader step="7" title="People Affected" hint="(Approx. number)" />
        <p style={sectionHint}>How many people are affected by this issue?</p>
        <input
          type="number"
          min={1}
          max={10000}
          value={beneficiaries}
          onChange={e => setBeneficiaries(Math.max(1, Number(e.target.value)))}
          style={{
            width:"120px", border:"2px solid #ccd6a6", borderRadius:"10px",
            padding:"0.65rem 1rem", fontSize:"0.95rem", color:"#1c1c18",
            background:"#fff", outline:"none", fontFamily:"'Public Sans', sans-serif",
          }}
          onFocus={e  => { e.target.style.borderColor="#59623c"; e.target.style.boxShadow="0 0 0 3px rgba(89,98,60,0.12)"; }}
          onBlur={e   => { e.target.style.borderColor="#ccd6a6"; e.target.style.boxShadow="none"; }}
        />
      </section>

      {/* ── 8. Media Upload ── */}
      <section style={sectionStyle}>
        <SectionHeader step="8" title="Photos / Videos" hint="(Optional — max 6)" />
        <div
          onDrop={onDrop} onDragOver={onDragOver} onDragLeave={onDragLeave}
          onClick={() => fileInputRef.current?.click()}
          style={{
            ...dropzone,
            borderColor:  isDragging ? "#59623c" : "#ccd6a6",
            background:   isDragging ? "#f0f4e4" : "#fafaf7",
            transform:    isDragging ? "scale(1.01)" : "none",
          }}
        >
          <Upload size={32} color="#59623c" strokeWidth={1.5} />
          <p style={{ fontWeight:700, color:"#1c1c18", marginTop:"0.75rem" }}>Drag & drop files here</p>
          <p style={{ fontSize:"0.8rem", color:"#6b7466", marginTop:"0.3rem" }}>or click to browse — images & videos accepted</p>
          <input
            ref={fileInputRef} type="file" multiple hidden
            accept="image/*,video/*" onChange={onFileChange}
          />
        </div>

        {media.length > 0 && (
          <div style={previewGrid}>
            {media.map((m, i) => (
              <div key={i} style={previewItem}>
                {m.type === "image" ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={m.preview} alt={`Upload ${i+1}`} style={{ width:"100%", height:"100%", objectFit:"cover", borderRadius:"8px" }} />
                ) : (
                  <div style={{ width:"100%", height:"100%", background:"#1c1c18", borderRadius:"8px", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:"0.4rem" }}>
                    <Video size={24} color="#ccd6a6" />
                    <span style={{ fontSize:"0.7rem", color:"#ccd6a6" }}>{m.file.name.slice(0,16)}</span>
                  </div>
                )}
                <button type="button" onClick={() => removeMedia(i)} style={removeBtn} title="Remove">
                  <X size={12} />
                </button>
                <div style={mediaBadge}>
                  {m.type === "image" ? <ImageIcon size={10} /> : <Video size={10} />}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* ── Submit Error ── */}
      {errors.submit && (
        <p style={{ color:"#ba1a1a", fontSize:"0.82rem", textAlign:"center", display:"flex", alignItems:"center", justifyContent:"center", gap:"0.4rem" }}>
          <AlertTriangle size={14} /> {errors.submit}
        </p>
      )}

      {/* ── Submit ── */}
      <button
        id="submit-report-btn"
        type="submit"
        disabled={status === "submitting"}
        style={{
          ...btnPrimary,
          width:"100%", padding:"1rem", fontSize:"1rem",
          opacity: status==="submitting" ? 0.7 : 1,
        }}
      >
        {status === "submitting"
          ? <><Loader2 size={18} style={{ animation:"vb-spin 1s linear infinite" }} /> Submitting Report…</>
          : "Submit Report"
        }
      </button>
    </form>
  );
}

/* ── Sub-components ───────────────────────────────────────── */
function SectionHeader({ step, title, required, hint }: { step: string; title: string; required?: boolean; hint?: string }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", marginBottom:"0.6rem" }}>
      <span style={{ width:"22px", height:"22px", borderRadius:"999px", background:"#59623c", color:"#fff", fontSize:"0.65rem", fontWeight:800, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{step}</span>
      <label style={{ fontWeight:700, fontSize:"0.9rem", color:"#1c1c18" }}>
        {title}
        {required && <span style={{ color:"#ba1a1a", marginLeft:"3px" }}>*</span>}
        {hint && <span style={{ fontWeight:500, color:"#6b7466", marginLeft:"0.4rem", fontSize:"0.8rem" }}>{hint}</span>}
      </label>
    </div>
  );
}

function FieldError({ msg }: { msg: string }) {
  return (
    <p style={{ color:"#ba1a1a", fontSize:"0.78rem", marginTop:"0.4rem", display:"flex", alignItems:"center", gap:"0.35rem" }}>
      <AlertTriangle size={12} /> {msg}
    </p>
  );
}

/* ── Styles ───────────────────────────────────────────────── */
const sectionStyle: React.CSSProperties = {
  display: "grid", gap: "0.1rem",
};

const sectionHint: React.CSSProperties = {
  color:"#6b7466", fontSize:"0.8rem", marginBottom:"0.75rem",
};

const categoryGrid: React.CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
  gap: "0.65rem",
};

const categoryBtn: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  padding: "0.85rem 0.5rem", border: "2px solid", borderRadius: "12px",
  cursor: "pointer", transition: "all 0.18s ease", gap: "0.3rem",
};

const inputStyle: React.CSSProperties = {
  width: "100%", border: "2px solid #ccd6a6", borderRadius: "10px",
  padding: "0.75rem 1rem", fontSize: "0.875rem", color: "#1c1c18",
  background: "#fff", outline: "none", fontFamily: "'Public Sans', sans-serif",
  transition: "border-color 0.2s, box-shadow 0.2s",
};

const locationBox: React.CSSProperties = {
  background: "#fff", border: "2px solid #ccd6a6", borderRadius: "12px",
  padding: "1.25rem", display: "grid", gap: "0.25rem",
};

const locationIconWrap: React.CSSProperties = {
  width: "44px", height: "44px", borderRadius: "12px",
  background: "#dce4b8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
};

const locationBtn: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", gap: "0.5rem",
  background: "#59623c", color: "#fff", border: "none", borderRadius: "10px",
  padding: "0.6rem 1.2rem", fontWeight: 700, fontSize: "0.85rem",
  cursor: "pointer", transition: "background 0.2s", fontFamily: "'Public Sans', sans-serif",
};

const dropzone: React.CSSProperties = {
  border: "2.5px dashed", borderRadius: "14px", padding: "2.5rem 1rem",
  display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
  cursor: "pointer", transition: "all 0.2s ease", textAlign: "center",
};

const previewGrid: React.CSSProperties = {
  display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(96px, 1fr))",
  gap: "0.65rem", marginTop: "0.85rem",
};

const previewItem: React.CSSProperties = {
  position: "relative", height: "96px", borderRadius: "10px",
  overflow: "hidden", border: "2px solid #ccd6a6",
};

const removeBtn: React.CSSProperties = {
  position: "absolute", top: "4px", right: "4px",
  width: "20px", height: "20px", borderRadius: "999px",
  background: "rgba(0,0,0,0.65)", color: "#fff", border: "none",
  display: "flex", alignItems: "center", justifyContent: "center",
  cursor: "pointer", zIndex: 2,
};

const mediaBadge: React.CSSProperties = {
  position: "absolute", bottom: "4px", left: "4px",
  background: "rgba(0,0,0,0.5)", color: "#fff", borderRadius: "4px",
  padding: "2px 5px", display: "flex", alignItems: "center",
};

const btnPrimary: React.CSSProperties = {
  display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "0.5rem",
  background: "#59623c", color: "#fff", border: "none", borderRadius: "12px",
  fontWeight: 800, fontFamily: "'Public Sans', sans-serif", cursor: "pointer",
  boxShadow: "0 16px 32px -18px rgba(89,98,60,0.5)", transition: "all 0.2s",
};

const successWrap: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "center", padding: "3rem 1rem",
};

const successCard: React.CSSProperties = {
  background: "#fff", border: "2px solid #ccd6a6", borderRadius: "20px",
  padding: "3rem 2rem", textAlign: "center", maxWidth: "440px", width: "100%",
  boxShadow: "0 18px 40px -20px rgba(89,98,60,0.2)",
};

const successIconWrap: React.CSSProperties = {
  width: "80px", height: "80px", borderRadius: "999px",
  background: "#f1f8f1", display: "flex", alignItems: "center", justifyContent: "center",
  margin: "0 auto 1.25rem",
};
