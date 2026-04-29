import admin from "firebase-admin";

function initializeFirebase() {
  if (!admin.apps.length) {
    try {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
      const databaseURL = process.env.FIREBASE_DATABASE_URL;

      if (!projectId || !clientEmail || !privateKey) {
        console.warn("Firebase Admin environment variables are missing. Initialization skipped during build.");
        return admin;
      }

      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
        databaseURL,
      });
      console.log("Firebase Admin initialized successfully.");
    } catch (error) {
      console.error("Firebase Admin initialization error:", error);
    }
  }
  return admin;
}

const firebaseAdmin = initializeFirebase();
export const db = firebaseAdmin.database();
export default firebaseAdmin;
