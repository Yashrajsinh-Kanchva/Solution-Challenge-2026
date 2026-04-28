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
  Search, Filter, Activity, BarChart3, Binary
} from "lucide-react";

const Plot = dynamic(() => import("react-plotly.js"), { ssr: false }) as any;

const RISK_STYLE: Record<string, { bg: string; color: string; border: string }> = {
  high:   { bg:"bg-red-50", color:"text-red-600", border:"border-red-100" },
  medium: { bg:"bg-amber-50", color:"text-amber-700", border:"border-amber-100" },
  low:    { bg:"bg-green-50", color:"text-green-700", border:"border-green-100" },
};

const EVENT_COLOR: Record<string, string> = {
  deployment:"#EF4444", health:"#3B82F6", audit:"#F97316",
  training:"#8B5CF6", meeting:"#6B7466", model:"#4D5A2C",
  education:"#0EA5E9", safety:"#EAB308",
};

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
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => setCur(new Date(year, month-1, 1))} className="p-2 bg-[#F7F5EE] border border-[#CCD6A6] rounded-xl text-[#4D5A2C] font-black">‹</button>
        <strong className="text-[14px] font-black tracking-tight">{MONTHS[month]} {year}</strong>
        <button onClick={() => setCur(new Date(year, month+1, 1))} className="p-2 bg-[#F7F5EE] border border-[#CCD6A6] rounded-xl text-[#4D5A2C] font-black">›</button>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d => (
          <div key={d} className="text-center text-[10px] font-black text-[#6B7160] uppercase">{d}</div>
        ))}
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const dateStr = `${year}-${String(month+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
          const dayEvents = eventsByDate[dateStr] || [];
          const isToday = dateStr === "2026-04-24";
          return (
            <div key={i} className={`aspect-square flex flex-col items-center justify-center rounded-xl border ${isToday ? "bg-[#4D5A2C] text-white" : dayEvents.length ? "bg-[#F7F5EE] border-[#CCD6A6]" : "bg-transparent border-transparent"}`}>
              <span className={`text-[11px] ${isToday ? "font-black" : "font-bold"}`}>{day}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

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

  const tabs = [
    { id: "predictions", label: "Risk Analysis", Icon: AlertTriangle, color: "text-[#BA1A1A]", bg: "bg-[#FEE2E2]" },
    { id: "model",       label: "Model Card",    Icon: Brain,         color: "text-[#4D5A2C]", bg: "bg-[#EEF3D2]" },
    { id: "calendar",    label: "Event Feed",    Icon: Calendar,      color: "text-[#1D4ED8]", bg: "bg-[#DBEAFE]" },
  ] as const;

  return (
    <div className="page-stack max-w-[1440px] mx-auto">
      {/* Header Section */}
      <section className="flex flex-col xl:flex-row justify-between items-center gap-8 mb-12">
        <div className="max-w-3xl w-full text-center xl:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1C15] tracking-tight leading-[1.1] mb-3">
            AI Risk Intelligence
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#6B7160] leading-relaxed">
            Neural predictive engine trained on humanitarian crisis indicators and neighborhood demographics.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto justify-center xl:justify-end">
          <button 
            onClick={() => alert("Dataset download started.")}
            className="flex-1 xl:flex-none px-6 py-4 bg-white border-2 border-[#E8EDD0] text-[#4D5A2C] font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#F7F5EE] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Download size={16} strokeWidth={2.5} /> Download Dataset
          </button>
          <button 
            onClick={runModel}
            disabled={running}
            className="flex-1 xl:flex-none px-8 py-4 bg-[#4D5A2C] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#647A39] transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
          >
            {running ? <RefreshCw size={18} strokeWidth={2.5} className="animate-spin" /> : <Zap size={18} strokeWidth={2.5} />}
            {running ? "Simulating..." : "Run Prediction"}
          </button>
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Model Accuracy", val: `${MODEL_INFO.accuracy}%`, sub: "5-fold cross-val", Icon: Target, color: "text-[#4D5A2C]", bg: "bg-[#EEF3D2]" },
          { label: "F1 Score", val: `${MODEL_INFO.f1}%`, sub: "Macro-averaged", Icon: FlaskConical, color: "text-[#166534]", bg: "bg-[#DCFCE7]" },
          { label: "High-Risk Zones", val: highCount, sub: "Immediate action", Icon: AlertTriangle, color: "text-[#BA1A1A]", bg: "bg-[#FEE2E2]" },
          { label: "Predictive Window", val: "30 Days", sub: "Forecast outlook", Icon: Calendar, color: "text-[#1D4ED8]", bg: "bg-[#DBEAFE]" },
        ].map((item) => (
          <div key={item.label} className="bg-white p-7 rounded-[32px] border-2 border-transparent hover:border-[#E8EDD0] shadow-sm flex flex-col gap-5 transition-all hover:translate-y-[-4px]">
            <div className={`w-12 h-12 ${item.bg} ${item.color} rounded-2xl flex items-center justify-center`}>
              <item.Icon size={24} strokeWidth={2.5} />
            </div>
            <div>
              <p className="text-[12px] font-black text-[#4D5A2C] uppercase tracking-wider mb-1">{item.label}</p>
              <h3 className="text-4xl font-black text-[#1A1C15] mb-1">{item.val}</h3>
              <p className="text-[11px] font-bold text-[#9CA396] uppercase tracking-widest">{item.sub}</p>
            </div>
          </div>
        ))}
      </section>

      {/* Status Bar */}
      <div className="bg-[#F7F5EE] border-2 border-[#E8EDD0] rounded-[24px] px-8 py-5 flex flex-col md:flex-row justify-between items-center gap-4 mb-12">
        <div className="flex items-center gap-3">
          <Clock size={16} className="text-[#4D5A2C]" />
          <p className="text-xs font-bold text-[#46483E]">
            Last Engine Run: <span className="font-black text-[#1A1C15]">{lastRun}</span>
          </p>
        </div>
        <div className="flex items-center gap-6 opacity-60">
          <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7160]">
            Dataset: <span className="text-[#1A1C15]">{MODEL_INFO.dataset}</span>
          </p>
          <div className="w-1 h-1 bg-[#CCD6A6] rounded-full hidden md:block" />
          <p className="text-[10px] font-black uppercase tracking-widest text-[#6B7160]">
            Records: <span className="text-[#1A1C15]">{MODEL_INFO.datasetRows}</span>
          </p>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex bg-[#F7F5EE] p-2 rounded-[24px] border-2 border-[#E8EDD0] self-center sm:self-start overflow-x-auto no-scrollbar max-w-full mb-12">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-3 px-6 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === tab.id ? "bg-white text-[#1A1C15] shadow-md" : "text-[#6B7160] hover:text-[#1A1C15]"}`}
          >
            <tab.Icon size={16} className={activeTab === tab.id ? tab.color : "text-current"} strokeWidth={2.5} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Content */}
      <div className="space-y-12">
        {activeTab === "predictions" && (
          <div className="space-y-12">
            <section className="bg-white border-2 border-[#E8EDD0] rounded-[48px] p-8 sm:p-12 shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-[#FEE2E2] text-[#BA1A1A] rounded-xl flex items-center justify-center">
                  <Activity size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">Zone Classification</h3>
                  <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Heatmap of predicted requirements</p>
                </div>
              </div>
              
              <div className="overflow-x-auto no-scrollbar -mx-8 sm:-mx-12">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b-2 border-[#F7F5EE]">
                      <th className="px-8 sm:px-12 py-6 text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Zone</th>
                      <th className="px-6 py-6 text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Risk Profile</th>
                      <th className="px-6 py-6 text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Score</th>
                      <th className="px-6 py-6 text-[10px] font-black text-[#6B7160] uppercase tracking-widest text-center">Trend</th>
                      <th className="px-8 sm:px-12 py-6 text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Recommendation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((a) => {
                      const label = a.label ?? (a.score >= 70 ? "high" : a.score >= 45 ? "medium" : "low");
                      const style = RISK_STYLE[label];
                      return (
                        <tr key={a.id} className="border-b-2 border-[#F7F5EE] hover:bg-[#F7F5EE]/30 transition-colors group">
                          <td className="px-8 sm:px-12 py-6">
                            <p className="text-[15px] font-black text-[#1A1C15] group-hover:text-[#4D5A2C] transition-colors">{a.area}</p>
                            <p className="text-[11px] font-bold text-[#6B7160] uppercase tracking-widest">{a.category}</p>
                          </td>
                          <td className="px-6 py-6">
                            <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${style.bg} ${style.color} border-2 ${style.border}`}>
                              {label}
                            </span>
                          </td>
                          <td className="px-6 py-6">
                            <div className="flex items-center gap-3">
                              <div className="w-24 h-2 bg-[#EEF3D2] rounded-full overflow-hidden">
                                <div 
                                  className={`h-full rounded-full transition-all duration-1000 ${a.score >= 70 ? "bg-[#BA1A1A]" : a.score >= 45 ? "bg-[#B45309]" : "bg-[#166534]"}`}
                                  style={{ width: `${a.score}%` }}
                                />
                              </div>
                              <span className="text-[13px] font-black text-[#1A1C15]">{a.score}</span>
                            </div>
                          </td>
                          <td className={`px-6 py-6 text-center text-xs font-black ${a.trend.startsWith("+") ? "text-[#BA1A1A]" : "text-[#166534]"}`}>
                            {a.trend}
                          </td>
                          <td className="px-8 sm:px-12 py-6">
                            <p className="text-[13px] font-bold text-[#1A1C15] line-clamp-1 group-hover:line-clamp-none transition-all">{a.recommendedAction}</p>
                            <p className="text-[11px] font-medium text-[#6B7160] mt-1 italic">{a.outlook}</p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </section>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <section className="bg-white border-2 border-[#E8EDD0] rounded-[48px] p-10 shadow-sm flex flex-col">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 bg-[#EEF3D2] text-[#4D5A2C] rounded-xl flex items-center justify-center">
                    <BarChart3 size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">Feature Weights</h3>
                    <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Indicator importance ranking</p>
                  </div>
                </div>
                <div className="h-[300px]">
                  <Plot
                    data={[{
                      type:"bar", orientation:"h",
                      x: FEATURE_IMPORTANCE.map(f => f.importance),
                      y: FEATURE_IMPORTANCE.map(f => f.feature),
                      marker:{ color: FEATURE_IMPORTANCE.map(f => f.color), radius: 8 },
                      text: FEATURE_IMPORTANCE.map(f => `${(f.importance*100).toFixed(0)}%`),
                      textposition:"outside",
                    }]}
                    layout={{
                      margin:{ l:140, r:40, t:10, b:30 },
                      paper_bgcolor:"transparent", plot_bgcolor:"transparent",
                      xaxis:{ showgrid:false, zeroline:false, tickformat:".0%", range:[0,0.35], tickfont:{size:10, color:'#6B7160'} },
                      yaxis:{ automargin:true, tickfont:{ size:11, font:'Inter', weight:900, color:'#1A1C15' } },
                      font:{ family:"Inter, sans-serif", size:11 },
                    }}
                    config={{ displayModeBar:false, responsive:true }}
                    style={{ width:"100%", height:"100%" }}
                  />
                </div>
              </section>

              <section className="bg-white border-2 border-[#E8EDD0] rounded-[48px] p-10 shadow-sm flex flex-col">
                <div className="flex items-center gap-3 mb-10">
                  <div className="w-10 h-10 bg-[#EEF3D2] text-[#4D5A2C] rounded-xl flex items-center justify-center">
                    <Binary size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">Confidence Matrix</h3>
                    <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Actual vs Predicted validation</p>
                  </div>
                </div>
                <div className="h-[300px]">
                  <Plot
                    data={[{
                      type:"heatmap",
                      z: CONFUSION_MATRIX.matrix,
                      x: CONFUSION_MATRIX.labels,
                      y: CONFUSION_MATRIX.labels,
                      colorscale:[["0","#F7F5EE"],["1","#4D5A2C"]],
                      showscale:false,
                      text: CONFUSION_MATRIX.matrix.map(r => r.map(String)),
                      texttemplate:"%{text}",
                      textfont:{ size:16, color:"white", weight:900 },
                    }]}
                    layout={{
                      margin:{ l:80, r:20, t:10, b:50 },
                      paper_bgcolor:"transparent", plot_bgcolor:"transparent",
                      xaxis:{ title:"Predicted", tickfont:{ size:11, weight:900 }, gridcolor:'transparent' },
                      yaxis:{ title:"Actual", tickfont:{ size:11, weight:900 }, gridcolor:'transparent' },
                      font:{ family:"Inter, sans-serif", size:11 },
                    }}
                    config={{ displayModeBar:false, responsive:true }}
                    style={{ width:"100%", height:"100%" }}
                  />
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === "model" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <section className="bg-white border-2 border-[#E8EDD0] rounded-[48px] p-10 shadow-sm">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-[#EEF3D2] text-[#4D5A2C] rounded-xl flex items-center justify-center">
                  <Brain size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">Core Architecture</h3>
                  <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Model technical specifications</p>
                </div>
              </div>
              <div className="space-y-4">
                {[
                  ["Algorithm",        MODEL_INFO.algorithm],
                  ["Engine Version",   MODEL_INFO.version],
                  ["Estimators",       String(MODEL_INFO.nEstimators)],
                  ["Max Depth",        String(MODEL_INFO.maxDepth)],
                  ["Validation",       MODEL_INFO.crossValidation],
                  ["Input Features",   String(MODEL_INFO.features)],
                  ["Target Classes",   MODEL_INFO.classes.join(", ")],
                  ["Training Basis",   MODEL_INFO.trainedOn],
                ].map(([k,v]) => (
                  <div key={k} className="flex justify-between items-center py-4 border-b-2 border-[#F7F5EE] last:border-0 group cursor-default">
                    <span className="text-[13px] font-black text-[#6B7160] group-hover:text-[#4D5A2C] transition-colors">{k}</span>
                    <span className="text-[14px] font-black text-[#1A1C15]">{v}</span>
                  </div>
                ))}
              </div>
            </section>

            <section className="bg-[#1A1C15] rounded-[48px] p-10 shadow-xl text-white">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center">
                  <Target size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Validation Metrics</h3>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Benchmarked performance scores</p>
                </div>
              </div>
              <div className="space-y-8">
                {[
                  { label:"Accuracy",  val:MODEL_INFO.accuracy, color:"bg-emerald-500" },
                  { label:"Precision", val:MODEL_INFO.precision, color:"bg-sky-500" },
                  { label:"Recall",    val:MODEL_INFO.recall,    color:"bg-indigo-500" },
                  { label:"F1 Score",  val:MODEL_INFO.f1,        color:"bg-amber-500" },
                  { label:"AUC-ROC",   val:MODEL_INFO.auc*100,   color:"bg-rose-500" },
                ].map(({ label, val, color }) => (
                  <div key={label}>
                    <div className="flex justify-between items-center mb-3">
                      <span className="text-[13px] font-black uppercase tracking-widest text-white/60">{label}</span>
                      <span className="text-2xl font-black">{val}%</span>
                    </div>
                    <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-1000 ${color}`} style={{ width: `${val}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        )}

        {activeTab === "calendar" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <section className="bg-white border-2 border-[#E8EDD0] rounded-[48px] p-10 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-[#DBEAFE] text-[#1D4ED8] rounded-xl flex items-center justify-center">
                  <Calendar size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">Deployment Window</h3>
                  <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Predicted operational timeline</p>
                </div>
              </div>
              <div className="flex-1">
                <MiniCalendar events={UPCOMING_EVENTS}/>
              </div>
            </section>

            <section className="bg-white border-2 border-[#E8EDD0] rounded-[48px] p-10 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-10">
                <div className="w-10 h-10 bg-[#DBEAFE] text-[#1D4ED8] rounded-xl flex items-center justify-center">
                  <Clock size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">Timeline Feed</h3>
                  <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Chronological intervention steps</p>
                </div>
              </div>
              <div className="space-y-4 h-[460px] overflow-y-auto no-scrollbar pr-2">
                {UPCOMING_EVENTS.sort((a,b) => a.date.localeCompare(b.date)).map(e => {
                  const label = e.priority;
                  const style = RISK_STYLE[label];
                  return (
                    <div key={e.id} className="group p-6 bg-[#F7F5EE] border-2 border-transparent hover:border-[#1D4ED8] rounded-[32px] transition-all flex gap-6 items-start">
                      <div className="text-center w-16 flex-shrink-0">
                        <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest mb-1">{new Date(e.date).toLocaleString("en",{month:"short"})}</p>
                        <p className="text-3xl font-black text-[#1A1C15]">{new Date(e.date).getDate()}</p>
                      </div>
                      <div className="flex-1">
                        <h5 className="text-[15px] font-black text-[#1A1C15] mb-1 group-hover:text-[#1D4ED8] transition-colors">{e.title}</h5>
                        <p className="text-[11px] font-bold text-[#6B7160] mb-3">{e.area}</p>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${style.bg} ${style.color} border ${style.border}`}>
                            {label} Priority
                          </span>
                          <div className="w-2 h-2 rounded-full" style={{ background: EVENT_COLOR[e.type] }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
