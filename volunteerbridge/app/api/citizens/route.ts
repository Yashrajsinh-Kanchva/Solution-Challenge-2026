import { NextRequest, NextResponse } from "next/server";
import { initFirebaseAdmin } from "@/lib/firebase/config";
import { getDatabase } from "firebase-admin/database";

// Ensure Firebase is initialized
function getDb() {
  initFirebaseAdmin();
  return getDatabase();
}

// GET /api/citizens           → slim list (id, name, area, status)
// GET /api/citizens?id=cit-01 → full profile with reports
export async function GET(req: NextRequest) {
  try {
    const db = getDb();
    const id = req.nextUrl.searchParams.get("id");

    if (!id) {
      const snap = await db.ref("Citizen").once("value");
      if (!snap.exists()) {
        return NextResponse.json({ citizens: [] });
      }
      const raw = snap.val() as Record<string, { id: string; name: string; area: string; status: string }>;
      const list = Object.values(raw).map(c => ({
        id:     c.id,
        name:   c.name,
        area:   c.area,
        status: c.status,
      }));
      // Sort by numeric id (cit-01, cit-02, ...)
      list.sort((a, b) => a.id.localeCompare(b.id));
      return NextResponse.json({ citizens: list });
    }

    // Single citizen
    const snap = await db.ref(`Citizen/${id}`).once("value");
    if (!snap.exists()) {
      return NextResponse.json({ error: "Citizen not found" }, { status: 404 });
    }
    return NextResponse.json({ citizen: snap.val() });

  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
