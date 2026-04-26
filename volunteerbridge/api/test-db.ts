import "dotenv/config";
import { getRealtimeDb } from "../lib/firebase/config";

async function runIntegrationTest() {
  console.log("Starting Database Integration Test...");
  console.log("-------------------------------------");

  try {
    // 1. Initialize DB Connection
    console.log("Initializing Firebase Admin connection...");
    const db = getRealtimeDb();
    console.log("✅ Successfully connected to Firebase Admin SDK.");

    // 2. Prepare test data
    const testRef = db.ref("system/connection_test");
    const testPayload = {
      timestamp: Date.now(),
      status: "connected",
      message: "Integration test successful!"
    };

    // 3. Test Write Operation
    console.log("Testing WRITE operation to Realtime Database...");
    await testRef.set(testPayload);
    console.log("✅ Write operation successful.");

    // 4. Test Read Operation
    console.log("Testing READ operation from Realtime Database...");
    const snapshot = await testRef.once("value");
    const data = snapshot.val();
    
    if (data && data.status === "connected") {
      console.log("✅ Read operation successful.");
      console.log("Data retrieved:", data);
    } else {
      throw new Error("Read data did not match written data.");
    }

    // 5. Cleanup
    console.log("Cleaning up test data...");
    await testRef.remove();
    console.log("✅ Cleanup successful.");

    console.log("-------------------------------------");
    console.log("🎉 ALL INTEGRATION TESTS PASSED!");
    process.exit(0);

  } catch (error) {
    console.error("❌ INTEGRATION TEST FAILED:");
    console.error(error);
    process.exit(1);
  }
}

runIntegrationTest();
