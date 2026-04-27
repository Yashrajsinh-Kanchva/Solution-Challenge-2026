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
      volunteers = volunteers.filter(v => v.ngoId === ngoId && v.status === "ACTIVE");
    } else {
      volunteers = volunteers.filter(v => v.status === "ACTIVE");
    }

    let selectedVolunteer: VolunteerRecord | undefined;

    if (manualVolunteerId) {
      selectedVolunteer = volunteers.find(v => v.volunteerId === manualVolunteerId);
      if (!selectedVolunteer) {
        res.status(404).json({ error: "Selected volunteer not found or not belonging to your NGO" });
        return;
      }
    } else {
      selectedVolunteer = findBestVolunteerForRequest(request, volunteers);
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
    const newStatus = currentVolunteers.length === 0 ? "Accepted" : "assigned_to_volunteer";

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
    
    if (volunteer.status !== "ACTIVE") {
      res.status(404).json({ error: "Volunteer is not active or approved" });
      return;
    }
    
    // Check for active tasks involving this volunteer
    const activeTasksSnap = await dbRef("Request").once("value");
    const tasks = Object.values((activeTasksSnap.val() || {}) as Record<string, RequestRecord>);
    
    const activeTask = tasks.find(t => 
      t.assignedVolunteerIds?.includes(volunteerId) && 
      t.status !== "completed" && t.status !== "Completed" && t.status !== "Rejected"
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
