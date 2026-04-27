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

    // Filter only ACTIVE volunteers belonging to the NGO
    if (req.user?.role === "ngo") {
      const ngoId = req.user.uid;
      volunteers = volunteers.filter(v => v.ngoId === ngoId && (v.status as string) === "ACTIVE");
    } else {
      volunteers = volunteers.filter(v => (v.status as string) === "ACTIVE");
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
    
    if ((volunteer.status as string) !== "ACTIVE") {
      res.status(404).json({ error: "Volunteer is not active or approved" });
      return;
    }
    
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
    const snapshot = await dbRef("VolunteerOpportunity").once("value");
    if (!snapshot.exists()) {
      res.status(200).json({ opportunities: [] });
      return;
    }
    const raw = snapshot.val() as Record<string, any>;
    const opportunities = Object.values(raw).filter((o: any) => o.status !== "closed");
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

    const applicationId = `APP_${Date.now()}_${volunteerId}`;
    const application = {
      applicationId,
      opportunityId,
      volunteerId,
      message: message || "",
      status: "PENDING",
      appliedAt: new Date().toISOString(),
    };

    // Store under VolunteerOpportunity applicants AND under VolunteerApplication for easy lookup
    await Promise.all([
      dbRef(`VolunteerOpportunity/${opportunityId}/applicants/${volunteerId}`).set(application),
      dbRef(`VolunteerApplication/${applicationId}`).set(application),
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

// ── NEW: Volunteer Assignments ────────────────────────────────────────────────

export async function getVolunteerAssignments(req: AuthenticatedRequest, res: Response): Promise<void> {
  try {
    const { volunteerId } = req.params;

    // Find all requests where this volunteer is in the team assignments
    const [requestsSnap, teamsSnap] = await Promise.all([
      dbRef("Request").once("value"),
      dbRef("TeamAssignment").orderByChild("volunteerId").equalTo(volunteerId).once("value"),
    ]);

    const requests = Object.values((requestsSnap.val() || {}) as Record<string, any>);
    const teamAssignments = Object.values(teamsSnap.val() || {}) as any[];

    // Build assignment list: combine request data with team data
    const assignments = teamAssignments.map((ta: any) => {
      const request = requests.find((r: any) => r.requestId === ta.requestId);
      return {
        assignmentId: ta.assignmentId || ta.requestId,
        requestId: ta.requestId,
        requestTitle: request?.title || ta.requestTitle || "Assignment",
        ngoName: request?.ngoName || ta.ngoName || "NGO",
        teamName: ta.teamName || "Team",
        teamLeader: ta.teamLeader || "—",
        status: ta.status || request?.status || "in_progress",
        campLocation: request?.location || ta.campLocation || null,
        teamMembers: ta.teamMembers || [],
        checklist: request?.checklist || ta.checklist || [],
        resources: request?.assignedResources ? Object.entries(request.assignedResources).map(([k, v]: any) => ({
          type: k, quantity: v, deliveryStatus: "Delivered"
        })) : [],
      };
    });

    res.status(200).json({ assignments });
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
    const checklist: any[] = request.checklist || [];
    const taskIndex = checklist.findIndex((t: any) => t.id === taskId);

    if (taskIndex === -1) {
      res.status(404).json({ error: "Task not found in checklist" });
      return;
    }

    checklist[taskIndex] = { ...checklist[taskIndex], status, updatedBy: volunteerId, updatedAt: new Date().toISOString() };
    await dbRef(`Request/${requestId}`).update({ checklist });

    res.status(200).json({ message: "Task status updated", taskId, status });
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

