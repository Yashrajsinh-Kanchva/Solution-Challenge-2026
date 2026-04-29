import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const snapshot = await db.ref("MapLayer").once("value");
    return NextResponse.json(snapshot.exists() ? snapshot.val() : {});
  } catch (error) {
    console.error("API Error (map-layers):", error);
    return NextResponse.json({ error: "Failed to fetch map layers" }, { status: 500 });
  }
}
