export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function GET() {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const snapshot = await db.ref("Volunteer").once("value");
    const volunteers = snapshot.exists() ? Object.values(snapshot.val()).map((v: any) => ({
      ...v,
      id: v.id || v.volunteerId,
      role: "volunteer",
      registeredAt: v.registeredAt || v.createdAt?.slice(0, 10),
      status: v?.status === "offline" ? "inactive" : "active",
      email: v.email || `${(v.name || "volunteer").toLowerCase().replace(/\s+/g, ".")}@example.com`,
    })) : [];
    return NextResponse.json(volunteers);
  } catch (error) {
    console.error("API Error (volunteers):", error);
    return NextResponse.json({ error: "Failed to fetch volunteers" }, { status: 500 });
  }
}

