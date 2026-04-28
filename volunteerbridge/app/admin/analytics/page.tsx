"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Plot from "@/components/admin/PlotlyChart";
import { apiClient } from "@/lib/api/client";
import {
  needCategoryAnalytics,
  volunteerDeploymentStats,
  ngoActivityLevels,
  predictedAreas,
  roleBreakdown,
} from "@/lib/mock/admin";
import { Download, RefreshCw, TrendingUp, Users, ShieldCheck, AlertTriangle, ChevronRight, PieChart, Activity, Layers, Brain } from "lucide-react";

// ── Colour palette ────────────────────────────────────────────
const OLV   = "#4D5A2C";
const OLV2  = "#647A39";
const CREAM = "#D4DCA8";
const ERR   = "#BA1A1A";
const AMB   = "#B45309";
const GRN   = "#166534";
const PLOTLY_COLORS = [OLV, OLV2, CREAM, "#C4A35A", "#6B8CBA", "#A06B7C"];

const layout = (title: string, extra: object = {}) => ({
  title: { text: title, font: { family: "Inter, sans-serif", size: 14, color: "#1A1C15", weight: 900 } },
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor:  "rgba(0,0,0,0)",
  font: { family: "Inter, sans-serif", size: 11, color: "#6B7160" },
  margin: { t: 40, r: 24, b: 60, l: 48 },
  showlegend: true,
  legend: { orientation: "h" as const, y: -0.3, x: 0 },
  ...extra,
});

const cfg = { displayModeBar: false, responsive: true };

export default function AnalyticsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview"|"volunteers"|"ngo"|"risk">("overview");
  const [refreshing, setRefreshing] = useState(false);
  const [liveMetrics, setLiveMetrics] = useState<any>(null);
  const [analytics, setAnalytics] = useState({
    needCategoryAnalytics,
    volunteerDeploymentStats,
    ngoActivityLevels,
    predictedAreas,
    roleBreakdown,
  });

  useEffect(() => {
    Promise.all([
      apiClient.getAnalytics(),
      apiClient.getPredictions(),
      apiClient.getDashboardStats(),
    ]).then(([dbAnalytics, dbPredictions, dbStats]) => {
      if (dbStats) setLiveMetrics(dbStats.metrics);
      setAnalytics((current) => ({
        needCategoryAnalytics: dbAnalytics.needCategoryAnalytics ?? current.needCategoryAnalytics,
        volunteerDeploymentStats: dbAnalytics.volunteerDeploymentStats ?? current.volunteerDeploymentStats,
        ngoActivityLevels: dbAnalytics.ngoActivityLevels ?? current.ngoActivityLevels,
        roleBreakdown: dbAnalytics.roleBreakdown ?? current.roleBreakdown,
        predictedAreas: dbPredictions.length ? dbPredictions : current.predictedAreas,
      }));
    }).catch(console.error);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 1200);
  };

  // ── Derived data ──────────────────────────────────────────
  const months = ["Nov", "Dec", "Jan", "Feb", "Mar", "Apr"];
  const citizenGrowth  = [280, 310, 345, 375, 410, 436];
  const volunteerGrowth= [480, 530, 580, 630, 678, 705];
  const ngoGrowth      = [60,  65,  70,  74,  80,  84];

  const zones  = analytics.volunteerDeploymentStats.map(d => d.zone);
  const dep    = analytics.volunteerDeploymentStats.map(d => d.deployed);
  const tgt    = analytics.volunteerDeploymentStats.map(d => d.target);
  const gap    = analytics.volunteerDeploymentStats.map(d => d.target - d.deployed);

  const cats   = analytics.needCategoryAnalytics.map(d => d.category);
  const needs  = analytics.needCategoryAnalytics.map(d => d.needs);

  const scatter3d = analytics.predictedAreas.map((a, i) => ({
    x: a.score,
    y: 20 + i * 14,
    z: 80 + i * 55,
    name: a.area,
  }));

  const tabs = [
    { id: "overview",   label: "Overview",   Icon: TrendingUp,   color: "text-[#4D5A2C]", bg: "bg-[#EEF3D2]" },
    { id: "volunteers", label: "Volunteers", Icon: Users,        color: "text-[#166534]", bg: "bg-[#DCFCE7]" },
    { id: "ngo",        label: "NGO Network", Icon: ShieldCheck,  color: "text-[#B45309]", bg: "bg-[#FEF3C7]" },
    { id: "risk",       label: "Risk AI",    Icon: AlertTriangle, color: "text-[#BA1A1A]", bg: "bg-[#FEE2E2]" },
  ] as const;

  return (
    <div className="page-stack max-w-[1440px] mx-auto">
      {/* Header Section */}
      <section className="flex flex-col xl:flex-row justify-between items-center gap-8 mb-12">
        <div className="max-w-3xl w-full text-center xl:text-left">
          <h1 className="text-3xl sm:text-4xl font-black text-[#1A1C15] tracking-tight leading-[1.1] mb-3">
            Operational Intelligence
          </h1>
          <p className="text-base sm:text-lg font-medium text-[#6B7160] leading-relaxed">
            Real-time analytics and predictive modeling for community impact tracking.
          </p>
        </div>
        
        <div className="flex flex-wrap gap-3 w-full xl:w-auto justify-center xl:justify-end">
          <button 
            onClick={handleRefresh}
            className="flex-1 xl:flex-none px-6 py-4 bg-white border-2 border-[#E8EDD0] text-[#4D5A2C] font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#F7F5EE] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <RefreshCw size={16} strokeWidth={2.5} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Updating..." : "Refresh Feed"}
          </button>
          <button 
            onClick={() => alert("PDF export triggered.")}
            className="flex-1 xl:flex-none px-8 py-4 bg-[#4D5A2C] text-white font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-[#647A39] transition-all flex items-center justify-center gap-2 shadow-sm"
          >
            <Download size={18} strokeWidth={2.5} /> Export Report
          </button>
        </div>
      </section>

      {/* KPI Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        {[
          { label: "Total Users",   val: liveMetrics ? String(liveMetrics.totalUsers) : "—", sub: "Platform scale", Icon: Users, color: "text-[#4D5A2C]", bg: "bg-[#EEF3D2]" },
          { label: "Volunteers",    val: liveMetrics ? String(liveMetrics.totalVolunteers) : "—", sub: "Operational-ready", Icon: Activity, color: "text-[#166534]", bg: "bg-[#DCFCE7]" },
          { label: "NGO Coverage",  val: liveMetrics ? String(liveMetrics.totalNgos) : "—", sub: `${liveMetrics?.pendingNgoApprovals ?? "—"} in pipeline`, Icon: ShieldCheck, color: "text-[#B45309]", bg: "bg-[#FEF3C7]" },
          { label: "Risk Zones",    val: String(analytics.predictedAreas.filter((a: any) => (a.score ?? 0) >= 70).length), sub: "AI high-intensity", Icon: AlertTriangle, color: "text-[#BA1A1A]", bg: "bg-[#FEE2E2]" },
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

      {/* Main Analysis Area */}
      <div className="space-y-8">
        {/* ── OVERVIEW ── */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border-2 border-[#E8EDD0] rounded-[48px] p-10 shadow-sm flex flex-col lg:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#EEF3D2] text-[#4D5A2C] rounded-xl flex items-center justify-center">
                  <TrendingUp size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">Growth Velocity</h3>
                  <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Rolling 6-month trajectory</p>
                </div>
              </div>
              <div className="h-[400px]">
                <Plot
                  data={[
                    { x: months, y: citizenGrowth,   mode:"lines+markers", name:"Citizens",   line:{ color:OLV,  width:4, shape: 'spline' }, marker:{ size:8, borderwidth:2, line:{color:'white'} } },
                    { x: months, y: volunteerGrowth, mode:"lines+markers", name:"Volunteers", line:{ color:OLV2, width:4, shape: 'spline' }, marker:{ size:8, borderwidth:2, line:{color:'white'} } },
                    { x: months, y: ngoGrowth.map(n=>n*5), mode:"lines+markers", name:"NGO Activity",  line:{ color:AMB,  width:2, dash:"dot" }, marker:{ size:6 } },
                  ]}
                  layout={layout("", { xaxis:{ gridcolor:"#F0F3E0" }, yaxis:{ gridcolor:"#F0F3E0" } })}
                  config={cfg}
                  style={{ width:"100%", height:"100%" }}
                />
              </div>
            </div>

            <div className="bg-white border-2 border-[#E8EDD0] rounded-[48px] p-10 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#EEF3D2] text-[#4D5A2C] rounded-xl flex items-center justify-center">
                  <PieChart size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">Need Distribution</h3>
                  <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Category-wise demand</p>
                </div>
              </div>
              <div className="h-[320px]">
                <Plot
                  data={[{ type:"pie", labels:cats, values:needs, hole:0.6,
                    marker:{ colors:PLOTLY_COLORS },
                    textinfo:"label+percent", insidetextorientation:"radial" }]}
                  layout={layout("", { showlegend:false, margin:{ t:10, r:10, b:10, l:10 } })}
                  config={cfg}
                  style={{ width:"100%", height:"100%" }}
                />
              </div>
            </div>

            <div className="bg-white border-2 border-[#E8EDD0] rounded-[48px] p-10 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#EEF3D2] text-[#4D5A2C] rounded-xl flex items-center justify-center">
                  <Layers size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">Access Control</h3>
                  <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Active vs Pending states</p>
                </div>
              </div>
              <div className="h-[320px]">
                <Plot
                  data={[
                    { type:"bar", name:"Active",  x:analytics.roleBreakdown.map(r=>r.role), y:analytics.roleBreakdown.map(r=>r.active),  marker:{ color:OLV, radius: 8 }, text:analytics.roleBreakdown.map(r=>String(r.active)),  textposition:"outside" },
                    { type:"bar", name:"Pending", x:analytics.roleBreakdown.map(r=>r.role), y:analytics.roleBreakdown.map(r=>r.pending), marker:{ color:AMB, radius: 8 }, text:analytics.roleBreakdown.map(r=>String(r.pending)), textposition:"outside" },
                  ]}
                  layout={layout("", { barmode:"group", xaxis:{ gridcolor:"transparent" }, yaxis:{ gridcolor:"#F0F3E0" } })}
                  config={cfg}
                  style={{ width:"100%", height:"100%" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── VOLUNTEERS ── */}
        {activeTab === "volunteers" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border-2 border-[#E8EDD0] rounded-[48px] p-10 shadow-sm flex flex-col lg:col-span-2">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#DCFCE7] text-[#166534] rounded-xl flex items-center justify-center">
                    <Activity size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">Zone Utilization</h3>
                    <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Deployed vs target capacity</p>
                  </div>
                </div>
                <button onClick={() => router.push("/admin/users")} className="px-6 py-2 bg-[#F7F5EE] border-2 border-[#E8EDD0] text-[#4D5A2C] font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#EEF3D2] transition-all flex items-center gap-2">
                  Directory Access <ChevronRight size={14} />
                </button>
              </div>
              <div className="h-[360px]">
                <Plot
                  data={[
                    { type:"bar", name:"Deployed", x:zones, y:dep, marker:{ color:OLV, radius: 10 }, text:dep.map(String),  textposition:"outside" },
                    { type:"bar", name:"Target Capacity",   x:zones, y:tgt, marker:{ color:CREAM, radius: 10 }, text:tgt.map(String), textposition:"outside" },
                  ]}
                  layout={layout("", { barmode:"group", xaxis:{ gridcolor:"transparent" }, yaxis:{ gridcolor:"#F0F3E0" } })}
                  config={cfg}
                  style={{ width:"100%", height:"100%" }}
                />
              </div>
            </div>

            <div className="bg-white border-2 border-[#E8EDD0] rounded-[48px] p-10 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#DCFCE7] text-[#166534] rounded-xl flex items-center justify-center">
                  <AlertTriangle size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">Coverage Gap</h3>
                  <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Personnel requirement funnel</p>
                </div>
              </div>
              <div className="h-[320px]">
                <Plot
                  data={[{ type:"funnel", y:zones, x:gap, marker:{ color:gap.map(g => g > 15 ? ERR : g > 8 ? AMB : GRN) }, textinfo:"value+percent initial" }]}
                  layout={layout("", { margin:{ t:20, r:60, b:20, l:80 } })}
                  config={cfg}
                  style={{ width:"100%", height:"100%" }}
                />
              </div>
            </div>

            <div className="bg-white border-2 border-[#E8EDD0] rounded-[48px] p-10 shadow-sm flex flex-col">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-[#DCFCE7] text-[#166534] rounded-xl flex items-center justify-center">
                  <Activity size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">Ready States</h3>
                  <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Skill readiness matrix</p>
                </div>
              </div>
              <div className="h-[320px]">
                <Plot
                  data={[{
                    type:"scatterpolar", fill:"toself", name:"Active Ready",
                    r:[78, 65, 82, 55, 70, 78], theta:["Food","Health","Shelter","Education","Safety","Food"],
                    line:{ color:OLV, width:3 }, fillcolor: OLV + "44",
                  }]}
                  layout={layout("", { polar:{ radialaxis:{ visible:true, range:[0,100], gridcolor: "#F0F3E0" } }, margin:{ t:20, r:30, b:20, l:30 } })}
                  config={cfg}
                  style={{ width:"100%", height:"100%" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── NGO ── */}
        {activeTab === "ngo" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-white border-2 border-[#E8EDD0] rounded-[48px] p-10 shadow-sm flex flex-col lg:col-span-2">
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#FEF3C7] text-[#B45309] rounded-xl flex items-center justify-center">
                    <ShieldCheck size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-[#1A1C15] tracking-tight">Partner Performance</h3>
                    <p className="text-[10px] font-black text-[#6B7160] uppercase tracking-widest">Completed vs Active engagement</p>
                  </div>
                </div>
                <button onClick={() => router.push("/admin/ngo-approvals")} className="px-6 py-2 bg-[#F7F5EE] border-2 border-[#E8EDD0] text-[#4D5A2C] font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#EEF3D2] transition-all flex items-center gap-2">
                  Registry Queue <ChevronRight size={14} />
                </button>
              </div>
              <div className="h-[360px]">
                <Plot
                  data={[
                    { type:"bar", name:"Completed Tasks", x:analytics.ngoActivityLevels.map(n=>n.ngo), y:analytics.ngoActivityLevels.map(n=>n.tasksCompleted), marker:{ color:GRN } },
                    { type:"bar", name:"Pending Engagement",x:analytics.ngoActivityLevels.map(n=>n.ngo), y:analytics.ngoActivityLevels.map(n=>n.activeRequests),  marker:{ color:AMB } },
                  ]}
                  layout={layout("", { barmode:"group", xaxis:{ gridcolor:"transparent" }, yaxis:{ gridcolor:"#F0F3E0" } })}
                  config={cfg}
                  style={{ width:"100%", height:"100%" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ── RISK AI ── */}
        {activeTab === "risk" && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="bg-[#1A1C15] border-2 border-transparent rounded-[48px] p-10 shadow-xl flex flex-col lg:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 bg-white/10 text-white rounded-xl flex items-center justify-center">
                  <Brain size={20} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">AI Risk Intelligence</h3>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">3D Crisis Matrix Correlation</p>
                </div>
              </div>
              <div className="h-[520px]">
                <Plot
                  data={[{
                    type: "scatter3d",
                    mode: "markers+text",
                    name: "Risk Clusters",
                    x: scatter3d.map(d => d.x),
                    y: scatter3d.map(d => d.y),
                    z: scatter3d.map(d => d.z),
                    text: scatter3d.map(d => d.name),
                    textposition: "top center",
                    marker: {
                      size: scatter3d.map(d => d.x / 6),
                      color: scatter3d.map(d => d.x),
                      colorscale: [
                        [0,   "#EEF3D2"],
                        [0.5, "#B45309"],
                        [1,   "#BA1A1A"],
                      ],
                      colorbar: { title:{text:"Score", font:{color:'white'}}, len:0.5, tickfont:{color:'white'} },
                      opacity: 0.9,
                      line: { color:"rgba(255,255,255,0.2)", width:1 },
                    },
                    hovertemplate: "<b>%{text}</b><br>Risk: %{x}<br>Volunteers: %{y}<br>Beneficiaries: %{z}<extra></extra>",
                  }]}
                  layout={{
                    ...layout(""),
                    paper_bgcolor: "transparent",
                    font: { color: "white" },
                    scene: {
                      xaxis:{ title:{text:"Risk Score", font:{color:'white'}},  gridcolor:"rgba(255,255,255,0.1)", backgroundcolor:"transparent", showbackground:false, tickfont:{color:'white'} },
                      yaxis:{ title:{text:"Personnel", font:{color:'white'}},  gridcolor:"rgba(255,255,255,0.1)", backgroundcolor:"transparent", showbackground:false, tickfont:{color:'white'} },
                      zaxis:{ title:{text:"Beneficiaries", font:{color:'white'}},gridcolor:"rgba(255,255,255,0.1)",backgroundcolor:"transparent", showbackground:false, tickfont:{color:'white'} },
                      camera:{ eye:{ x:1.8, y:1.8, z:1.2 } },
                    },
                    margin:{ t:0, r:0, b:0, l:0 },
                  }}
                  config={{ ...cfg, displayModeBar: true }}
                  style={{ width:"100%", height:"100%" }}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

