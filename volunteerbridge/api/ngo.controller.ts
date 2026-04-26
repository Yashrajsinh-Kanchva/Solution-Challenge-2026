import { Response } from "express";
import { AuthenticatedRequest } from "@/lib/firebase/auth";
import { dbRef } from "@/lib/firebase/firestore";
import { RequestRecord } from "@/lib/types/rtdb";

export async function getAssignedRequestsForNgo(
  req: AuthenticatedRequest,
  res: Response
): Promise<void> {
  try {
    const { ngoId } = req.params;

    const [specificSnap, sharedSnap, volunteersSnap] = await Promise.all([
      dbRef("Request").orderByChild("assignedNgoId").equalTo(ngoId).once("value"),
      dbRef("Request").orderByChild("assignedNgoId").equalTo("ALL").once("value"),
      dbRef("Volunteer").once("value")
    ]);

    const specificRequests = Object.values((specificSnap.val() || {}) as Record<string, RequestRecord>);
    const sharedRequests = Object.values((sharedSnap.val() || {}) as Record<string, RequestRecord>);
    const volunteers = (volunteersSnap.val() || {}) as Record<string, any>;
    
    const assigned = [...specificRequests, ...sharedRequests].map(request => {
      const volunteerIds = request.assignedVolunteerIds || [];
      const assignedVolunteers = volunteerIds.map(id => volunteers[id]).filter(Boolean);
      return {
        ...request,
        assignedVolunteers
      };
    });


    res.status(200).json({ requests: assigned });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch NGO requests", details: (error as Error).message });
  }
}


export async function getNgoDashboardStats(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { ngoId } = req.params;

    const [specificSnap, sharedSnap, volunteersSnap, ngoSnap] = await Promise.all([
      dbRef("Request").orderByChild("assignedNgoId").equalTo(ngoId).once("value"),
      dbRef("Request").orderByChild("assignedNgoId").equalTo("ALL").once("value"),
      dbRef("Volunteer").orderByChild("ngoId").equalTo(ngoId).once("value"),
      dbRef(`NGO/${ngoId}`).once("value")
    ]);

    const specificRequests = Object.values((specificSnap.val() || {}) as Record<string, RequestRecord>);
    const sharedRequests = Object.values((sharedSnap.val() || {}) as Record<string, RequestRecord>);
    const requests = [...specificRequests, ...sharedRequests];
    
    const volunteers = Object.values((volunteersSnap.val() || {}) as Record<string, any>);
    const ngo = ngoSnap.val();

    // Volunteer Insights: Top 3 Skills
    const allSkills = volunteers.flatMap(v => v.skills || []);
    const skillCounts: Record<string, number> = {};
    allSkills.forEach(skill => {
      skillCounts[skill] = (skillCounts[skill] || 0) + 1;
    });
    const topSkills = Object.entries(skillCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name, count]) => ({ name, count }));

    const stats = {
      totalRequests: requests.length,
      activeTasks: requests.filter(r => r.status !== "completed" && r.status !== "Completed").length,
      completedTasks: requests.filter(r => r.status === "completed" || r.status === "Completed").length,
      availableVolunteers: volunteers.filter(v => v.availability).length,
      totalVolunteers: volunteers.length,
      topSkills,
      resources: ngo?.availableResources || { food: 0, medicine: 0, shelter: 0 },
      recentActivity: requests
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 10)
    };

    res.status(200).json(stats);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch NGO stats", details: (error as Error).message });
  }
}

export async function getNgoVolunteers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { ngoId } = req.params;
    
    // Fetch volunteers and active requests in parallel for deriving status
    const [volSnap, reqSnap] = await Promise.all([
      dbRef("Volunteer").orderByChild("ngoId").equalTo(ngoId).once("value"),
      dbRef("Request").orderByChild("assignedNgoId").equalTo(ngoId).once("value")
    ]);
    
    const volunteerMap = (volSnap.val() || {}) as Record<string, any>;
    const requests = Object.values((reqSnap.val() || {}) as Record<string, RequestRecord>);
    
    // Get IDs of all volunteers currently on an ACTIVE task
    const activeVolunteerIds = new Set<string>();
    const activeTasksMap: Record<string, string> = {}; // volunteerId -> requestId

    requests.forEach(req => {
      const isActive = req.status !== "completed" && req.status !== "Completed" && req.status !== "Rejected";
      if (isActive && req.assignedVolunteerIds) {
        req.assignedVolunteerIds.forEach(id => {
          activeVolunteerIds.add(id);
          activeTasksMap[id] = req.requestId;
        });
      }
    });

    // Derive status and availability dynamically, supporting both legacy and new data
    const volunteers = Object.values(volunteerMap)
      .filter(v => !v.status || v.status === "ACTIVE" || v.status === "idle" || v.status === "assigned")
      .map(v => {
        const isOnActiveTask = activeVolunteerIds.has(v.volunteerId);
        return {
          ...v,
          onTaskStatus: isOnActiveTask ? "assigned" : "idle",
          availability: !isOnActiveTask,
          currentRequestId: isOnActiveTask ? activeTasksMap[v.volunteerId] : null
        };
      });

    res.status(200).json(volunteers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch NGO volunteers", details: (error as Error).message });
  }
}

export async function updateNgoResources(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { ngoId } = req.params;
    const { food, medicine, shelter } = req.body as { food?: number; medicine?: number; shelter?: number };

    if (food === undefined && medicine === undefined && shelter === undefined) {
      res.status(400).json({ error: "Provide at least one resource value" });
      return;
    }

    const updates: Record<string, number> = {};
    if (food !== undefined) {
      updates.food = food;
    }
    if (medicine !== undefined) {
      updates.medicine = medicine;
    }
    if (shelter !== undefined) {
      updates.shelter = shelter;
    }

    await dbRef(`NGO/${ngoId}/availableResources`).update(updates);

    res.status(200).json({ message: "NGO resources updated", ngoId, updated: updates });
  } catch (error) {
    res.status(500).json({ error: "Failed to update resources", details: (error as Error).message });
  }
}

export async function getVolunteerJoinRequests(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { ngoId } = req.params;
    const snapshot = await dbRef("VolunteerRequest").orderByChild("ngoId").equalTo(ngoId).once("value");
    const requests = Object.values(snapshot.val() || {});
    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch join requests", details: (error as Error).message });
  }
}

export async function handleVolunteerJoinRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { requestId } = req.params;
    const { action } = req.body; // 'APPROVE' or 'REJECT'

    const requestSnap = await dbRef(`VolunteerRequest/${requestId}`).once("value");
    if (!requestSnap.exists()) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    const request = requestSnap.val();
    const status = action === "APPROVE" ? "APPROVED" : "REJECTED";

    await dbRef(`VolunteerRequest/${requestId}`).update({ status });

    if (action === "APPROVE") {
      const volunteerData = {
        volunteerId: request.volunteerId,
        name: request.name,
        email: request.email,
        phone: request.phone,
        skills: request.skills || [],
        location: request.location,
        availability: true,
        status: "ACTIVE",
        currentRequestId: null,
        ngoId: request.ngoId,
        registeredAt: new Date().toISOString()
      };

      // Create or update volunteer record
      await dbRef(`Volunteer/${request.volunteerId}`).set(volunteerData);
    }

    res.status(200).json({ message: `Request ${status.toLowerCase()} successfully`, status });
  } catch (error) {
    res.status(500).json({ error: "Failed to handle join request", details: (error as Error).message });
  }
}

export async function assignResourcesToRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { ngoId, requestId } = req.params;
    const assignedResources = req.body as { food?: number; medicine?: number; shelter?: number };

    const [requestSnap, ngoSnap] = await Promise.all([
      dbRef(`Request/${requestId}`).once("value"),
      dbRef(`NGO/${ngoId}`).once("value")
    ]);

    if (!requestSnap.exists()) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    if (!ngoSnap.exists()) {
      res.status(404).json({ error: "NGO not found" });
      return;
    }

    const ngo = ngoSnap.val();
    const currentInventory = ngo.availableResources || { food: 0, medicine: 0, shelter: 0 };
    
    // Check if enough resources
    if (
      (assignedResources.food && (currentInventory.food || 0) < assignedResources.food) ||
      (assignedResources.medicine && (currentInventory.medicine || 0) < assignedResources.medicine) ||
      (assignedResources.shelter && (currentInventory.shelter || 0) < assignedResources.shelter)
    ) {
      res.status(400).json({ error: "Insufficient resources in inventory" });
      return;
    }

    // Deduct from inventory
    const updatedInventory = {
      food: (currentInventory.food || 0) - (assignedResources.food || 0),
      medicine: (currentInventory.medicine || 0) - (assignedResources.medicine || 0),
      shelter: (currentInventory.shelter || 0) - (assignedResources.shelter || 0)
    };

    const request = requestSnap.val();
    const currentAssigned = request.assignedResources || { food: 0, medicine: 0, shelter: 0 };
    
    // Update request resources
    const updatedRequestResources = {
      food: (currentAssigned.food || 0) + (assignedResources.food || 0),
      medicine: (currentAssigned.medicine || 0) + (assignedResources.medicine || 0),
      shelter: (currentAssigned.shelter || 0) + (assignedResources.shelter || 0)
    };

    await Promise.all([
      dbRef(`NGO/${ngoId}/availableResources`).update(updatedInventory),
      dbRef(`Request/${requestId}`).update({ assignedResources: updatedRequestResources })
    ]);

    res.status(200).json({ 
      message: "Resources assigned successfully", 
      assigned: assignedResources,
      remainingInventory: updatedInventory 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to assign resources", details: (error as Error).message });
  }
}

export async function registerNgo(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const registrationData = req.body;
    const ngoId = `ngo-${Date.now()}`;
    
    const newNgo = {
      ...registrationData,
      ngoId,
      id: ngoId,
      status: "pending",
      submittedAt: new Date().toISOString(),
      verified: false,
      categories: registrationData.categories || ["Emergency"],
      rating: 0,
      serviceRadius: registrationData.serviceRadius || 50,
      location: registrationData.location || { lat: 23.0225, lng: 72.5714, address: "Ahmedabad, Gujarat" }
    };

    await dbRef(`NGO/${ngoId}`).set(newNgo);

    res.status(201).json({ 
      message: "NGO registration request submitted successfully", 
      ngoId,
      ngo: newNgo 
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit NGO registration", details: (error as Error).message });
  }
}

export async function getNgoById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { ngoId } = req.params;
    const snapshot = await dbRef(`NGO/${ngoId}`).once("value");

    if (!snapshot.exists()) {
      res.status(404).json({ error: "NGO not found" });
      return;
    }

    res.status(200).json(snapshot.val());
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch NGO details", details: (error as Error).message });
  }
}

