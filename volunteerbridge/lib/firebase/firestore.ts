import { DataSnapshot, Reference } from "firebase-admin/database";
import { getRealtimeDb } from "@/lib/firebase/config";

export function dbRef(path: string): Reference {
	return getRealtimeDb().ref(path);
}

export async function readOnce<T>(path: string): Promise<T | null> {
	const snapshot: DataSnapshot = await dbRef(path).once("value");
	return snapshot.exists() ? (snapshot.val() as T) : null;
}

export async function writeAtPath<T>(path: string, payload: T): Promise<void> {
	await dbRef(path).set(payload);
}

export async function updateAtPath<T extends Record<string, unknown>>(
	path: string,
	payload: T
): Promise<void> {
	await dbRef(path).update(payload);
}

export async function removeAtPath(path: string): Promise<void> {
	await dbRef(path).remove();
}
