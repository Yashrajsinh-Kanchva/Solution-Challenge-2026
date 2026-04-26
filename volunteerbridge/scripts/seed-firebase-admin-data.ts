import "dotenv/config";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { initFirebaseAdmin } from "../lib/firebase/config";
import { getDatabase } from "firebase-admin/database";

type RiskRow = {
  week: number;
  area: string;
  category: string;
  prior_requests: number;
  ngo_response_hrs: number;
  poverty_index: number;
  population_density: number;
  rainfall_mm: number;
  shelter_occupancy_pct: number;
  volunteers_available: number;
  risk_score: number;
  label: "high" | "medium" | "low";
};

const today = "2026-04-26";
const areas: Record<string, { lat: number; lng: number; address: string }> = {
  "Ward 12": { lat: 23.028, lng: 72.575, address: "Ward 12" },
  "River Belt": { lat: 23.016, lng: 72.558, address: "River Belt" },
  "Industrial Edge": { lat: 23.038, lng: 72.589, address: "Industrial Edge" },
  "Transit Block": { lat: 23.011, lng: 72.566, address: "Transit Block" },
  "East Campus": { lat: 23.014, lng: 72.586, address: "East Campus" },
  "North Campus": { lat: 23.03, lng: 72.58, address: "North Campus" },
  "West Campus": { lat: 23.021, lng: 72.552, address: "West Campus" },
  "South Campus": { lat: 23.004, lng: 72.571, address: "South Campus" },
};

function parseCsv(path: string): RiskRow[] {
  const [headerLine, ...lines] = readFileSync(path, "utf8").trim().split(/\r?\n/);
  const headers = headerLine.split(",");

  return lines.map((line) => {
    const values = line.split(",");
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index]]));
    return {
      week: Number(row.week),
      area: row.area,
      category: row.category,
      prior_requests: Number(row.prior_requests),
      ngo_response_hrs: Number(row.ngo_response_hrs),
      poverty_index: Number(row.poverty_index),
      population_density: Number(row.population_density),
      rainfall_mm: Number(row.rainfall_mm),
      shelter_occupancy_pct: Number(row.shelter_occupancy_pct),
      volunteers_available: Number(row.volunteers_available),
      risk_score: Number(row.risk_score),
      label: row.label as RiskRow["label"],
    };
  });
}

function latestRowsByArea(rows: RiskRow[]) {
  const latest = new Map<string, RiskRow>();
  for (const row of rows) {
    const existing = latest.get(row.area);
    if (!existing || row.week > existing.week) latest.set(row.area, row);
  }
  return [...latest.values()].sort((a, b) => b.risk_score - a.risk_score);
}

function trendForArea(rows: RiskRow[], area: string) {
  const areaRows = rows.filter((row) => row.area === area).sort((a, b) => b.week - a.week);
  const [current, previous] = areaRows;
  if (!current || !previous) return "stable";
  if (current.risk_score > previous.risk_score) return "up";
  if (current.risk_score < previous.risk_score) return "down";
  return "stable";
}

function riskOutlook(row: RiskRow) {
  if (row.label === "high") return "Immediate intervention likely needed in the next 5 days.";
  if (row.label === "medium") return "Monitor closely and stage supplies for quick deployment.";
  return "Stable for now; keep routine watch active.";
}

function recommendedAction(row: RiskRow) {
  if (row.label === "high") return `Deploy ${row.category.toLowerCase()} support and add volunteer coverage within 24 hours.`;
  if (row.label === "medium") return `Prepare ${row.category.toLowerCase()} resources and review again after the next report cycle.`;
  return "No immediate escalation required.";
}

function buildSeedData(rows: RiskRow[]) {
  const latest = latestRowsByArea(rows);
  const categories = ["Food", "Health", "Shelter", "Education", "Employment", "Safety"];
  const ngoNames = [
    "Green Hands Foundation",
    "Care Link Society",
    "Urban Aid Network",
    "Hope Axis",
    "Nirman Relief Trust",
    "Sankalp Community Care",
  ];

  const citizens = Object.fromEntries(
    Array.from({ length: 18 }, (_, index) => {
      const id = `cit-${String(index + 1).padStart(2, "0")}`;
      const area = latest[index % latest.length]?.area || "Ward 12";
      return [id, {
        id,
        userId: id,
        name: `Citizen ${index + 1}`,
        email: `citizen${index + 1}@example.com`,
        phone: `+91 99001 3${String(index + 1).padStart(4, "0")}`,
        aadhaarNumber: "encrypted",
        isVerified: index % 6 !== 0,
        status: index % 6 === 0 ? "pending" : "active",
        location: areas[area],
        registeredAt: `2026-04-${String(1 + (index % 24)).padStart(2, "0")}`,
        createdAt: `2026-04-${String(1 + (index % 24)).padStart(2, "0")}T09:00:00.000Z`,
      }];
    })
  );

  const volunteers = Object.fromEntries(
    Array.from({ length: 24 }, (_, index) => {
      const id = `vol-${String(index + 1).padStart(2, "0")}`;
      const area = latest[index % latest.length]?.area || "Ward 12";
      return [id, {
        id,
        volunteerId: id,
        name: `Volunteer ${index + 1}`,
        email: `volunteer${index + 1}@example.com`,
        phone: `+91 99001 2${String(index + 1).padStart(4, "0")}`,
        skills: [categories[index % categories.length], "Logistics"],
        location: areas[area],
        availability: index % 5 !== 0,
        status: index % 5 === 0 ? "offline" : "idle",
        currentRequestId: null,
        ngoId: `ngo-${(index % 6) + 1}`,
        registeredAt: `2026-03-${String(1 + (index % 26)).padStart(2, "0")}`,
      }];
    })
  );

  const ngos = Object.fromEntries(
    ngoNames.map((name, index) => {
      const id = `ngo-${index + 1}`;
      const area = latest[index % latest.length]?.area || "Ward 12";
      const status = index === 1 || index === 5 ? "pending" : index === 4 ? "rejected" : "approved";
      return [id, {
        id,
        ngoId: id,
        name,
        ngoName: name,
        contactName: ["Priyanka Rao", "Mansi Trivedi", "Rohit Rana", "Aisha Khan", "Nikhil Shah", "Devika Mehta"][index],
        email: `contact${index + 1}@${name.toLowerCase().replace(/[^a-z]+/g, "")}.org`,
        phone: `+91 99001 4${String(index + 1).padStart(4, "0")}`,
        area,
        location: areas[area],
        categories: [categories[index % categories.length], categories[(index + 1) % categories.length]],
        serviceRadius: 8 + index,
        availableResources: { food: 120 - index * 8, medicine: 60 - index * 5, shelter: 40 - index * 3 },
        verified: status === "approved",
        rating: 4.1 + index * 0.1,
        status,
        documents: ["Registration Certificate", "Tax Exemption", "Volunteer Roster"].slice(0, 2 + (index % 2)),
        submittedAt: `2026-04-${String(10 + index).padStart(2, "0")}`,
        coverage: `${area} ${categories[index % categories.length].toLowerCase()} response`,
        mission: `Community support for ${categories[index % categories.length].toLowerCase()} needs in high-priority zones.`,
      }];
    })
  );

  const requests = {
    ...Object.fromEntries(
      latest.map((row, index) => {
        const id = `need-${index + 1}`;
        const status = index % 4 === 0 ? "pending_admin" : index % 4 === 1 ? "approved" : index % 4 === 2 ? "assigned_to_ngo" : "completed";
        return [id, {
          id,
          requestId: id,
          userId: `cit-${String((index % 18) + 1).padStart(2, "0")}`,
          title: `${row.category} support needed in ${row.area}`,
          description: `${row.prior_requests} recent reports, ${Math.round(row.shelter_occupancy_pct * 100)}% shelter pressure, and ${row.volunteers_available} volunteers available.`,
          summary: `${row.category} demand is ${row.label} risk based on open humanitarian indicators and local response capacity.`,
          category: row.category,
          aiCategory: row.category,
          urgency: row.label === "high" ? "high" : row.label === "medium" ? "medium" : "low",
          location: areas[row.area] || { lat: 23.0225, lng: 72.5714, address: row.area },
          requestedBy: ngoNames[index % ngoNames.length],
          beneficiaries: Math.max(40, row.prior_requests * 24 + Math.round(row.poverty_index * 100)),
          status,
          suggestedNGOs: [],
          assignedNgoId: status === "assigned_to_ngo" ? `ngo-${(index % 6) + 1}` : null,
          assignedVolunteerId: null,
          createdAt: `2026-04-${String(18 + index).padStart(2, "0")}T10:00:00.000Z`,
        }];
      })
    ),
    "need-test-1": {
      id: "need-test-1",
      requestId: "need-test-1",
      userId: "cit-01",
      title: "Shared Test Request - Food",
      description: "This is a test request visible to ALL NGOs for coordination testing.",
      category: "Food",
      aiCategory: "Food",
      urgency: "medium",
      location: areas["Ward 12"],
      status: "assigned_to_ngo",
      assignedNgoId: "ALL",
      createdAt: new Date().toISOString(),
    },
    "need-test-2": {
      id: "need-test-2",
      requestId: "need-test-2",
      userId: "cit-02",
      title: "Shared Test Request - Health",
      description: "Emergency medical supplies needed - visible to all NGOs.",
      category: "Health",
      aiCategory: "Health",
      urgency: "high",
      location: areas["River Belt"],
      status: "assigned_to_ngo",
      assignedNgoId: "ALL",
      createdAt: new Date().toISOString(),
    }
  };

  const predictions = Object.fromEntries(
    latest.map((row, index) => [`pred-${index + 1}`, {
      id: `pred-${index + 1}`,
      area: row.area,
      category: row.category,
      score: row.risk_score,
      label: row.label,
      trend: trendForArea(rows, row.area),
      trigger: `${row.prior_requests} requests, ${row.ngo_response_hrs}h average NGO response, ${row.volunteers_available} volunteers available.`,
      recommendedAction: recommendedAction(row),
      outlook: riskOutlook(row),
      locationName: row.area,
      updatedAt: today,
    }])
  );

  const categoryCounts = categories.map((category) => ({
    category,
    needs: rows.filter((row) => row.category === category).reduce((sum, row) => sum + row.prior_requests, 0),
  }));

  return {
    Citizen: citizens,
    Volunteer: volunteers,
    NGO: ngos,
    Request: requests,
    Prediction: predictions,
    Assignment: {
      "assign-1": { id: "assign-1", ngoName: "Green Hands Foundation", campus: "Ward 12", coordinator: "Priyanka Rao", assignedAt: "2026-04-20" },
      "assign-2": { id: "assign-2", ngoName: "Care Link Society", campus: "River Belt", coordinator: "Mansi Trivedi", assignedAt: "2026-04-21" },
      "assign-3": { id: "assign-3", ngoName: "Urban Aid Network", campus: "Industrial Edge", coordinator: "Rohit Rana", assignedAt: "2026-04-22" },
    },
    Analytics: {
      needCategoryAnalytics: categoryCounts,
      roleBreakdown: [
        { role: "ngo", total: ngoNames.length, active: 3, pending: 2 },
        { role: "volunteer", total: 24, active: 19, pending: 0 },
        { role: "citizen", total: 18, active: 15, pending: 3 },
      ],
      volunteerDeploymentStats: latest.slice(0, 5).map((row) => ({
        zone: row.area,
        deployed: row.volunteers_available,
        target: Math.max(row.volunteers_available + 8, Math.round(row.prior_requests * 2.2)),
      })),
      ngoActivityLevels: ngoNames.slice(0, 4).map((ngo, index) => ({
        ngo: ngo.replace(/ Foundation| Society| Network| Trust/g, ""),
        tasksCompleted: 24 + index * 7,
        activeRequests: 3 + index,
      })),
      datasetSources: [
        { name: "HDX HAPI Humanitarian Needs", url: "https://hdx-hapi.readthedocs.io/en/latest/data_usage_guides/affected_people/" },
        { name: "WFP climate data on HDX", url: "https://centre.humdata.org/wfp-climate-data-on-hdx/" },
        { name: "ACAPS INFORM Severity Index", url: "https://www.acaps.org/en/thematics/all-topics/inform-severity-index" },
      ],
    },
    MapLayer: {
      center: [23.0225, 72.5714],
      heatmapPoints: latest.slice(0, 5).map((row, index) => ({
        id: `heat-${index + 1}`,
        label: row.area,
        position: [areas[row.area]?.lat || 23.0225, areas[row.area]?.lng || 72.5714],
        intensity: Math.max(1, Math.round(row.risk_score / 6)),
        description: `${row.category} risk score ${row.risk_score}/100 from imported dataset.`,
      })),
      ngoPresencePoints: Object.values(ngos).filter((ngo: any) => ngo.status === "approved").map((ngo: any) => ({
        id: `${ngo.id}-map`,
        label: ngo.ngoName,
        position: [ngo.location.lat, ngo.location.lng],
        description: ngo.coverage,
      })),
      volunteerPresencePoints: latest.slice(0, 5).map((row, index) => ({
        id: `vol-map-${index + 1}`,
        label: `${row.area} Volunteers`,
        position: [areas[row.area]?.lat || 23.0225, areas[row.area]?.lng || 72.5714],
        intensity: row.volunteers_available,
        description: `${row.volunteers_available} available volunteers.`,
      })),
    },
    DatasetMeta: {
      importedAt: new Date().toISOString(),
      sourceFile: "data/datasets/humanitarian_risk_dataset.csv",
      records: rows.length,
      selectedPublicDatasets: [
        "HDX HAPI Humanitarian Needs and Affected People",
        "WFP climate datasets on HDX",
        "ACAPS INFORM Severity Index",
      ],
    },
  };
}

async function main() {
  initFirebaseAdmin();
  const db = getDatabase();
  const csvPath = join(process.cwd(), "data", "datasets", "humanitarian_risk_dataset.csv");
  const rows = parseCsv(csvPath);
  const payload = buildSeedData(rows);
  await db.ref().update(payload);
  console.log(`Seeded Firebase Realtime Database with ${rows.length} dataset rows and admin demo data.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Failed to seed Firebase:", error);
  process.exit(1);
});
