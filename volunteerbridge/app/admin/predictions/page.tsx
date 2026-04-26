"use client";
import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { apiClient } from "@/lib/api/client";
import {
  MODEL_INFO, FEATURE_IMPORTANCE, CONFUSION_MATRIX,
  PREDICTED_AREAS, UPCOMING_EVENTS,
} from "@/lib/mock/predictions";
import {
  Brain, Database, Download, ChevronRight, TrendingUp,
  AlertTriangle, CheckCircle, Clock, Calendar,
  FlaskConical, Target, Zap, RefreshCw, Info,
} from "lucide-react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

// ─── helpers ───────────────────────────────────────────────────────────────
const RISK_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  high:   { bg:"#fef2f2", color:"#ba1a1a", border:"#fecaca" },
  medium: { bg:"#fffbeb", color:"#b45309", border:"#fde68a" },
  low:    { bg:"#f0fdf4", color:"#2e7d32", border:"#bbf7d0" },
};
const EVENT_COLOR: Record<string, string> = {
  deployment:"#ef4444", health:"#3b82f6", audit:"#f97316",
  training:"#8b5cf6", meeting:"#6b7466", model:"#59623c",
  education:"#0ea5e9", safety:"#eab308",
};

function downloadCSV() {
  const a = document.createElement("a");
  a.href = "/data/datasets/humanitarian_risk_dataset.csv";
  a.download = "humanitarian_risk_dataset.csv";
  a.click();
}

// ─── Calendar ──────────────────────────────────────────────────────────────
function MiniCalendar({ events }: { events: typeof UPCOMING_EVENTS }) {
  const today = new Date("2026-04-24");
  const [cur, setCur] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const year = cur.getFullYear(); const month = cur.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  const eventsByDate = useMemo(() => {
    const map: Record<string, typeof events> = {};
    events.forEach(e => { if (!map[e.date]) map[e.date] = []; map[e.date].push(e); });
    return map;
  }, [events]);

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <div>
      {/* Nav */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:"1rem" }}>
        <button onClick={() => setCur(new Date(year, month-1, 1))}
          style={{ border:"1.5px solid #ccd6a6", borderRadius:8, padding:"4px 10px", background:"#f6f3ed", cursor:"pointer", fontWeight:700, fontSize:"0.85rem", color:"#59623c" }}>‹</button>
        <strong style={{ fontSize:"0.95rem", color:"#1c1c18" }}>{MONTHS[month]} {year}</strong>
        <button onClick={() => setCur(new Date(year, month+1, 1))}
          style={{ border:"1.5px solid #ccd6a6", borderRadius:8, padding:"4px 10px", background:"#f6f3ed", cursor:"pointer", fontWeight:700, fontSize:"0.85rem", color:"#59623c" }}>›</button>
      </div>
      {/* Day headers */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2, marginBottom:4 }}>
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} style={{ textAlign:"center", fontSize:"0.65rem", fontWeight:700, color:"#6b7466", padding:"4px 0" }}>{d}</div>
        ))}
      </div>
      {/* Cells */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", gap:2 }}>
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const dayEvents = eventsByDate[dateStr] || [];
          const isToday = dateStr === "2026-04-24";
          const hasHigh = dayEvents.some(e => e.priority === "high");
          return (
            <div key={i} title={dayEvents.map(e => e.title).join("\n")}
              style={{
                borderRadius:8, padding:"6px 2px", textAlign:"center", cursor: dayEvents.length ? "pointer" : "default",
                background: isToday ? "#59623c" : dayEvents.length ? (hasHigh ? "#fef2f2" : "#f6f9ee") : "transparent",
                border: isToday ? "none" : dayEvents.length ? `1.5px solid ${hasHigh ? "#fecaca" : "#ccd6a6"}` : "1.5px solid transparent",
                position:"relative",
              }}>
              <span style={{ fontSize:"0.78rem", fontWeight: isToday ? 900 : dayEvents.length ? 700 : 400, color: isToday ? "white" : dayEvents.length ? "#1c1c18" : "#6b7466" }}>{day}</span>
              {dayEvents.length > 0 && (
                <div style={{ display:"flex", justifyContent:"center", gap:2, marginTop:2 }}>
                  {dayEvents.slice(0,3).map((e,ei) => (
                    <div key={ei} style={{ width:5, height:5, borderRadius:"50%", background: EVENT_COLOR[e.type] || "#59623c" }} />
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default function PredictionsPage() {
  const [activeTab, setActiveTab] = useState<"predictions"|"model"|"calendar">("predictions");
  const [running, setRunning] = useState(false);
  const [lastRun, setLastRun] = useState("2026-04-24 06:00");
  const [predictionRows, setPredictionRows] = useState<any[]>([]);

  useEffect(() => {
    apiClient.getPredictions().then(setPredictionRows).catch(console.error);
  }, []);

  const runModel = async () => {
    setRunning(true);
    await new Promise(r => setTimeout(r, 2200));
    setLastRun(new Date().toLocaleString("en-IN", { hour12:false }).slice(0,16));
    setRunning(false);
  };

  const upcomingCount = UPCOMING_EVENTS.filter(e => e.date >= "2026-04-24").length;
  const rows = predictionRows.length ? predictionRows : PREDICTED_AREAS;
  const highCount = rows.filter(a => (a.label ?? (a.score >= 70 ? "high" : a.score >= 45 ? "medium" : "low")) === "high").length;

  return (
    <div className="page-stack">

      {/* Header */}
      <section className="page-header">
        <div>
          <p className="page-header__eyebrow">Feature 5 — AI Engine</p>
          <h2>Model Predictions & Intelligence</h2>
          <p>Random Forest risk classifier trained on humanitarian indicators — OCHA HDX + WFP datasets.</p>
        </div>
        <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap", alignItems:"center" }}>
          {highCount > 0 && <span className="highlight-chip">⚠ {highCount} high-risk zones</span>}
          <button className="ghost-button" onClick={downloadCSV}
            style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
            <Download size={14}/> Download Dataset
          </button>
          <button className="primary-button" onClick={runModel} disabled={running}
            style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
            {running ? <RefreshCw size={14} style={{ animation:"spin 0.8s linear infinite" }}/> : <Zap size={14}/>}
            {running ? "Running Model…" : "Run Prediction"}
          </button>
        </div>
      </section>

      {/* KPI strip */}
      <div className="metric-grid">
        {[
          { label:"Model Accuracy",    val:`${MODEL_INFO.accuracy}%`,   sub:"5-fold cross-val",     Icon:Target,      color:"#59623c" },
          { label:"F1 Score",          val:MODEL_INFO.f1 + "%",         sub:"Macro-averaged",       Icon:FlaskConical,color:"#2e7d32" },
          { label:"High-Risk Zones",   val:highCount,                   sub:"Immediate action",     Icon:AlertTriangle,color:"#ef4444" },
          { label:"Upcoming Events",   val:upcomingCount,               sub:"Next 30 days",         Icon:Calendar,    color:"#1d4ed8" },
        ].map(({ label, val, sub, Icon, color }) => (
          <div key={label} className="metric-card">
            <div className="metric-card__meta">
              <p>{label}</p><h3>{val}</h3><span>{sub}</span>
            </div>
            <div className="metric-card__icon" style={{ background:color+"18", color }}>
              <Icon size={20} strokeWidth={2}/>
            </div>
          </div>
        ))}
      </div>

      {/* Last run banner */}
      <div style={{ display:"flex", alignItems:"center", gap:"0.6rem", padding:"0.6rem 1rem", background:"#f6f9ee", border:"1.5px solid #ccd6a6", borderRadius:12, fontSize:"0.8rem", color:"#46483e" }}>
        <Clock size={14} color="#59623c"/>
        <span>Last model run: <strong>{lastRun}</strong></span>
        <span style={{ marginLeft:"auto", color:"#6b7466" }}>Dataset: <strong>{MODEL_INFO.dataset}</strong> · {MODEL_INFO.datasetRows} records · Source: {MODEL_INFO.datasetSource}</span>
      </div>

      {/* Tabs */}
      <div className="tab-row">
        {([
          { id:"predictions", label:"Risk Predictions",  Icon:AlertTriangle },
          { id:"model",       label:"Model Card",         Icon:Brain         },
          { id:"calendar",    label:"Event Calendar",     Icon:Calendar      },
        ] as const).map(({ id, label, Icon }) => (
          <button key={id} className={`tab-button ${activeTab===id?"active":""}`}
            onClick={() => setActiveTab(id)}
            style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}>
            <Icon size={14}/> {label}
          </button>
        ))}
      </div>

      {/* ── TAB: Predictions ── */}
      {activeTab === "predictions" && (
        <div style={{ display:"grid", gap:"1.25rem" }}>
          {/* Risk zones table */}
          <section className="tool-surface">
            <div className="surface-header">
              <div><p className="section-kicker">AI Output</p><h3>Zone risk classification</h3></div>
            </div>
            <div className="table-scroll">
              <table className="admin-table">
                <thead><tr>
                  <th>Zone</th><th>Category</th><th>Risk Score</th><th>Level</th>
                  <th>Trend</th><th>Recommended Action</th><th>Outlook</th>
                </tr></thead>
                <tbody>
                  {rows.map(a => {
                    const label = a.label ?? (a.score >= 70 ? "high" : a.score >= 45 ? "medium" : "low");
                    const s = RISK_STYLE[label];
                    return (
                      <tr key={a.id}>
                        <td><strong>{a.area}</strong></td>
                        <td style={{ fontSize:"0.82rem" }}>{a.category}</td>
                        <td>
                          <div style={{ display:"flex", alignItems:"center", gap:"0.5rem" }}>
                            <div style={{ width:60, height:6, borderRadius:999, background:"#e8edca" }}>
                              <div style={{ width:`${a.score}%`, height:"100%", borderRadius:999, background: a.score>=70?"#ef4444":a.score>=45?"#f59e0b":"#22c55e" }}/>
                            </div>
                            <strong style={{ fontSize:"0.85rem" }}>{a.score}</strong>
                          </div>
                        </td>
                        <td>
                          <span style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}`, borderRadius:999, padding:"2px 10px", fontSize:"0.72rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.06em" }}>
                            {label}
                          </span>
                        </td>
                        <td style={{ fontWeight:700, fontSize:"0.85rem", color: a.trend.startsWith("+")?"#ef4444":"#2e7d32" }}>{a.trend}</td>
                        <td style={{ fontSize:"0.8rem", color:"#1c1c18", maxWidth:200 }}>{a.recommendedAction}</td>
                        <td style={{ fontSize:"0.75rem", color:"#6b7466", maxWidth:180 }}>{a.outlook}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Feature importance chart */}
          <div className="content-grid">
            <section className="tool-surface">
              <div className="surface-header"><div><p className="section-kicker">Explainability</p><h3>Feature importance</h3></div></div>
              <Plot
                data={[{
                  type:"bar", orientation:"h",
                  x: FEATURE_IMPORTANCE.map(f => f.importance),
                  y: FEATURE_IMPORTANCE.map(f => f.feature),
                  marker:{ color: FEATURE_IMPORTANCE.map(f => f.color) },
                  text: FEATURE_IMPORTANCE.map(f => `${(f.importance*100).toFixed(0)}%`),
                  textposition:"outside",
                }]}
                layout={{
                  height:280, margin:{ l:160, r:40, t:10, b:30 },
                  paper_bgcolor:"transparent", plot_bgcolor:"transparent",
                  xaxis:{ showgrid:false, zeroline:false, tickformat:".0%", range:[0,0.35] },
                  yaxis:{ automargin:true, tickfont:{ size:11 } },
                  font:{ family:"Public Sans,sans-serif", size:11 },
                }}
                config={{ displayModeBar:false, responsive:true }}
                style={{ width:"100%" }}
              />
            </section>

            <section className="tool-surface">
              <div className="surface-header"><div><p className="section-kicker">Validation</p><h3>Confusion matrix</h3></div></div>
              <Plot
                data={[{
                  type:"heatmap",
                  z: CONFUSION_MATRIX.matrix,
                  x: CONFUSION_MATRIX.labels,
                  y: CONFUSION_MATRIX.labels,
                  colorscale:[["0","#fef9ec"],["1","#59623c"]],
                  showscale:false,
                  text: CONFUSION_MATRIX.matrix.map(r => r.map(String)),
                  texttemplate:"%{text}",
                  textfont:{ size:16, color:"white" },
                }]}
                layout={{
                  height:280, margin:{ l:70, r:20, t:10, b:50 },
                  paper_bgcolor:"transparent", plot_bgcolor:"transparent",
                  xaxis:{ title:"Predicted", tickfont:{ size:11 } },
                  yaxis:{ title:"Actual", tickfont:{ size:11 } },
                  font:{ family:"Public Sans,sans-serif", size:11 },
                }}
                config={{ displayModeBar:false, responsive:true }}
                style={{ width:"100%" }}
              />
            </section>
          </div>
        </div>
      )}

      {/* ── TAB: Model Card ── */}
      {activeTab === "model" && (
        <div style={{ display:"grid", gap:"1.25rem" }}>
          <div className="content-grid">
            {/* Model specs */}
            <section className="tool-surface">
              <div className="surface-header"><div><p className="section-kicker">Architecture</p><h3>Model specification</h3></div><Brain size={20} color="#59623c"/></div>
              <div style={{ display:"grid", gap:"0.6rem" }}>
                {[
                  ["Algorithm",        MODEL_INFO.algorithm],
                  ["Version",          MODEL_INFO.version],
                  ["n_estimators",     String(MODEL_INFO.nEstimators)],
                  ["max_depth",        String(MODEL_INFO.maxDepth)],
                  ["Cross-validation", MODEL_INFO.crossValidation],
                  ["Input features",   String(MODEL_INFO.features)],
                  ["Output classes",   MODEL_INFO.classes.join(", ")],
                  ["Trained on",       MODEL_INFO.trainedOn],
                ].map(([k,v]) => (
                  <div key={k} style={{ display:"flex", justifyContent:"space-between", padding:"0.5rem 0", borderBottom:"1px solid #e8edca", fontSize:"0.85rem" }}>
                    <span style={{ color:"#6b7466", fontWeight:600 }}>{k}</span>
                    <strong style={{ color:"#1c1c18" }}>{v}</strong>
                  </div>
                ))}
              </div>
            </section>

            {/* Metrics */}
            <section className="tool-surface">
              <div className="surface-header"><div><p className="section-kicker">Performance</p><h3>Validation metrics</h3></div><Target size={20} color="#59623c"/></div>
              <div style={{ display:"grid", gap:"0.75rem" }}>
                {[
                  { label:"Accuracy",  val:MODEL_INFO.accuracy, max:100, color:"#59623c",  unit:"%" },
                  { label:"Precision", val:MODEL_INFO.precision, max:100, color:"#2e7d32",  unit:"%" },
                  { label:"Recall",    val:MODEL_INFO.recall,    max:100, color:"#1d4ed8",  unit:"%" },
                  { label:"F1 Score",  val:MODEL_INFO.f1,        max:100, color:"#b45309",  unit:"%" },
                  { label:"AUC-ROC",   val:MODEL_INFO.auc*100,   max:100, color:"#8b5cf6",  unit:"%" },
                ].map(({ label, val, max, color, unit }) => (
                  <div key={label}>
                    <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                      <span style={{ fontSize:"0.82rem", color:"#46483e", fontWeight:600 }}>{label}</span>
                      <strong style={{ fontSize:"0.85rem", color }}>{val}{unit}</strong>
                    </div>
                    <div style={{ height:8, borderRadius:999, background:"#e8edca" }}>
                      <div style={{ width:`${(val/max)*100}%`, height:"100%", borderRadius:999, background:color, transition:"width 0.6s ease" }}/>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* Dataset card */}
          <section className="tool-surface" style={{ background:"linear-gradient(135deg,#f6f9ee 0%,#fff 100%)", border:"2px solid #ccd6a6" }}>
            <div className="surface-header">
              <div><p className="section-kicker">Training Data</p><h3>Dataset information</h3></div>
              <button className="primary-button" onClick={downloadCSV}
                style={{ display:"flex", alignItems:"center", gap:"0.4rem", fontSize:"0.8rem", padding:"0.5rem 0.9rem" }}>
                <Download size={13}/> Download CSV
              </button>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))", gap:"1.25rem" }}>
              {[
                { label:"Dataset file",    val:MODEL_INFO.dataset,       Icon:Database   },
                { label:"Training records",val:String(MODEL_INFO.datasetRows), Icon:TrendingUp },
                { label:"Primary source",  val:MODEL_INFO.datasetSource, Icon:Info       },
                { label:"Features",        val:`${MODEL_INFO.features} input columns`, Icon:FlaskConical },
              ].map(({ label, val, Icon }) => (
                <div key={label} style={{ padding:"1rem", background:"white", borderRadius:12, border:"1.5px solid #e8edca" }}>
                  <Icon size={16} color="#59623c" style={{ marginBottom:"0.4rem" }}/>
                  <p style={{ fontSize:"0.65rem", fontWeight:700, textTransform:"uppercase", letterSpacing:"0.1em", color:"#6b7466", marginBottom:"0.3rem" }}>{label}</p>
                  <strong style={{ fontSize:"0.875rem", color:"#1c1c18" }}>{val}</strong>
                </div>
              ))}
            </div>
            <div style={{ marginTop:"1rem", padding:"0.75rem 1rem", background:"#f6f9ee", borderRadius:10, border:"1px solid #ccd6a6", fontSize:"0.8rem", color:"#46483e" }}>
              <strong style={{ color:"#59623c" }}>Referenced datasets:</strong>{" "}
              OCHA Humanitarian Data Exchange (HDX) · WFP Open Data Portal · ACAPS Severity Index · ReliefWeb Crisis Indicators
            </div>
          </section>
        </div>
      )}

      {/* ── TAB: Calendar ── */}
      {activeTab === "calendar" && (
        <div className="content-grid">
          <section className="tool-surface">
            <div className="surface-header"><div><p className="section-kicker">Schedule</p><h3>Event calendar</h3></div></div>
            <MiniCalendar events={UPCOMING_EVENTS}/>
            {/* Legend */}
            <div style={{ display:"flex", flexWrap:"wrap", gap:"0.6rem", marginTop:"1rem", paddingTop:"0.75rem", borderTop:"1px solid #e8edca" }}>
              {Object.entries(EVENT_COLOR).map(([type, color]) => (
                <div key={type} style={{ display:"flex", alignItems:"center", gap:"0.35rem", fontSize:"0.72rem", color:"#46483e", fontWeight:600 }}>
                  <div style={{ width:8, height:8, borderRadius:"50%", background:color }}/>
                  {type}
                </div>
              ))}
            </div>
          </section>

          {/* Upcoming event list */}
          <section className="tool-surface">
            <div className="surface-header"><div><p className="section-kicker">Upcoming</p><h3>Next 30 days</h3></div></div>
            <div style={{ display:"flex", flexDirection:"column", gap:"0.6rem", maxHeight:520, overflowY:"auto" }}>
              {UPCOMING_EVENTS.sort((a,b) => a.date.localeCompare(b.date)).map(e => {
                const s = RISK_STYLE[e.priority] || RISK_STYLE.low;
                return (
                  <div key={e.id} style={{ display:"flex", gap:"0.85rem", padding:"0.75rem", borderRadius:10, border:"1.5px solid #e8edca", background:"#f6f9ee", alignItems:"flex-start" }}>
                    <div style={{ width:44, textAlign:"center", flexShrink:0 }}>
                      <div style={{ fontSize:"0.6rem", fontWeight:700, textTransform:"uppercase", color:"#6b7466" }}>
                        {new Date(e.date).toLocaleString("en",{month:"short"})}
                      </div>
                      <div style={{ fontSize:"1.4rem", fontWeight:900, color:"#1c1c18", lineHeight:1 }}>
                        {new Date(e.date).getDate()}
                      </div>
                    </div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <strong style={{ fontSize:"0.875rem", color:"#1c1c18", display:"block" }}>{e.title}</strong>
                      <span style={{ fontSize:"0.75rem", color:"#6b7466" }}>{e.area}</span>
                    </div>
                    <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:"0.3rem", flexShrink:0 }}>
                      <span style={{ width:8, height:8, borderRadius:"50%", background:EVENT_COLOR[e.type], display:"inline-block" }}/>
                      <span style={{ background:s.bg, color:s.color, border:`1px solid ${s.border}`, borderRadius:999, padding:"1px 8px", fontSize:"0.65rem", fontWeight:700 }}>
                        {e.priority}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      )}

    </div>
  );
}
