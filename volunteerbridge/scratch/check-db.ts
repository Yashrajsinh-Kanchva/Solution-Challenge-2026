import "dotenv/config";
import { initFirebaseAdmin } from "../lib/firebase/config";
import { getDatabase } from "firebase-admin/database";

async function checkData() {
  initFirebaseAdmin();
  const db = getDatabase();
  
  const requests = await db.ref("Request").once("value");
  const volunteers = await db.ref("Volunteer").once("value");
  const ngos = await db.ref("NGO").once("value");
  
  console.log("Total Requests:", requests.numChildren());
  console.log("Total Volunteers:", volunteers.numChildren());
  console.log("Total NGOs:", ngos.numChildren());
  
  const ngo1 = await db.ref("NGO/ngo-1").once("value");
  console.log("NGO-1 Data:", JSON.stringify(ngo1.val(), null, 2));
  
  const allVolunteers = Object.values(volunteers.val() || {}) as any[];
  const ngo1Volunteers = allVolunteers.filter(v => v.ngoId === "ngo-1");
  const ngo2Volunteers = allVolunteers.filter(v => v.ngoId === "ngo-2");

  console.log("NGO-1 Volunteer Count:", ngo1Volunteers.length);
  console.log("NGO-2 Volunteer Count:", ngo2Volunteers.length);

  if (ngo1Volunteers.length > 0) {
    console.log("Sample NGO-1 Volunteer:", JSON.stringify(ngo1Volunteers[0], null, 2));
  }
  
  process.exit(0);
}

checkData();
