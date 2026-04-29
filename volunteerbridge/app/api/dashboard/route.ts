import { db } from "@/lib/firebaseAdmin";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const [ngoSnap, citizenSnap, volunteerSnap, requestSnap] = await Promise.all([
      db.ref("NGO").once("value"),
      db.ref("Citizen").once("value"),
      db.ref("Volunteer").once("value"),
      db.ref("Request").once("value")
    ]);

    const ngos = ngoSnap.exists() ? Object.values(ngoSnap.val()) : [];
    const citizens = citizenSnap.exists() ? Object.values(citizenSnap.val()) : [];
    const volunteers = volunteerSnap.exists() ? Object.values(volunteerSnap.val()) : [];
    const requests = requestSnap.exists() ? Object.values(requestSnap.val()) : [];

    const normalizedNgos = ngos.map((n: any) => ({
      ...n,
      id: n.id || n.ngoId,
      ngoName: n.ngoName || n.name,
      status: n.status || (n.verified ? "approved" : "pending"),
      area: n.area || n.location?.address || "Unassigned",
    }));

    const normalizedCitizens = citizens.map((c: any) => ({
      ...c,
      id: c.id || c.userId,
      role: "citizen",
      registeredAt: c.registeredAt || c.createdAt?.slice(0, 10),
      status: c.status || (c.isVerified ? "active" : "pending"),
    }));

    const pendingNgoApprovals = normalizedNgos.filter((n: any) => n.status === "pending").length;

    return NextResponse.json({
      metrics: {
        totalUsers: citizens.length + ngos.length + volunteers.length,
        totalNgos: normalizedNgos.filter((n: any) => n.status === "approved").length,
        totalVolunteers: volunteers.length,
        totalCitizens: citizens.length,
        pendingNgoApprovals
      },
      recentNgos: normalizedNgos.slice(-3),
      recentUsers: normalizedCitizens.slice(-4),
      recentRequests: requests.slice(-3)
    });
  } catch (error) {
    console.error("API Error (dashboard):", error);
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
