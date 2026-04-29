export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

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
    console.error("API Error (ngos register POST):", error);
    return NextResponse.json({ error: "Failed to register NGO" }, { status: 500 });
  }
}
