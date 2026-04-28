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
import { Download, RefreshCw, Filter, TrendingUp, Users, ShieldCheck, AlertTriangle } from "lucide-react";

// ── Colour palette ────────────────────────────────────────────
const OLV   = "#59623c";
const OLV2  = "#8a9460";
const CREAM = "#dce4b8";
const ERR   = "#ba1a1a";
const AMB   = "#b45309";
const GRN   = "#2e7d32";
const PLOTLY_COLORS = [OLV, OLV2, CREAM, "#c4a35a", "#6b8cba", "#a06b7c"];

const layout = (title: string, extra: object = {}) => ({
  title: { text: title, font: { family: "'Public Sans', sans-serif", size: 13, color: "#1c1c18", weight: 700 } },
  paper_bgcolor: "rgba(0,0,0,0)",
  plot_bgcolor:  "rgba(0,0,0,0)",
  font: { family: "'Public Sans', sans-serif", size: 11, color: "#46483e" },
  margin: { t: 40, r: 16, b: 40, l: 44 },
  showlegend: true,
  legend: { orientation: "h" as const, y: -0.22, x: 0 },
  ...extra,
});

const cfg = { displayModeBar: false, responsive: true };

export default function AnalyticsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"overview"|"volunteers"|"ngo"|"risk">("overview");
  const [refreshing, setRefreshing] = useState(false);
  // Live KPI metrics from DB
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

  // 3D scatter data — score vs volunteers assigned vs beneficiaries
  const scatter3d = analytics.predictedAreas.map((a, i) => ({
    x: a.score,
    y: 20 + i * 14,        // simulated volunteers assigned
    z: 80 + i * 55,        // simulated beneficiaries
    name: a.area,
  }));

  const tabs = [
    { id: "overview",   label: "Overview",   Icon: TrendingUp   },
    { id: "volunteers", label: "Volunteers", Icon: Users        },
    { id: "ngo",        label: "NGO",        Icon: ShieldCheck  },
    { id: "risk",       label: "Risk AI",    Icon: AlertTriangle},
  ] as const;

  return (
    <div className="page-stack">

      {/* Header */}
      <section className="page-header">
        <div>
          <p className="page-header__eyebrow">Feature 3</p>
          <h2>Analysis Dashboard</h2>
          <p>Visualize where needs are rising, how volunteers are deployed, and which NGOs are most active.</p>
        </div>
        <div style={{ display:"flex", gap:"0.75rem", flexWrap:"wrap" }}>
          <button
            onClick={handleRefresh}
            className="ghost-button"
            style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
          <button
            onClick={() => { const el=document.getElementById("analytics-export"); el && el.click(); }}
            className="primary-button"
            style={{ display:"flex", alignItems:"center", gap:"0.4rem" }}
          >
            <Download size={14} />
            Export PDF
          </button>
          {/* hidden anchor for download simulation */}
          <a id="analytics-export" href="#" style={{ display:"none" }}
            onClick={e => { e.preventDefault(); alert("PDF export triggered — connect to real export logic."); }}>
          </a>
        </div>
      </section>

      {/* KPI row */}
      <div className="metric-grid">
        {[
          { label:"Total Users",   val: liveMetrics ? String(liveMetrics.totalUsers)      : "—", sub:"All roles",                Icon: Users,        color: OLV  },
          { label:"Volunteers",    val: liveMetrics ? String(liveMetrics.totalVolunteers)  : "—", sub:"Registered",             Icon: Users,        color: OLV2 },
          { label:"Approved NGOs", val: liveMetrics ? String(liveMetrics.totalNgos)        : "—", sub:`${liveMetrics?.pendingNgoApprovals ?? "—"} pending review`, Icon: ShieldCheck, color: AMB  },
          { label:"Risk Areas",    val: String(analytics.predictedAreas.filter((a: any) => (a.score ?? 0) >= 70).length), sub:"AI-predicted zones", Icon: AlertTriangle, color: ERR },
        ].map(({ label, val, sub, Icon, color }) => (
          <div key={label} className="metric-card">
            <div className="metric-card__meta">
              <p>{label}</p>
              <h3>{val}</h3>
              <span>{sub}</span>
            </div>
            <div className="metric-card__icon" style={{ background: color + "22", color }}>
              <Icon size={20} strokeWidth={2} />
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="tab-row">
        {tabs.map(({ id, label, Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id)}
            className={`tab-button ${activeTab === id ? "active" : ""}`}
          >
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {activeTab === "overview" && (
        <>
          {/* User growth — line */}
          <div className="tool-surface">
            <div className="surface-header">
              <div className="section-copy">
                <p className="section-kicker">Platform Growth</p>
                <h3>User registration trends (last 6 months)</h3>
              </div>
            </div>
            <div style={{ height: 300 }}>
              <Plot
                data={[
                  { x: months, y: citizenGrowth,   mode:"lines+markers", name:"Citizens",   line:{ color:OLV,  width:3 }, marker:{ size:7 } },
                  { x: months, y: volunteerGrowth, mode:"lines+markers", name:"Volunteers", line:{ color:OLV2, width:3 }, marker:{ size:7 } },
                  { x: months, y: ngoGrowth.map(n=>n*5), mode:"lines+markers", name:"NGOs ×5",  line:{ color:AMB,  width:2, dash:"dot" }, marker:{ size:6 } },
                ]}
                layout={layout("", { xaxis:{ gridcolor:"#e8edca" }, yaxis:{ gridcolor:"#e8edca" } })}
                config={cfg}
                style={{ width:"100%", height:"100%" }}
              />
            </div>
          </div>

          {/* 2-col: Need donut + Role breakdown */}
          <div className="content-grid">
            <div className="tool-surface">
              <div className="section-copy" style={{ marginBottom:"1rem" }}>
                <p className="section-kicker">Community Needs</p>
                <h3>Category demand distribution</h3>
              </div>
              <div style={{ height:280 }}>
                <Plot
                  data={[{ type:"pie", labels:cats, values:needs, hole:0.45,
                    marker:{ colors:PLOTLY_COLORS },
                    textinfo:"label+percent", insidetextorientation:"radial" }]}
                  layout={layout("", { showlegend:false, margin:{ t:10, r:10, b:10, l:10 } })}
                  config={cfg}
                  style={{ width:"100%", height:"100%" }}
                />
              </div>
            </div>

            <div className="tool-surface">
              <div className="section-copy" style={{ marginBottom:"1rem" }}>
                <p className="section-kicker">User Roles</p>
                <h3>Role breakdown (active vs pending)</h3>
              </div>
              <div style={{ height:280 }}>
                <Plot
                  data={[
                    { type:"bar", name:"Active",  x:analytics.roleBreakdown.map(r=>r.role), y:analytics.roleBreakdown.map(r=>r.active),  marker:{ color:OLV  }, text:analytics.roleBreakdown.map(r=>String(r.active)),  textposition:"outside" },
                    { type:"bar", name:"Pending", x:analytics.roleBreakdown.map(r=>r.role), y:analytics.roleBreakdown.map(r=>r.pending), marker:{ color:AMB  }, text:analytics.roleBreakdown.map(r=>String(r.pending)), textposition:"outside" },
                  ]}
                  layout={layout("", { barmode:"group", xaxis:{ gridcolor:"transparent" }, yaxis:{ gridcolor:"#e8edca" } })}
                  config={cfg}
                  style={{ width:"100%", height:"100%" }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── VOLUNTEERS ── */}
      {activeTab === "volunteers" && (
        <>
          {/* Deployed vs Target grouped bar */}
          <div className="tool-surface">
            <div className="surface-header">
              <div className="section-copy">
                <p className="section-kicker">Volunteer Deployment</p>
                <h3>Deployed vs target coverage by zone</h3>
              </div>
              <button className="ghost-button" onClick={() => router.push("/admin/users")}>
                View All
              </button>
            </div>
            <div style={{ height:300 }}>
              <Plot
                data={[
                  { type:"bar", name:"Deployed", x:zones, y:dep, marker:{ color:OLV  }, text:dep.map(String),  textposition:"outside" },
                  { type:"bar", name:"Target",   x:zones, y:tgt, marker:{ color:CREAM }, text:tgt.map(String), textposition:"outside" },
                ]}
                layout={layout("", { barmode:"group", xaxis:{ gridcolor:"transparent" }, yaxis:{ gridcolor:"#e8edca" } })}
                config={cfg}
                style={{ width:"100%", height:"100%" }}
              />
            </div>
          </div>

          {/* Gap funnel */}
          <div className="content-grid">
            <div className="tool-surface">
              <div className="section-copy" style={{ marginBottom:"1rem" }}>
                <p className="section-kicker">Coverage Gap</p>
                <h3>Volunteers still needed per zone</h3>
              </div>
              <div style={{ height:280 }}>
                <Plot
                  data={[{ type:"funnel", y:zones, x:gap, marker:{ color:gap.map(g => g > 15 ? ERR : g > 8 ? AMB : GRN) }, textinfo:"value+percent initial" }]}
                  layout={layout("", { margin:{ t:20, r:60, b:20, l:80 } })}
                  config={cfg}
                  style={{ width:"100%", height:"100%" }}
                />
              </div>
            </div>

            {/* Volunteer activity radar */}
            <div className="tool-surface">
              <div className="section-copy" style={{ marginBottom:"1rem" }}>
                <p className="section-kicker">Skill Matrix</p>
                <h3>Volunteer readiness by category</h3>
              </div>
              <div style={{ height:280 }}>
                <Plot
                  data={[{
                    type:"scatterpolar", fill:"toself", name:"Active Volunteers",
                    r:[78, 65, 82, 55, 70, 78], theta:["Food","Health","Shelter","Education","Safety","Food"],
                    line:{ color:OLV }, fillcolor: OLV + "33",
                  }]}
                  layout={layout("", { polar:{ radialaxis:{ visible:true, range:[0,100] } }, margin:{ t:20, r:30, b:20, l:30 } })}
                  config={cfg}
                  style={{ width:"100%", height:"100%" }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── NGO ── */}
      {activeTab === "ngo" && (
        <>
          {/* NGO tasks vs requests */}
          <div className="tool-surface">
            <div className="surface-header">
              <div className="section-copy">
                <p className="section-kicker">NGO Activity</p>
                <h3>Tasks completed vs active requests</h3>
              </div>
              <button className="ghost-button" onClick={() => router.push("/admin/ngo-approvals")}>
                Approval Queue
              </button>
            </div>
            <div style={{ height:300 }}>
              <Plot
                data={[
                  { type:"bar", name:"Completed", x:analytics.ngoActivityLevels.map(n=>n.ngo), y:analytics.ngoActivityLevels.map(n=>n.tasksCompleted), marker:{ color:GRN  } },
                  { type:"bar", name:"Active Req",x:analytics.ngoActivityLevels.map(n=>n.ngo), y:analytics.ngoActivityLevels.map(n=>n.activeRequests),  marker:{ color:AMB  } },
                ]}
                layout={layout("", { barmode:"group", xaxis:{ gridcolor:"transparent" }, yaxis:{ gridcolor:"#e8edca" } })}
                config={cfg}
                style={{ width:"100%", height:"100%" }}
              />
            </div>
          </div>

          {/* NGO efficiency scatter */}
          <div className="tool-surface">
            <div className="surface-header">
              <div className="section-copy">
                <p className="section-kicker">Efficiency</p>
                <h3>NGO completion rate vs active requests (bubble = tasks)</h3>
              </div>
            </div>
            <div style={{ height:320 }}>
              <Plot
                data={[{
                  type:"scatter", mode:"markers", name:"NGOs",
                  x: analytics.ngoActivityLevels.map(n => n.activeRequests),
                  y: analytics.ngoActivityLevels.map(n => Math.round(n.tasksCompleted / (n.tasksCompleted + n.activeRequests) * 100)),
                  text: analytics.ngoActivityLevels.map(n => n.ngo),
                  marker:{ size: analytics.ngoActivityLevels.map(n => n.tasksCompleted / 3), color:PLOTLY_COLORS, opacity:0.85, line:{ color:"white", width:1.5 } },
                  hovertemplate:"<b>%{text}</b><br>Active: %{x}<br>Completion %: %{y}<extra></extra>",
                }]}
                layout={layout("", {
                  xaxis:{ title:"Active Requests", gridcolor:"#e8edca" },
                  yaxis:{ title:"Completion %", gridcolor:"#e8edca", range:[0,100] },
                })}
                config={cfg}
                style={{ width:"100%", height:"100%" }}
              />
            </div>
          </div>
        </>
      )}

      {/* ── RISK AI ── */}
      {activeTab === "risk" && (
        <>
          {/* 3D Scatter Matrix */}
          <div className="tool-surface">
            <div className="surface-header">
              <div className="section-copy">
                <p className="section-kicker">AI Risk Intelligence</p>
                <h3>3D scatter — Risk score · Volunteers assigned · Beneficiaries</h3>
              </div>
            </div>
            <div style={{ height: 460 }}>
              <Plot
                data={[{
                  type: "scatter3d",
                  mode: "markers+text",
                  name: "Risk Areas",
                  x: scatter3d.map(d => d.x),
                  y: scatter3d.map(d => d.y),
                  z: scatter3d.map(d => d.z),
                  text: scatter3d.map(d => d.name),
                  textposition: "top center",
                  marker: {
                    size: scatter3d.map(d => d.x / 8),
                    color: scatter3d.map(d => d.x),
                    colorscale: [
                      [0,   "#dce4b8"],
                      [0.5, AMB      ],
                      [1,   ERR      ],
                    ],
                    colorbar: { title:"Risk Score", len:0.5 },
                    opacity: 0.88,
                    line: { color:"white", width:1 },
                  },
                  hovertemplate: "<b>%{text}</b><br>Risk: %{x}<br>Volunteers: %{y}<br>Beneficiaries: %{z}<extra></extra>",
                }]}
                layout={{
                  ...layout(""),
                  scene: {
                    xaxis:{ title:"Risk Score",  gridcolor:"#ccd6a6", backgroundcolor:"#fcf9f3", showbackground:true },
                    yaxis:{ title:"Volunteers",  gridcolor:"#ccd6a6", backgroundcolor:"#f0eee8", showbackground:true },
                    zaxis:{ title:"Beneficiaries",gridcolor:"#ccd6a6",backgroundcolor:"#f6f3ed", showbackground:true },
                    camera:{ eye:{ x:1.6, y:1.6, z:0.8 } },
                  },
                  margin:{ t:20, r:20, b:20, l:20 },
                }}
                config={{ ...cfg, displayModeBar: true }}
                style={{ width:"100%", height:"100%" }}
              />
            </div>
          </div>

          {/* Risk area bar + heatmap */}
          <div className="content-grid">
            <div className="tool-surface">
              <div className="section-copy" style={{ marginBottom:"1rem" }}>
                <p className="section-kicker">Predicted Risk</p>
                <h3>Area risk scores</h3>
              </div>
              <div style={{ height:280 }}>
                <Plot
                  data={[{
                    type:"bar", orientation:"h",
                    x: analytics.predictedAreas.map(a=>a.score),
                    y: analytics.predictedAreas.map(a=>a.area),
                    text: analytics.predictedAreas.map(a=>`${a.score}/100`), textposition:"outside",
                    marker:{ color: analytics.predictedAreas.map(a => a.score > 88 ? ERR : a.score > 78 ? AMB : OLV) },
                  }]}
                  layout={layout("", { xaxis:{ range:[0,110], gridcolor:"#e8edca" }, yaxis:{ gridcolor:"transparent" }, margin:{ t:20,r:60,b:30,l:90 } })}
                  config={cfg}
                  style={{ width:"100%", height:"100%" }}
                />
              </div>
            </div>

            {/* Category heatmap over time */}
            <div className="tool-surface">
              <div className="section-copy" style={{ marginBottom:"1rem" }}>
                <p className="section-kicker">Needs Heatmap</p>
                <h3>Category intensity by week</h3>
              </div>
              <div style={{ height:280 }}>
                <Plot
                  data={[{
                    type:"heatmap",
                    z: [
                      [12,18,22,30,35,40],
                      [9, 14,17,20,24,28],
                      [5, 8, 11,13,16,20],
                      [4, 6,  8,10,11,14],
                      [3, 5,  6, 7, 9,12],
                      [6, 9, 10,12,15,18],
                    ],
                    x: ["W1","W2","W3","W4","W5","W6"],
                    y: cats,
                    colorscale:[["0","#dce4b8"],["0.5",AMB],["1",ERR]],
                    showscale:true,
                  }]}
                  layout={layout("", { margin:{ t:20, r:60, b:30, l:80 } })}
                  config={cfg}
                  style={{ width:"100%", height:"100%" }}
                />
              </div>
            </div>
          </div>

          {/* Predicted Areas summary */}
          <div className="tool-surface">
            <div className="surface-header">
              <div className="section-copy">
                <p className="section-kicker">Hotspot Summary</p>
                <h3>Top predicted intervention areas</h3>
              </div>
              <button className="primary-button" onClick={() => router.push("/admin/predictions")}>
                View Predictions
              </button>
            </div>
            <div className="list-stack">
              {analytics.predictedAreas.map((area) => (
                <div key={area.id} className="list-row">
                  <div>
                    <strong>{area.area}</strong>
                    <p>{area.recommendedAction}</p>
                  </div>
                  <div className="list-row__meta">
                    <span className={`status-badge ${area.score > 88 ? "status-badge--inactive" : area.score > 78 ? "status-badge--pending" : "status-badge--active"}`}>
                      {area.category}
                    </span>
                    <strong>{area.score}/100</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
