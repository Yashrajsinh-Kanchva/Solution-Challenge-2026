import { Response } from "express";
import { AuthenticatedRequest } from "@/lib/firebase/auth";
import { dbRef } from "@/lib/firebase/firestore";
import { NgoRecord, RequestRecord } from "@/lib/types/rtdb";
import { suggestNgoIdsForRequest } from "@/lib/utils/matching";

export async function approveRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { requestId } = req.params;
    const requestPath = `Request/${requestId}`;

    const snapshot = await dbRef(requestPath).once("value");
    if (!snapshot.exists()) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    const requestData = snapshot.val() as RequestRecord;
    await dbRef(requestPath).update({ status: "approved" });

    if (requestData.userId) {
      try {
        const userRef = dbRef(`Citizen/${requestData.userId}/trustScore`);
        const userSnap = await userRef.once("value");
        let score = userSnap.exists() ? userSnap.val() : 1;
        await userRef.set(score + 10);
      } catch (e) {
        console.error("Failed to update trust score", e);
      }
    }

    res.status(200).json({ message: "Request approved", requestId });
  } catch (error) {
    res.status(500).json({ error: "Failed to approve request", details: (error as Error).message });
  }
}

export async function assignNgoForRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { requestId } = req.params;

    const requestSnapshot = await dbRef(`Request/${requestId}`).once("value");
    if (!requestSnapshot.exists()) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    const request = requestSnapshot.val() as RequestRecord;
    const { ngoId: manualNgoId } = req.body;

    const ngoSnapshot = await dbRef("NGO").once("value");
    const ngoMap = (ngoSnapshot.val() || {}) as Record<string, NgoRecord>;
    const ngos = Object.values(ngoMap);

    const suggestedNGOs = suggestNgoIdsForRequest(request, ngos);
    const assignedNgoId = manualNgoId || (suggestedNGOs[0] ?? null);

    await dbRef(`Request/${requestId}`).update({
      suggestedNGOs,
      assignedNgoId,
      status: assignedNgoId ? "assigned_to_ngo" : request.status
    });

    res.status(200).json({
      message: "NGO assignment evaluated",
      requestId,
      suggestedNGOs,
      assignedNgoId
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to assign NGO", details: (error as Error).message });
  }
}

export async function getAllNgos(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const snapshot = await dbRef("NGO").once("value");
    const ngos = snapshot.exists() ? Object.values(snapshot.val()).map((n: any) => ({
      ...n,
      id: n.id || n.ngoId,
      ngoName: n.ngoName || n.name,
      contactName: n.contactName || n.name,
      status: n.status || (n.verified ? "approved" : "pending"),
      area: n?.area ?? n?.location?.address ?? "Unassigned",
    })) : [];
    res.status(200).json(ngos);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch NGOs", details: (error as Error).message });
  }
}

export async function approveNgo(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { ngoId } = req.params;
    const { status, reviewReason } = req.body;
    
    await dbRef(`NGO/${ngoId}`).update({ 
      status: status || "approved",
      reviewReason: reviewReason || null
    });

    res.status(200).json({ message: `NGO ${status}`, ngoId });
  } catch (error) {
    res.status(500).json({ error: "Failed to update NGO status", details: (error as Error).message });
  }
}

export async function getDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [ngoSnap, citizenSnap, volunteerSnap, requestSnap] = await Promise.all([
      dbRef("NGO").once("value"),
      dbRef("Citizen").once("value"),
      dbRef("Volunteer").once("value"),
      dbRef("Request").once("value")
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
      area: n?.area ?? n?.location?.address ?? "Unassigned",
    }));
    const normalizedCitizens = citizens.map((c: any) => ({
      ...c,
      id: c.id || c.userId,
      role: "citizen",
      registeredAt: c.registeredAt || c.createdAt?.slice(0, 10),
      status: c.status || (c.isVerified ? "active" : "pending"),
    }));
    const pendingNgoApprovals = normalizedNgos.filter((n: any) => n.status === "pending").length;

    res.status(200).json({
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
    res.status(500).json({ error: "Failed to fetch dashboard stats", details: (error as Error).message });
  }
}

export async function getAllUsers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const [ngoSnap, citizenSnap, volunteerSnap] = await Promise.all([
      dbRef("NGO").once("value"),
      dbRef("Citizen").once("value"),
      dbRef("Volunteer").once("value")
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

    const allUsers = [...ngos, ...citizens, ...volunteers];
    
    allUsers.sort((a, b) => {
        const dateA = new Date(a.registeredAt || a.createdAt || 0).getTime();
        const dateB = new Date(b.registeredAt || b.createdAt || 0).getTime();
        return dateB - dateA;
    });

    res.status(200).json(allUsers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch all users", details: (error as Error).message });
  }
}

export async function getAssignments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const snapshot = await dbRef("Assignment").once("value");
    const assignments = snapshot.exists() ? Object.values(snapshot.val()) : [];
    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assignments", details: (error as Error).message });
  }
}

export async function createAssignment(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { ngoName, campus, coordinator } = req.body;
    const assignmentId = `assign-${Date.now()}`;
    const newAssignment = {
      id: assignmentId,
      ngoName,
      campus,
      coordinator,
      assignedAt: new Date().toISOString().slice(0, 10),
    };
    
    await dbRef(`Assignment/${assignmentId}`).set(newAssignment);
    res.status(201).json(newAssignment);
  } catch (error) {
    res.status(500).json({ error: "Failed to create assignment", details: (error as Error).message });
  }
}

export async function getAnalytics(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    // Compute analytics live from the source collections instead of relying on a static Analytics node
    const [ngoSnap, volunteerSnap, requestSnap] = await Promise.all([
      dbRef("NGO").once("value"),
      dbRef("Volunteer").once("value"),
      dbRef("Request").once("value"),
    ]);

    const ngos      = ngoSnap.exists()      ? Object.values(ngoSnap.val()      as Record<string, any>) : [];
    const volunteers= volunteerSnap.exists() ? Object.values(volunteerSnap.val() as Record<string, any>) : [];
    const requests  = requestSnap.exists()   ? Object.values(requestSnap.val()   as Record<string, any>) : [];

    // ── Need category analytics ──
    const catCounts: Record<string, number> = {};
    requests.forEach((r: any) => {
      const cat = r.category || r.aiCategory || "Other";
      catCounts[cat] = (catCounts[cat] || 0) + 1;
    });
    const needCategoryAnalytics = Object.entries(catCounts).map(([category, needs]) => ({ category, needs }));

    // ── Volunteer deployment stats by zone / location ──
    const zoneCounts: Record<string, { deployed: number; target: number }> = {};
    volunteers.forEach((v: any) => {
      const zone = typeof v?.location === "string"
        ? v?.location.split(",")[0].trim()
        : v?.location?.address?.split(",")[0]?.trim() ?? "General";
      if (!zoneCounts[zone]) zoneCounts[zone] = { deployed: 0, target: 0 };
      if (v.availability || v.status === "idle") zoneCounts[zone].deployed += 1;
      zoneCounts[zone].target += 1;
    });
    const volunteerDeploymentStats = Object.entries(zoneCounts)
      .slice(0, 6)
      .map(([zone, { deployed, target }]) => ({ zone, deployed, target }));

    // ── NGO activity levels ──
    const ngoActivity: Record<string, { tasksCompleted: number; activeRequests: number }> = {};
    requests.forEach((r: any) => {
      if (!r.assignedNgoId) return;
      if (!ngoActivity[r.assignedNgoId]) ngoActivity[r.assignedNgoId] = { tasksCompleted: 0, activeRequests: 0 };
      const s = (r.status || "").toLowerCase();
      if (s === "completed") ngoActivity[r.assignedNgoId].tasksCompleted += 1;
      else ngoActivity[r.assignedNgoId].activeRequests += 1;
    });
    const ngoActivityLevels = Object.entries(ngoActivity).map(([ngoId, stats]) => {
      const ngo = ngos.find((n: any) => (n.ngoId || n.id) === ngoId);
      return {
        ngo: ngo?.ngoName || ngo?.name || ngoId,
        tasksCompleted: stats.tasksCompleted,
        activeRequests: stats.activeRequests,
      };
    });

    // ── Role breakdown ──
    const roleBreakdown = [
      { role: "ngo",       total: ngos.length,       active: ngos.filter((n: any) => n.status === "approved").length,                    pending: ngos.filter((n: any) => n.status === "pending").length },
      { role: "volunteer", total: volunteers.length,  active: volunteers.filter((v: any) => v.availability || v.status === "idle").length, pending: volunteers.filter((v: any) => v.status === "pending").length },
    ];

    res.status(200).json({ needCategoryAnalytics, volunteerDeploymentStats, ngoActivityLevels, roleBreakdown });
  } catch (error) {
    res.status(500).json({ error: "Failed to compute analytics", details: (error as Error).message });
  }
}

export async function getMapLayers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const snapshot = await dbRef("MapLayer").once("value");
    res.status(200).json(snapshot.exists() ? snapshot.val() : {});
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch map layers", details: (error as Error).message });
  }
}

// B2 fix: Real persistent delete for a request (admin only)
export async function deleteRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { requestId } = req.params;
    const snap = await dbRef(`Request/${requestId}`).once("value");
    if (!snap.exists()) {
      res.status(404).json({ error: "Request not found" });
      return;
    }
    // Free up any assigned volunteers before deleting
    const request = snap.val() as any;
    const volunteerIds: string[] = request.assignedVolunteerIds || [];
    if (volunteerIds.length > 0) {
      const updates: Record<string, any> = {};
      volunteerIds.forEach(id => {
        updates[`Volunteer/${id}/status`] = "idle";
        updates[`Volunteer/${id}/availability`] = true;
        updates[`Volunteer/${id}/currentRequestId`] = null;
      });
      await dbRef("/").update(updates);
    }
    await dbRef(`Request/${requestId}`).remove();
    res.status(200).json({ message: "Request deleted", requestId });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete request", details: (error as Error).message });
  }
}
