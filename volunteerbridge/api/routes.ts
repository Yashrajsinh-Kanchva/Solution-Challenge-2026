import { Router } from "express";
import { authenticateRequest, requireRoles } from "@/lib/firebase/auth";
import { registerCitizen, getCitizenById } from "@/api/citizen.controller";
import {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequestStatus,
  updateRequestChecklist
} from "@/api/request.controller";
import { approveRequest, assignNgoForRequest, getAllNgos, approveNgo, getDashboardStats, getAllUsers, getAssignments, createAssignment, getAnalytics, getMapLayers } from "@/api/admin.controller";
import { getAssignedRequestsForNgo, updateNgoResources, getNgoDashboardStats, getNgoVolunteers, assignResourcesToRequest, getNgoById, registerNgo, getVolunteerJoinRequests, handleVolunteerJoinRequest } from "@/api/ngo.controller";
import { assignVolunteer, unassignVolunteer, updateVolunteerStatus, getVolunteerById, submitJoinRequest, getVolunteerJoinRequestsByVolunteerId } from "@/api/volunteer.controller";
import { getPredictions } from "@/api/prediction.controller";

const apiRouter = Router();

apiRouter.use(authenticateRequest);

apiRouter.get("/dashboard", requireRoles(["admin"]), getDashboardStats);
apiRouter.get("/users", requireRoles(["admin"]), getAllUsers);
apiRouter.get("/assignments", requireRoles(["admin"]), getAssignments);
apiRouter.post("/assignments", requireRoles(["admin"]), createAssignment);
apiRouter.get("/predictions", requireRoles(["admin"]), getPredictions);
apiRouter.get("/analytics", requireRoles(["admin"]), getAnalytics);
apiRouter.get("/map-layers", requireRoles(["admin"]), getMapLayers);
apiRouter.get("/ngos", requireRoles(["admin"]), getAllNgos);
apiRouter.post("/ngos/register", requireRoles(["citizen", "admin"]), registerNgo);
apiRouter.patch("/ngos/:ngoId/approve", requireRoles(["admin"]), approveNgo);

apiRouter.post("/citizens/register", requireRoles(["citizen", "admin"]), registerCitizen);
apiRouter.get("/citizens/:userId", requireRoles(["citizen", "admin"]), getCitizenById);

apiRouter.post("/requests", requireRoles(["citizen", "admin"]), createRequest);
apiRouter.get("/requests", requireRoles(["admin", "ngo", "volunteer"]), getAllRequests);
apiRouter.get("/requests/:requestId", requireRoles(["ngo", "admin", "citizen", "volunteer"]), getRequestById);
apiRouter.patch("/requests/:requestId/status", requireRoles(["ngo", "admin", "volunteer"]), updateRequestStatus);
apiRouter.post("/requests/:requestId/checklist", requireRoles(["ngo", "admin"]), updateRequestChecklist);

apiRouter.post("/admin/requests/:requestId/approve", requireRoles(["admin"]), approveRequest);
apiRouter.post("/admin/requests/:requestId/assign-ngo", requireRoles(["admin"]), assignNgoForRequest);

apiRouter.get("/ngos/:ngoId/requests", requireRoles(["ngo", "admin"]), getAssignedRequestsForNgo);
apiRouter.get("/ngos/:ngoId/stats", requireRoles(["ngo", "admin"]), getNgoDashboardStats);
apiRouter.get("/ngos/:ngoId/volunteers", requireRoles(["ngo", "admin"]), getNgoVolunteers);
apiRouter.get("/ngos/:ngoId/volunteer-requests", requireRoles(["ngo", "admin"]), getVolunteerJoinRequests);
apiRouter.post("/ngos/:ngoId/volunteer-requests/:requestId/action", requireRoles(["ngo", "admin"]), handleVolunteerJoinRequest);
apiRouter.get("/ngos/:ngoId", requireRoles(["ngo", "admin"]), getNgoById);
apiRouter.patch("/ngos/:ngoId/resources", requireRoles(["ngo", "admin"]), updateNgoResources);
apiRouter.post("/ngos/:ngoId/requests/:requestId/resources", requireRoles(["ngo", "admin"]), assignResourcesToRequest);

apiRouter.post("/volunteers/assign/:requestId", requireRoles(["admin", "ngo"]), assignVolunteer);
apiRouter.post("/volunteers/unassign/:requestId", requireRoles(["admin", "ngo"]), unassignVolunteer);
apiRouter.post("/volunteers/request-join/:ngoId", requireRoles(["volunteer", "admin"]), submitJoinRequest);
apiRouter.get("/volunteers/:volunteerId/join-requests", requireRoles(["volunteer", "admin"]), getVolunteerJoinRequestsByVolunteerId);
apiRouter.get("/volunteers/:volunteerId", requireRoles(["admin", "ngo", "volunteer"]), getVolunteerById);
apiRouter.patch("/volunteers/:volunteerId/status", requireRoles(["volunteer", "admin"]), updateVolunteerStatus);

export default apiRouter;
