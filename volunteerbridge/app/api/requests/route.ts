export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function GET() {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const snapshot = await db.ref("Request").once("value");
    const requests = snapshot.exists() ? Object.values(snapshot.val()) : [];
    return NextResponse.json(requests);
  } catch (error) {
    console.error("API Error (requests):", error);
    return NextResponse.json({ error: "Failed to fetch requests" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const payload = await request.json();
    const requestId = `need-${Date.now()}`;
    const newRequest = {
      ...payload,
      id: requestId,
      requestId,
      status: "pending_admin",
      createdAt: new Date().toISOString(),
    };
    await db.ref(`Request/${requestId}`).set(newRequest);
    return NextResponse.json(newRequest, { status: 201 });
  } catch (error) {
    console.error("API Error (requests POST):", error);
    return NextResponse.json({ error: "Failed to create request" }, { status: 500 });
  }
}

