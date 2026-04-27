import "dotenv/config";
import { initFirebaseAdmin } from "../lib/firebase/config";
import { getDatabase } from "firebase-admin/database";

const AREAS = [
  { name: "Ward 12",         lat: 23.028, lng: 72.575 },
  { name: "River Belt",      lat: 23.016, lng: 72.558 },
  { name: "Industrial Edge", lat: 23.038, lng: 72.589 },
  { name: "Transit Block",   lat: 23.011, lng: 72.566 },
  { name: "East Campus",     lat: 23.014, lng: 72.586 },
  { name: "North Campus",    lat: 23.030, lng: 72.580 },
  { name: "West Campus",     lat: 23.021, lng: 72.552 },
  { name: "South Campus",    lat: 23.004, lng: 72.571 },
];

const NAMES = [
  "Riya Shah",     "Neha Parmar",    "Dev Mehta",      "Priya Patel",
  "Arjun Desai",   "Kavya Joshi",    "Rohan Gupta",    "Ananya Rao",
  "Harsh Trivedi", "Sneha Kulkarni", "Vivek Nair",     "Pooja Iyer",
  "Kiran Reddy",   "Aditya Verma",   "Simran Kaur",    "Manav Singh",
  "Tanvi Bhatt",   "Yash Pandya",
];

const CATEGORIES = ["water","sanitation","roads","electricity","healthcare","environment"];
const SEVERITIES = ["low","medium","high","critical"];
const STATUSES   = ["pending","in_progress","resolved"];

const REPORT_TITLES: Record<string, string> = {
  water:        "Water leakage near street corner",
  sanitation:   "Garbage not collected for 5 days",
  roads:        "Pothole causing accidents on main road",
  electricity:  "Street lights not working since last week",
  healthcare:   "No medicine supply at local clinic",
  environment:  "Illegal dumping near park area",
};

const REPORT_DESCS: Record<string, string> = {
  water:       "Water is continuously leaking from the pipeline, causing wastage and road damage. Residents are unable to cross without getting wet.",
  sanitation:  "Garbage has not been collected for over 5 days. The smell is unbearable and it is attracting animals.",
  roads:       "A large pothole on the main road has caused two minor accidents this week. Vehicles swerve suddenly which is dangerous.",
  electricity: "Street lights in the colony have been non-functional since last Wednesday. Residents feel unsafe at night.",
  healthcare:  "The local clinic has run out of basic medicines. Patients are being turned away without treatment.",
  environment: "People are illegally dumping construction waste near the park. It is blocking the footpath.",
};

function makeReports(citizenIdx: number, area: typeof AREAS[0]) {
  const count = 1 + (citizenIdx % 4);
  return Object.fromEntries(
    Array.from({ length: count }, (_, i) => {
      const cat = CATEGORIES[(citizenIdx + i) % CATEGORIES.length];
      const id  = `rep-${String(citizenIdx + 1).padStart(2, "0")}-${i + 1}`;
      return [id, {
        id,
        title:       REPORT_TITLES[cat] ?? "Local issue reported",
        category:    cat,
        description: REPORT_DESCS[cat] ?? "An issue was observed in the local area.",
        severity:    SEVERITIES[(citizenIdx + i) % SEVERITIES.length],
        urgency:     ["immediate","24h","can_wait"][(citizenIdx + i) % 3],
        location:    { lat: String(area.lat), lng: String(area.lng), area_name: area.name },
        status:      STATUSES[(citizenIdx + i) % STATUSES.length],
        timestamp:   `2026-04-${String(Math.max(1, 26 - i - citizenIdx % 10)).padStart(2,"0")}T${String(8+i).padStart(2,"0")}:30:00.000Z`,
      }];
    })
  );
}

async function main() {
  console.log("Connecting to Firebase...");
  initFirebaseAdmin();
  const db = getDatabase();

  const citizens: Record<string, object> = {};
  for (let i = 0; i < 18; i++) {
    const area = AREAS[i % AREAS.length];
    const id   = `cit-${String(i + 1).padStart(2, "0")}`;
    citizens[id] = {
      id,
      name:        NAMES[i],
      email:       `${NAMES[i].toLowerCase().replace(/ /g, ".")}@example.com`,
      phone:       `+91 99001 3${String(i + 1).padStart(4, "0")}`,
      area:        area.name,
      location:    { lat: area.lat, lng: area.lng, address: area.name },
      isVerified:  i % 6 !== 0,
      status:      i % 6 === 0 ? "pending" : "active",
      registeredAt:`2026-04-${String(1 + (i % 24)).padStart(2, "0")}`,
      reports:     makeReports(i, area),
    };
  }

  await db.ref("Citizen").set(citizens);
  console.log(`✅ Seeded 18 citizens into Firebase Realtime Database.`);
  process.exit(0);
}

main().catch(err => { console.error("❌ Seed failed:", err.message); process.exit(1); });
