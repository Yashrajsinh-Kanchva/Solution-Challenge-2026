// Model metadata and mock predictions for the AI predictions page

export const MODEL_INFO = {
  name: "Random Forest Classifier",
  version: "v2.1.4",
  dataset: "humanitarian_risk_dataset.csv",
  datasetRows: 44,
  datasetSource: "OCHA HDX + WFP Open Data",
  trainedOn: "2026-04-01",
  accuracy: 91.3,
  precision: 91.2,
  recall: 89.7,
  f1: 90.3,
  auc: 0.957,
  features: 10,
  classes: ["high", "medium", "low"],
  algorithm: "Random Forest",
  nEstimators: 100,
  maxDepth: 8,
  crossValidation: "5-fold",
};

export const FEATURE_IMPORTANCE = [
  { feature: "prior_requests",        importance: 0.28, color: "#ef4444" },
  { feature: "shelter_occupancy_pct", importance: 0.22, color: "#f97316" },
  { feature: "poverty_index",         importance: 0.19, color: "#eab308" },
  { feature: "ngo_response_hrs",      importance: 0.13, color: "#59623c" },
  { feature: "population_density",    importance: 0.09, color: "#22c55e" },
  { feature: "volunteers_available",  importance: 0.05, color: "#3b82f6" },
  { feature: "rainfall_mm",           importance: 0.04, color: "#8b5cf6" },
];

export const CONFUSION_MATRIX = {
  labels: ["High", "Medium", "Low"],
  matrix: [
    [18, 1, 0],
    [1,  9, 1],
    [0,  0, 6],
  ],
};

export const PREDICTED_AREAS = [
  { id:"p1", area:"Ward 12",        category:"Food",      score:95, label:"high",   trend:"+4",  recommendedAction:"Deploy 3 food NGOs immediately",    outlook:"Worsening — monsoon gap + demand spike" },
  { id:"p2", area:"Industrial Edge",category:"Shelter",   score:91, label:"high",   trend:"+7",  recommendedAction:"Emergency shelter kits needed",      outlook:"Critical — 98% shelter occupancy" },
  { id:"p3", area:"River Belt",     category:"Health",    score:85, label:"high",   trend:"+3",  recommendedAction:"Medical team dispatch in 24h",        outlook:"Worsening — outbreak indicators rising" },
  { id:"p4", area:"East Campus",    category:"Food",      score:70, label:"high",   trend:"+5",  recommendedAction:"Pre-position food stocks",            outlook:"Rising — weekly demand increasing" },
  { id:"p5", area:"North Campus",   category:"Education", score:58, label:"medium", trend:"+2",  recommendedAction:"Monitor — assign education NGO",      outlook:"Stable but watch monsoon impact" },
  { id:"p6", area:"West Campus",    category:"Health",    score:54, label:"medium", trend:"−1",  recommendedAction:"Routine health check scheduled",      outlook:"Stable — response times improving" },
  { id:"p7", area:"Transit Block",  category:"Safety",    score:44, label:"low",    trend:"−3",  recommendedAction:"No immediate action needed",           outlook:"Improving — patrol coverage adequate" },
  { id:"p8", area:"South Campus",   category:"Employment",score:36, label:"low",    trend:"−2",  recommendedAction:"Queue for next-cycle review",          outlook:"Low risk — stable employment metrics" },
];

export const UPCOMING_EVENTS = [
  { id:"e1",  date:"2026-04-26", title:"Food Distribution – Ward 12",        type:"deployment", area:"Ward 12",         priority:"high"   },
  { id:"e2",  date:"2026-04-27", title:"Medical Camp – River Belt",           type:"health",     area:"River Belt",      priority:"high"   },
  { id:"e3",  date:"2026-04-28", title:"Shelter Audit – Industrial Edge",     type:"audit",      area:"Industrial Edge", priority:"high"   },
  { id:"e4",  date:"2026-04-29", title:"Volunteer Briefing – All Areas",      type:"training",   area:"All Zones",       priority:"medium" },
  { id:"e5",  date:"2026-04-30", title:"NGO Coordination Meeting",            type:"meeting",    area:"Command Center",  priority:"medium" },
  { id:"e6",  date:"2026-05-02", title:"East Campus Food Stock Pre-position", type:"deployment", area:"East Campus",     priority:"high"   },
  { id:"e7",  date:"2026-05-04", title:"Weekly Risk Model Re-train",          type:"model",      area:"AI Lab",          priority:"medium" },
  { id:"e8",  date:"2026-05-05", title:"North Campus Education Drive",        type:"education",  area:"North Campus",    priority:"medium" },
  { id:"e9",  date:"2026-05-07", title:"Monthly Admin Review",                type:"meeting",    area:"Admin",           priority:"low"    },
  { id:"e10", date:"2026-05-10", title:"Dataset Refresh + Model Validation",  type:"model",      area:"AI Lab",          priority:"medium" },
  { id:"e11", date:"2026-05-12", title:"Transit Block Safety Patrol",         type:"safety",     area:"Transit Block",   priority:"low"    },
  { id:"e12", date:"2026-05-15", title:"Quarterly Impact Report",             type:"meeting",    area:"Admin",           priority:"medium" },
];
