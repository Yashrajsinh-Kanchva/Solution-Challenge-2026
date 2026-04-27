import { NextRequest, NextResponse } from "next/server";
import { initFirebaseAdmin } from "@/lib/firebase/config";
import { getDatabase } from "firebase-admin/database";

function getDb() {
  initFirebaseAdmin();
  return getDatabase();
}

function getCitizenIdFromCookie(req: NextRequest): string | null {
  return req.cookies.get("vb_citizen_id")?.value ?? null;
}

// POST /api/reports — save a new report for the logged-in citizen
export async function POST(req: NextRequest) {
  try {
    const citizenId = getCitizenIdFromCookie(req);
    if (!citizenId) {
      return NextResponse.json({ error: "Not authenticated as citizen" }, { status: 401 });
    }

    const body = await req.json();
    const db   = getDb();

    // Generate unique report ID
    const reportId = `rep-${citizenId}-${Date.now()}`;

    const report = {
      id:          reportId,
      citizenId,
      title:       body.title       ?? "Untitled Report",
      category:    body.category    ?? "others",
      description: body.description ?? "",
      severity:    body.severity    ?? "medium",
      urgency:     body.urgency     ?? "",
      location:    body.location    ?? { lat: "", lng: "", area_name: "" },
      media:       body.media       ?? [],
      status:      "pending",
      timestamp:   new Date().toISOString(),
    };

    // Save under Citizen/{citizenId}/reports/{reportId}
    await db.ref(`Citizen/${citizenId}/reports/${reportId}`).set(report);

    return NextResponse.json({ success: true, reportId, report }, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// GET /api/reports — fetch all reports for the logged-in citizen
export async function GET(req: NextRequest) {
  try {
    const citizenId = getCitizenIdFromCookie(req);
    if (!citizenId) {
      return NextResponse.json({ error: "Not authenticated as citizen" }, { status: 401 });
    }

    const db   = getDb();
    const snap = await db.ref(`Citizen/${citizenId}/reports`).once("value");

    if (!snap.exists()) {
      return NextResponse.json({ reports: [], citizenId });
    }

    const raw     = snap.val() as Record<string, object>;
    const reports = Object.values(raw).sort((a: any, b: any) =>
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );

    return NextResponse.json({ reports, citizenId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
