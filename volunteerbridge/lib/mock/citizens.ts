export type CitizenReport = {
  id: string;
  title: string;
  category: string;
  description: string;
  severity: "low" | "medium" | "high" | "critical";
  urgency: string;
  location: { lat: string; lng: string; area_name: string };
  status: "pending" | "in_progress" | "resolved";
  timestamp: string;
};

export type CitizenProfile = {
  id: string;
  name: string;
  email: string;
  phone: string;
  area: string;
  location: { lat: number; lng: number; address: string };
  isVerified: boolean;
  status: "active" | "pending";
  registeredAt: string;
  reports: CitizenReport[];
};

const AREAS = [
  { name: "Ward 12", lat: 23.028, lng: 72.575 },
  { name: "River Belt", lat: 23.016, lng: 72.558 },
  { name: "Industrial Edge", lat: 23.038, lng: 72.589 },
  { name: "Transit Block", lat: 23.011, lng: 72.566 },
  { name: "East Campus", lat: 23.014, lng: 72.586 },
  { name: "North Campus", lat: 23.030, lng: 72.580 },
  { name: "West Campus", lat: 23.021, lng: 72.552 },
  { name: "South Campus", lat: 23.004, lng: 72.571 },
];

const NAMES = [
  "Riya Shah", "Neha Parmar", "Dev Mehta", "Priya Patel",
  "Arjun Desai", "Kavya Joshi", "Rohan Gupta", "Ananya Rao",
  "Harsh Trivedi", "Sneha Kulkarni", "Vivek Nair", "Pooja Iyer",
  "Kiran Reddy", "Aditya Verma", "Simran Kaur", "Manav Singh",
  "Tanvi Bhatt", "Yash Pandya",
];

function makeReports(citizenIdx: number, area: typeof AREAS[0]): CitizenReport[] {
  const categories = ["water", "sanitation", "roads", "electricity", "healthcare", "environment"];
  const severities: CitizenReport["severity"][] = ["low", "medium", "high", "critical"];
  const statuses: CitizenReport["status"][] = ["pending", "in_progress", "resolved"];

  const count = 1 + (citizenIdx % 4); // 1-4 reports per citizen
  return Array.from({ length: count }, (_, i) => {
    const cat = categories[(citizenIdx + i) % categories.length];
    return {
      id: `rep-${String(citizenIdx + 1).padStart(2, "0")}-${i + 1}`,
      title: REPORT_TITLES[cat as keyof typeof REPORT_TITLES] ?? "Local issue reported",
      category: cat,
      description: REPORT_DESCS[cat as keyof typeof REPORT_DESCS] ?? "An issue was observed in the local area.",
      severity: severities[(citizenIdx + i) % severities.length],
      urgency: ["immediate", "24h", "can_wait"][(citizenIdx + i) % 3],
      location: { lat: String(area.lat), lng: String(area.lng), area_name: area.name },
      status: statuses[(citizenIdx + i) % statuses.length],
      timestamp: `2026-04-${String(Math.max(1, 26 - i - citizenIdx % 10)).padStart(2, "0")}T${String(8 + i).padStart(2, "0")}:30:00.000Z`,
    };
  });
}

const REPORT_TITLES = {
  water: "Water leakage near street corner",
  sanitation: "Garbage not collected for 5 days",
  roads: "Pothole causing accidents on main road",
  electricity: "Street lights not working since last week",
  healthcare: "No medicine supply at local clinic",
  environment: "Illegal dumping near park area",
  education: "School building has structural damage",
  public_safety: "No lighting in alley — unsafe at night",
};

const REPORT_DESCS = {
  water: "Water is continuously leaking from the pipeline, causing wastage and road damage. The issue started 3 days ago and affects the entire street. Residents are unable to cross without getting wet.",
  sanitation: "Garbage has not been collected for over 5 days. The smell is unbearable and it is attracting animals. Elderly residents are most affected.",
  roads: "A large pothole on the main road has caused two minor accidents this week. Vehicles are forced to swerve suddenly which is dangerous.",
  electricity: "Street lights in our colony have been non-functional since last Wednesday. Residents feel unsafe walking at night.",
  healthcare: "The local clinic has run out of basic medicines like paracetamol and ORS. Patients are being turned away without treatment.",
  environment: "People are illegally dumping construction waste near the park. It is blocking the footpath and children cannot play safely.",
  education: "The school building has visible cracks after recent rains. Parents are worried about the safety of children attending classes.",
  public_safety: "The alley behind the market has no lighting, making it unsafe especially for women and elderly residents after 6 PM.",
};

export const MOCK_CITIZENS: CitizenProfile[] = Array.from({ length: 18 }, (_, i) => {
  const area = AREAS[i % AREAS.length];
  return {
    id: `cit-${String(i + 1).padStart(2, "0")}`,
    name: NAMES[i],
    email: `${NAMES[i].toLowerCase().replace(/ /g, ".")}@example.com`,
    phone: `+91 99001 3${String(i + 1).padStart(4, "0")}`,
    area: area.name,
    location: { lat: area.lat, lng: area.lng, address: area.name },
    isVerified: i % 6 !== 0,
    status: i % 6 === 0 ? "pending" : "active",
    registeredAt: `2026-04-${String(1 + (i % 24)).padStart(2, "0")}`,
    reports: makeReports(i, area),
  };
});

export function getCitizenById(id: string): CitizenProfile | null {
  return MOCK_CITIZENS.find(c => c.id === id) ?? null;
}
