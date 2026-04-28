import { Response } from "express";
import { AuthenticatedRequest } from "@/lib/firebase/auth";
import { dbRef } from "@/lib/firebase/firestore";
import { RequestRecord, VolunteerRecord, VolunteerStatus } from "@/lib/types/rtdb";
import { findBestVolunteerForRequest } from "@/lib/utils/matching";

export async function assignVolunteer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { requestId } = req.params;

    const requestSnapshot = await dbRef(`Request/${requestId}`).once("value");
    if (!requestSnapshot.exists()) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    const request = requestSnapshot.val() as RequestRecord;
    const { volunteerId: manualVolunteerId } = req.body;

    const volunteersSnapshot = await dbRef("Volunteer").once("value");
    const volunteerMap = (volunteersSnapshot.val() || {}) as Record<string, VolunteerRecord>;
    let volunteers = Object.values(volunteerMap);

    // Filter ACTIVE volunteers belonging to the NGO
    // Approved volunteers have: status="idle" (or "assigned"), membershipStatus="ACTIVE"
    // Legacy volunteers may have: status="ACTIVE"
    const isActive = (v: any) =>
      v.membershipStatus === "ACTIVE" || (v.status as string)?.toUpperCase() === "ACTIVE" || v.status === "idle";

    if (req.user?.role === "ngo") {
      const ngoId = req.user.uid;
      volunteers = volunteers.filter(v => v.ngoId === ngoId && isActive(v));
    } else {
      volunteers = volunteers.filter(v => isActive(v));
    }

    let selectedVolunteer: VolunteerRecord | undefined;

    if (manualVolunteerId) {
      selectedVolunteer = volunteers.find(v => v.volunteerId === manualVolunteerId);
      if (!selectedVolunteer) {
        res.status(404).json({ error: "Selected volunteer not found or not belonging to your NGO" });
        return;
      }
    } else {
      selectedVolunteer = findBestVolunteerForRequest(request, volunteers) ?? undefined;
    }

    if (!selectedVolunteer) {
      res.status(404).json({ error: "No suitable volunteer found" });
      return;
    }

    const currentVolunteers = request.assignedVolunteerIds || [];
    if (!currentVolunteers.includes(selectedVolunteer.volunteerId)) {
      currentVolunteers.push(selectedVolunteer.volunteerId);
    }

    await dbRef(`Request/${requestId}`).update({
      assignedVolunteerIds: currentVolunteers,
      status: "assigned_to_volunteer"
    });

    await dbRef(`Volunteer/${selectedVolunteer.volunteerId}`).update({
      status: "assigned",
      availability: false,
      currentRequestId: requestId
    });

    res.status(200).json({
      message: "Volunteer assigned",
      requestId,
      volunteerId: selectedVolunteer.volunteerId,
      totalAssigned: currentVolunteers.length
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to assign volunteer", details: (error as Error).message });
  }
}

export async function unassignVolunteer(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { requestId } = req.params;
    const { volunteerId } = req.body;

    if (!volunteerId) {
      res.status(400).json({ error: "Volunteer ID is required" });
      return;
    }

    const requestSnapshot = await dbRef(`Request/${requestId}`).once("value");
    if (!requestSnapshot.exists()) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    const request = requestSnapshot.val() as RequestRecord;
    let currentVolunteers = request.assignedVolunteerIds || [];
    
    if (!currentVolunteers.includes(volunteerId)) {
      res.status(404).json({ error: "Volunteer not assigned to this task" });
      return;
    }

    currentVolunteers = currentVolunteers.filter(id => id !== volunteerId);
    const newStatus = (currentVolunteers.length === 0 ? "Accepted" : "assigned_to_volunteer") as any;

    await dbRef(`Request/${requestId}`).update({
      assignedVolunteerIds: currentVolunteers,
      status: newStatus
    });

    await dbRef(`Volunteer/${volunteerId}`).update({
      status: "idle",
      availability: true,
      currentRequestId: null
    });

    res.status(200).json({
      message: "Volunteer unassigned",
      requestId,
      volunteerId,
      totalAssigned: currentVolunteers.length
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to unassign volunteer", details: (error as Error).message });
  }
}

export async function updateVolunteerStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { volunteerId } = req.params;
    const { status, availability, currentRequestId } = req.body as {
      status?: VolunteerStatus;
      availability?: boolean;
      currentRequestId?: string | null;
    };

    if (status === undefined && availability === undefined && currentRequestId === undefined) {
      res.status(400).json({ error: "Provide at least one field to update" });
      return;
    }

    const updates: Record<string, unknown> = {};
    if (status !== undefined) {
      updates.status = status;
    }
    if (availability !== undefined) {
      updates.availability = availability;
    }
    if (currentRequestId !== undefined) {
      updates.currentRequestId = currentRequestId;
    }

    await dbRef(`Volunteer/${volunteerId}`).update(updates);

    res.status(200).json({ message: "Volunteer status updated", status });
  } catch (error) {
    res.status(500).json({ error: "Failed to update volunteer status", details: (error as Error).message });
  }
}

export async function getVolunteerJoinRequestsByVolunteerId(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { volunteerId } = req.params;
    const snapshot = await dbRef("VolunteerRequest").orderByChild("volunteerId").equalTo(volunteerId).once("value");
    const requests = Object.values(snapshot.val() || {});
    res.status(200).json({ requests });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch join requests", details: (error as Error).message });
  }
}

export async function submitJoinRequest(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { ngoId } = req.params;
    const { volunteerId, name, skills, location, phone, email } = req.body;

    if (!ngoId || !volunteerId) {
      res.status(400).json({ error: "NGO ID and Volunteer ID are required" });
      return;
    }

    const id = `REQ_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const requestData = {
      id,
      volunteerId,
      ngoId,
      name,
      skills: skills || [],
      location,
      phone,
      email,
      status: "PENDING",
      createdAt: new Date().toISOString()
    };

    await dbRef(`VolunteerRequest/${id}`).set(requestData);

    res.status(201).json({ 
      message: "Join request submitted successfully", 
      id,
      status: "PENDING"
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit join request", details: (error as Error).message });
  }
}

export async function getAllVolunteers(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const snapshot = await dbRef("Volunteer").once("value");
    if (!snapshot.exists()) {
      res.status(200).json([]);
      return;
    }
    const raw = snapshot.val() as Record<string, VolunteerRecord>;
    const volunteers = Object.values(raw).map(v => ({
      volunteerId:  v.volunteerId,
      name:         v.name,
      skills:       v.skills ?? [],
      ngoId:        v.ngoId,
      status:       v.status,
      availability: v.availability,
      location:     v.location ?? null,
    }));
    res.status(200).json(volunteers);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch volunteers", details: (error as Error).message });
  }
}

export async function getVolunteerById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { volunteerId } = req.params;
    const [volSnapshot, tasksSnapshot] = await Promise.all([
      dbRef(`Volunteer/${volunteerId}`).once("value"),
      dbRef("Request").orderByChild("assignedVolunteerIds").once("value") // This might be slow if filtered by child on array is not supported well in RTDB
    ]);

    // Note: RTDB doesn't support orderByChild on an array field well. 
    // We should fetch active tasks and check locally or better:
    // Filter active tasks and check if volunteerId is in the assignedVolunteerIds.
    
    if (!volSnapshot.exists()) {
      res.status(404).json({ error: "Volunteer not found" });
      return;
    }

    const volunteer = volSnapshot.val() as VolunteerRecord;
    
    // Check for active tasks involving this volunteer
    const activeTasksSnap = await dbRef("Request").once("value");
    const tasks = Object.values((activeTasksSnap.val() || {}) as Record<string, RequestRecord>);
    
    const activeTask = tasks.find(t =>
      t.assignedVolunteerIds?.includes(volunteerId) &&
      (t.status as string) !== "completed" && (t.status as string) !== "Completed" && (t.status as string) !== "Rejected"
    );

    const derivedVolunteer = {
      ...volunteer,
      status: activeTask ? "assigned" : "idle",
      availability: !activeTask,
      currentRequestId: activeTask ? activeTask.requestId : null
    };

    res.status(200).json(derivedVolunteer);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch volunteer", details: (error as Error).message });
  }
}

// ── NEW: Volunteer Opportunities ──────────────────────────────────────────────

export async function getVolunteerOpportunities(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    // Determine the volunteer's NGO so we can filter opportunities
    const volunteerId = req.headers["x-volunteer-id"] as string | undefined;
    let volunteerNgoId: string | null = null;
    if (volunteerId) {
      const volSnap = await dbRef(`Volunteer/${volunteerId}`).once("value");
      volunteerNgoId = volSnap.val()?.ngoId || null;
    }

    const snapshot = await dbRef("VolunteerOpportunity").once("value");
    if (!snapshot.exists()) {
      res.status(200).json({ opportunities: [] });
      return;
    }
    const raw = snapshot.val() as Record<string, any>;
    let opportunities = Object.values(raw).filter((o: any) => o.status !== "closed");

    // If volunteer is linked to an NGO, show only that NGO's opportunities
    if (volunteerNgoId) {
      opportunities = opportunities.filter((o: any) => o.ngoId === volunteerNgoId);
    }

    res.status(200).json({ opportunities });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch opportunities", details: (error as Error).message });
  }
}

export async function getVolunteerOpportunityById(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { opportunityId } = req.params;
    const snapshot = await dbRef(`VolunteerOpportunity/${opportunityId}`).once("value");
    if (!snapshot.exists()) {
      res.status(404).json({ error: "Opportunity not found" });
      return;
    }
    res.status(200).json(snapshot.val());
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch opportunity", details: (error as Error).message });
  }
}

export async function applyToOpportunity(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { opportunityId } = req.params;
    const { volunteerId, message } = req.body;

    if (!volunteerId || !opportunityId) {
      res.status(400).json({ error: "volunteerId and opportunityId are required" });
      return;
    }

    const oppSnap = await dbRef(`VolunteerOpportunity/${opportunityId}`).once("value");
    if (!oppSnap.exists()) {
      res.status(404).json({ error: "Opportunity not found" });
      return;
    }

    // Fetch volunteer details for the join request record
    const volSnap = await dbRef(`Volunteer/${volunteerId}`).once("value");
    const vol = volSnap.val();

    const applicationId = `APP_${Date.now()}_${volunteerId}`;
    const opp = oppSnap.val();
    const application = {
      applicationId,
      opportunityId,
      volunteerId,
      message: message || "",
      status: "PENDING",
      appliedAt: new Date().toISOString(),
    };

    // ── Build a VolunteerRequest record so NGO sees this in their "Volunteer Requests" tab ──
    const joinRequestId = `VR_${Date.now()}_${volunteerId}`;
    const joinRequest = {
      id:           joinRequestId,
      volunteerId,
      ngoId:        opp.ngoId || "",
      opportunityId,
      name:         vol?.name || volunteerId,
      email:        vol?.email || "",
      phone:        vol?.phone || "",
      skills:       vol?.skills || [],
      location:     vol?.location || null,
      message:      message || "",
      status:       "PENDING",
      requestType:  "opportunity_application", // distinguishes from direct join requests
      createdAt:    new Date().toISOString(),
    };

    // Store application + NGO-visible join request in parallel
    await Promise.all([
      dbRef(`VolunteerOpportunity/${opportunityId}/applicants/${volunteerId}`).set(application),
      dbRef(`VolunteerApplication/${applicationId}`).set(application),
      dbRef(`VolunteerRequest/${joinRequestId}`).set(joinRequest),
    ]);

    res.status(201).json({ message: "Application submitted", applicationId, status: "PENDING" });
  } catch (error) {
    res.status(500).json({ error: "Failed to submit application", details: (error as Error).message });
  }
}

export async function getVolunteerApplications(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { volunteerId } = req.params;
    const snapshot = await dbRef("VolunteerApplication")
      .orderByChild("volunteerId")
      .equalTo(volunteerId)
      .once("value");
    const applications = Object.values(snapshot.val() || {});
    res.status(200).json({ applications });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch applications", details: (error as Error).message });
  }
}

// ── Ahmedabad area geocoding table — resolves string location addresses to lat/lng ──
const AREA_GEOCODES: Record<string, { lat: number; lng: number }> = {
  "vasna":       { lat: 23.0010, lng: 72.5588 },
  "bopal":       { lat: 23.0352, lng: 72.4668 },
  "maninagar":   { lat: 22.9930, lng: 72.6060 },
  "satellite":   { lat: 23.0395, lng: 72.5185 },
  "naranpura":   { lat: 23.0562, lng: 72.5580 },
  "navrangpura": { lat: 23.0433, lng: 72.5679 },
  "bapunagar":   { lat: 23.0490, lng: 72.6310 },
  "nikol":       { lat: 23.0550, lng: 72.6512 },
  "gota":        { lat: 23.1013, lng: 72.5330 },
  "chandkheda":  { lat: 23.1046, lng: 72.5893 },
  "thaltej":     { lat: 23.0571, lng: 72.4951 },
  "ward 12":     { lat: 23.0280, lng: 72.5750 },
  "river belt":  { lat: 23.0160, lng: 72.5580 },
  "industrial":  { lat: 23.0380, lng: 72.5890 },
  "transit block": { lat: 23.0097, lng: 72.5800 },
  "ahmedabad":   { lat: 23.0225, lng: 72.5714 },
};

function resolveLocation(loc: any): { lat: number; lng: number; address: string } | null {
  if (!loc) return null;
  // Already an object with lat/lng
  if (typeof loc === "object" && loc.lat && loc.lng) {
    return { lat: Number(loc.lat), lng: Number(loc.lng), address: loc.address || "" };
  }
  // String address — try geocode lookup
  const addr = typeof loc === "string" ? loc : (loc.address || "");
  if (!addr) return null;
  const lower = addr.toLowerCase();
  for (const [key, coords] of Object.entries(AREA_GEOCODES)) {
    if (lower.includes(key)) return { ...coords, address: addr };
  }
  // Default to Ahmedabad city centre
  return { lat: 23.0225, lng: 72.5714, address: addr };
}

// ── NEW: Volunteer Assignments ────────────────────────────────────────────────

export async function getVolunteerAssignments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { volunteerId } = req.params;

    // Fetch all requests and NGOs in parallel
    const [requestsSnap, volunteersSnap, ngosSnap] = await Promise.all([
      dbRef("Request").once("value"),
      dbRef("Volunteer").once("value"),
      dbRef("NGO").once("value"),
    ]);

    const allRequests = Object.values((requestsSnap.val() || {}) as Record<string, any>);
    const allVolunteers = (volunteersSnap.val() || {}) as Record<string, any>;
    const allNgos     = (ngosSnap.val()     || {}) as Record<string, any>;

    // Filter only requests where this volunteer is assigned
    const assignedRequests = allRequests.filter((r: any) =>
      Array.isArray(r.assignedVolunteerIds) && r.assignedVolunteerIds.includes(volunteerId)
    );

    // Build rich assignment objects from Request data (the single source of truth)
    const assignments = assignedRequests.map((request: any) => {
      const ngo = allNgos[request.assignedNgoId] ?? null;
      const ngoName = ngo?.ngoName || ngo?.name || request.assignedNgoId || "NGO";

      // Build team members list from all volunteers assigned to this request
      const teamMembers = (request.assignedVolunteerIds || [])
        .map((vid: string) => allVolunteers[vid])
        .filter(Boolean)
        .map((v: any) => ({
          volunteerId: v.volunteerId,
          name: v.name || v.volunteerId,
          location: v.location ?? null,
        }));

      // Build resources list from assignedResources map
      const resources = request.assignedResources
        ? Object.entries(request.assignedResources as Record<string, number>)
            .filter(([, qty]) => (qty as number) > 0)
            .map(([type, quantity]) => ({ type, quantity, deliveryStatus: "Delivered" }))
        : [];

      return {
        assignmentId:  request.requestId,
        requestId:     request.requestId,
        requestTitle:  request.title   || "Untitled Task",
        description:   request.description || "",
        ngoName,
        ngoId:         request.assignedNgoId || "",
        teamName:      `${ngoName} Team`,
        teamLeader:    ngo?.contactName || "—",
        status:        request.status  || "in_progress",
        urgency:       request.urgency || "medium",
        category:      request.category || "",
        campLocation:  resolveLocation(request.location),
        teamMembers,
        // ── Normalize checklist: Firebase may return keyed object instead of array ──
        checklist: Array.isArray(request.checklist)
          ? request.checklist
          : request.checklist && typeof request.checklist === "object"
            ? Object.values(request.checklist)
            : [],
        resources,
        assignedAt:    request.updatedAt || request.createdAt || null,
      };
    });

    res.status(200).json(assignments);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch assignments", details: (error as Error).message });
  }
}

export async function updateChecklistTaskStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { requestId, taskId } = req.params;
    const { status, volunteerId } = req.body;

    if (!status || !volunteerId) {
      res.status(400).json({ error: "status and volunteerId are required" });
      return;
    }

    const reqSnap = await dbRef(`Request/${requestId}`).once("value");
    if (!reqSnap.exists()) {
      res.status(404).json({ error: "Request not found" });
      return;
    }

    const request = reqSnap.val() as any;

    // ── Ownership check: volunteer must be assigned to this request ──
    const assignedIds: string[] = request.assignedVolunteerIds || [];
    if (!assignedIds.includes(volunteerId)) {
      res.status(403).json({
        error: "Forbidden: you are not assigned to this task",
        volunteerId,
        requestId,
      });
      return;
    }

    // ── Normalize checklist: Firebase may return {0:{},1:{}} object instead of array ──
    const rawChecklist = request.checklist;
    const checklist: any[] = Array.isArray(rawChecklist)
      ? rawChecklist
      : rawChecklist && typeof rawChecklist === "object"
        ? Object.values(rawChecklist)
        : [];

    // ── Find task by string-coerced ID (handles both string "chk-x-1" and legacy numeric 1) ──
    const taskIndex = checklist.findIndex((t: any) => String(t.id) === String(taskId));

    if (taskIndex === -1) {
      res.status(404).json({ error: "Task not found in checklist", taskId, available: checklist.map(t => t.id) });
      return;
    }

    const done = status === "Done";
    checklist[taskIndex] = {
      ...checklist[taskIndex],
      status,
      done,
      updatedBy: volunteerId,
      updatedAt: new Date().toISOString(),
    };

    // ── Write directly to checklist sub-path with .set() to preserve array structure ──
    await dbRef(`Request/${requestId}/checklist`).set(checklist);

    // ── Auto-complete: if every checklist item is now "Done", mark the request completed ──
    const allDone = checklist.every((t: any) => t.status === "Done" || t.done === true);
    if (allDone && checklist.length > 0) {
      await dbRef(`Request/${requestId}`).update({ status: "completed", completedAt: new Date().toISOString() });

      // Free up all assigned volunteers
      const volunteerIds: string[] = request.assignedVolunteerIds || [];
      if (volunteerIds.length > 0) {
        const updates: Record<string, any> = {};
        volunteerIds.forEach(id => {
          updates[`Volunteer/${id}/status`]          = "idle";
          updates[`Volunteer/${id}/availability`]    = true;
          updates[`Volunteer/${id}/currentRequestId`] = null;
        });
        await dbRef("/").update(updates);
      }
    }

    res.status(200).json({ message: "Task status updated", taskId, status, allDone });
  } catch (error) {
    res.status(500).json({ error: "Failed to update task status", details: (error as Error).message });
  }
}

export async function updateVolunteerProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { volunteerId } = req.params;
    const { name, email, phone, skills, location, availability, bio } = req.body;

    const updates: Record<string, any> = {};
    if (name !== undefined) updates.name = name;
    if (email !== undefined) updates.email = email;
    if (phone !== undefined) updates.phone = phone;
    if (skills !== undefined) updates.skills = skills;
    if (location !== undefined) updates.location = location;
    if (availability !== undefined) updates.availability = availability;
    if (bio !== undefined) updates.bio = bio;

    if (Object.keys(updates).length === 0) {
      res.status(400).json({ error: "No fields provided to update" });
      return;
    }

    updates.updatedAt = new Date().toISOString();
    await dbRef(`Volunteer/${volunteerId}`).update(updates);

    res.status(200).json({ message: "Profile updated", volunteerId, updated: updates });
  } catch (error) {
    res.status(500).json({ error: "Failed to update profile", details: (error as Error).message });
  }
}

