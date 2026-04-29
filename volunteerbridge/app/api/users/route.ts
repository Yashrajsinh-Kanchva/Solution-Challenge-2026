export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
import { NextResponse } from "next/server";

export async function GET() {
  const { db } = await import("@/lib/firebaseAdmin");
  try {
    const [ngoSnap, citizenSnap, volunteerSnap] = await Promise.all([
      db.ref("NGO").once("value"),
      db.ref("Citizen").once("value"),
      db.ref("Volunteer").once("value")
    ]);

    const ngos = ngoSnap.exists() ? Object.values(ngoSnap.val()).map((n: any) => ({
      ...n,
      id: n.id || n.ngoId,
      role: "ngo",
      name: n.ngoName || n.name,
      registeredAt: n.registeredAt || n.submittedAt,
      status: n.status || (n.verified ? "active" : "pending"),
    })) : [];

    const citizens = citizenSnap.exists() ? Object.values(citizenSnap.val()).map((c: any) => ({
      ...c,
      id: c.id || c.userId,
      role: "citizen",
      registeredAt: c.registeredAt || c.createdAt?.slice(0, 10),
      status: c.status || (c.isVerified ? "active" : "pending"),
    })) : [];

    const volunteers = volunteerSnap.exists() ? Object.values(volunteerSnap.val()).map((v: any) => ({
      ...v,
      id: v.id || v.volunteerId,
      role: "volunteer",
      registeredAt: v.registeredAt || v.createdAt?.slice(0, 10),
      status: v.status === "offline" ? "inactive" : "active",
      email: v.email || `${(v.name || "volunteer").toLowerCase().replace(/\s+/g, ".")}@example.com`,
    })) : [];

    const allUsers = [...ngos, ...citizens, ...volunteers].sort((a, b) => {
      const dateA = new Date(a.registeredAt || a.createdAt || 0).getTime();
      const dateB = new Date(b.registeredAt || b.createdAt || 0).getTime();
      return dateB - dateA;
    });

    return NextResponse.json(allUsers);
  } catch (error) {
    console.error("API Error (users):", error);
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}

