import "dotenv/config";
import { dbRef } from "../lib/firebase/firestore";

async function migrateVolunteers() {
  console.log("Starting volunteer data migration...");
  
  try {
    const volSnap = await dbRef("Volunteer").once("value");
    if (!volSnap.exists()) {
      console.log("No volunteers found to migrate.");
      process.exit(0);
    }

    const volunteers = volSnap.val();
    const updates: Record<string, any> = {};

    Object.keys(volunteers).forEach(key => {
      const v = volunteers[key];
      const needsMigration = !v.status || v.status !== "ACTIVE" || !v.registeredAt;

      if (needsMigration) {
        console.log(`- Migrating volunteer: ${v.name || key}`);
        updates[`Volunteer/${key}/status`] = "ACTIVE";
        if (!v.registeredAt) {
          updates[`Volunteer/${key}/registeredAt`] = new Date().toISOString();
        }
        // If ngoId is missing, we might need a default or a way to find it.
        // For this simulation, if ngoId is missing, we'll assign it to ngo-1 if it was previously "idle"
        if (!v.ngoId) {
          updates[`Volunteer/${key}/ngoId`] = "ngo-1"; 
          console.log(`  ! Assigned missing ngoId as 'ngo-1' for ${v.name || key}`);
        }
      }
    });

    if (Object.keys(updates).length > 0) {
      await dbRef("/").update(updates);
      console.log(`Successfully migrated ${Object.keys(updates).length / 2} fields across volunteers.`);
    } else {
      console.log("All volunteers are already up to date.");
    }
  } catch (error) {
    console.error("Migration failed:", error);
  }

  console.log("Migration complete!");
  process.exit(0);
}

migrateVolunteers();
