export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const snapshot = await db.ref("Prediction").once("value");
    const predictions = snapshot.exists() ? Object.values(snapshot.val()) : [];
    return NextResponse.json(predictions);
  } catch (error) {
    console.error("API Error (predictions):", error);
    return NextResponse.json({ error: "Failed to fetch predictions" }, { status: 500 });
  }
}

