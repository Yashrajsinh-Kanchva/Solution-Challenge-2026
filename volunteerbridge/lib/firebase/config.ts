import { App, cert, getApps, initializeApp } from "firebase-admin/app";
import { Database, getDatabase } from "firebase-admin/database";

type ServiceAccountEnv = {
	projectId: string;
	clientEmail: string;
	privateKey: string;
	databaseURL: string;
};

function getServiceAccountFromEnv(): ServiceAccountEnv {
	const projectId = process.env.FIREBASE_PROJECT_ID;
	const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
	const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
	const databaseURL = process.env.FIREBASE_DATABASE_URL;

	if (!projectId || !clientEmail || !privateKey || !databaseURL) {
		throw new Error(
			"Missing Firebase Admin env vars. Required: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY, FIREBASE_DATABASE_URL"
		);
	}

	return { projectId, clientEmail, privateKey, databaseURL };
}

export function initFirebaseAdmin(): App {
	const existing = getApps();
	if (existing.length > 0) {
		return existing[0];
	}

	const serviceAccount = getServiceAccountFromEnv();
	return initializeApp({
		credential: cert({
			projectId: serviceAccount.projectId,
			clientEmail: serviceAccount.clientEmail,
			privateKey: serviceAccount.privateKey
		}),
		databaseURL: serviceAccount.databaseURL
	});
}

export function getRealtimeDb(): Database {
	return getDatabase(initFirebaseAdmin());
}
