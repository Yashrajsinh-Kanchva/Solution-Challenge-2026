export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function GET() {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const snapshot = await db.ref("NGO").once("value");
    const ngos = snapshot.exists() ? Object.values(snapshot.val()).map((n: any) => ({
      ...n,
      id: n.id || n.ngoId,
      ngoName: n.ngoName || n.name,
      contactName: n.contactName || n.name,
      status: (n.status || (n.verified ? "approved" : "pending")).toLowerCase(),
      area: n?.area ?? n?.location?.address ?? "Unassigned",
    })) : [];
    return NextResponse.json(ngos);
  } catch (error) {
    console.error("API Error (ngos):", error);
    return NextResponse.json({ error: "Failed to fetch NGOs" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const payload = await request.json();
    const ngoId = `ngo-${Date.now()}`;
    const newNgo = {
      ...payload,
      id: ngoId,
      ngoId,
      status: "pending",
      submittedAt: new Date().toISOString().slice(0, 10),
    };
    await db.ref(`NGO/${ngoId}`).set(newNgo);
    return NextResponse.json(newNgo, { status: 201 });
  } catch (error) {
    console.error("API Error (ngos POST):", error);
    return NextResponse.json({ error: "Failed to register NGO" }, { status: 500 });
  }
}

