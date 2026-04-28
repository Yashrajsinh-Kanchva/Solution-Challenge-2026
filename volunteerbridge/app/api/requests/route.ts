import { NextRequest, NextResponse } from "next/server";
import { initFirebaseAdmin } from "@/lib/firebase/config";
import { getDatabase } from "firebase-admin/database";

function getDb() {
  initFirebaseAdmin();
  return getDatabase();
}

function getCookie(req: NextRequest, name: string) {
  return req.cookies.get(name)?.value ?? null;
}

// POST /api/requests — citizen submits a new issue
export async function POST(req: NextRequest) {
  try {
    const citizenId = getCookie(req, "vb_citizen_id");
    if (!citizenId) {
      return NextResponse.json({ error: "Not authenticated as citizen" }, { status: 401 });
    }

    const body = await req.json();
    const db   = getDb();

    // Generate unique ID
    const requestId = `req-${citizenId}-${Date.now()}`;

    const record = {
      id:                  requestId,
      requestId,
      userId:              citizenId,
      requestType:         body.requestType      || "ISSUE",
      title:               body.title            ?? "Untitled",
      description:         body.description      ?? "",
      summary:             body.summary          ?? body.description?.slice(0, 120) ?? "",
      text:                body.description      ?? "",
      category:            body.category         ?? "others",
      aiCategory:          body.category         ?? "others", // same as category until AI processes it
      urgency:             body.urgency          ?? "low",
      location:            {
        lat:     parseFloat(body.location?.lat) || 0,
        lng:     parseFloat(body.location?.lng) || 0,
        address: body.location?.area_name        ?? "",
      },
      requestedBy:         body.requestedBy      ?? citizenId,
      beneficiaries:       Number(body.beneficiaries) || 1,
      status:              "pending",
      suggestedNGOs:       [],
      assignedNgoId:       null,
      assignedVolunteerId: null,
      createdAt:           new Date().toISOString(),
    };

    // Save to Request/{requestId}
    await db.ref(`Request/${requestId}`).set(record);

    return NextResponse.json({ success: true, requestId, record }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/requests — fetch all requests submitted by the logged-in citizen
export async function GET(req: NextRequest) {
  try {
    const citizenId = getCookie(req, "vb_citizen_id");
    if (!citizenId) {
      return NextResponse.json({ error: "Not authenticated as citizen" }, { status: 401 });
    }

    const db   = getDb();
    const snap = await db.ref("Request")
      .orderByChild("userId")
      .equalTo(citizenId)
      .once("value");

    if (!snap.exists()) {
      return NextResponse.json({ requests: [], citizenId });
    }

    const raw      = snap.val() as Record<string, object>;
    const requests = Object.values(raw).sort((a: any, b: any) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return NextResponse.json({ requests, citizenId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
