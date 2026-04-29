export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function GET() {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const snapshot = await db.ref("MapLayer").once("value");
    return NextResponse.json(snapshot.exists() ? snapshot.val() : {});
  } catch (error) {
    console.error("API Error (map-layers):", error);
    return NextResponse.json({ error: "Failed to fetch map layers" }, { status: 500 });
  }
}

