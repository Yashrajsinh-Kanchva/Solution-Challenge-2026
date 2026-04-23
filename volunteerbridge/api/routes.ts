import { Router } from "express";
import { authenticateRequest, requireRoles } from "@/lib/firebase/auth";
import { registerCitizen, getCitizenById } from "@/api/citizen.controller";
import {
  createRequest,
  getAllRequests,
  getRequestById,
  updateRequestStatus
} from "@/api/request.controller";
import { approveRequest, assignNgoForRequest } from "@/api/admin.controller";
import { getAssignedRequestsForNgo, updateNgoResources } from "@/api/ngo.controller";
import { assignVolunteer, updateVolunteerStatus } from "@/api/volunteer.controller";

const apiRouter = Router();

apiRouter.use(authenticateRequest);

apiRouter.post("/citizens/register", requireRoles(["citizen", "admin"]), registerCitizen);
apiRouter.get("/citizens/:userId", requireRoles(["citizen", "admin"]), getCitizenById);

apiRouter.post("/requests", requireRoles(["citizen", "admin"]), createRequest);
apiRouter.get("/requests", requireRoles(["admin", "ngo", "volunteer"]), getAllRequests);
apiRouter.get("/requests/:requestId", requireRoles(["citizen", "admin", "ngo", "volunteer"]), getRequestById);
apiRouter.patch("/requests/:requestId/status", requireRoles(["admin", "ngo", "volunteer"]), updateRequestStatus);

apiRouter.post("/admin/requests/:requestId/approve", requireRoles(["admin"]), approveRequest);
apiRouter.post("/admin/requests/:requestId/assign-ngo", requireRoles(["admin"]), assignNgoForRequest);

apiRouter.get("/ngos/:ngoId/requests", requireRoles(["ngo", "admin"]), getAssignedRequestsForNgo);
apiRouter.patch("/ngos/:ngoId/resources", requireRoles(["ngo", "admin"]), updateNgoResources);

apiRouter.post("/volunteers/assign/:requestId", requireRoles(["admin", "ngo"]), assignVolunteer);
apiRouter.patch("/volunteers/:volunteerId/status", requireRoles(["volunteer", "admin"]), updateVolunteerStatus);

export default apiRouter;
