/**
 * API client for admin screens. The Express API reads Firebase Realtime
 * Database paths seeded by scripts/seed-firebase-admin-data.ts.
 */
const API_BASE = "http://localhost:5000/api";

import { getCookie } from "../utils/cookies";

const getHeaders = (role = "admin") => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${
      role === "ngo"       ? "MOCK_NGO_TOKEN" :
      role === "volunteer" ? "MOCK_VOLUNTEER_TOKEN" :
                            "MOCK_ADMIN_TOKEN"
    }`,
  };
  
  if (role === "ngo") {
    const ngoId = getCookie("vb_ngo_id");
    if (ngoId) headers["x-ngo-id"] = ngoId;
  }

  if (role === "volunteer") {
    const volunteerId = getCookie("vb_volunteer_id");
    if (volunteerId) headers["x-volunteer-id"] = volunteerId;
  }
  
  return headers;
};

async function safeFetch(input: RequestInfo, init?: RequestInit): Promise<any> {
  try {
    const res = await fetch(input, init);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error("Database API request failed:", error);
    return null;
  }
}

export const apiClient = {
  // ... (existing admin methods)

  getNgoRequests: async (ngoId: string) => {
    const data = await safeFetch(`${API_BASE}/ngos/${ngoId}/requests`, { headers: getHeaders("ngo") });
    return Array.isArray(data) ? data : data?.requests ?? [];
  },

  getNgoStats: async (ngoId: string) => {
    return await safeFetch(`${API_BASE}/ngos/${ngoId}/stats`, { headers: getHeaders("ngo") });
  },

  getNgo: async (ngoId: string) => {
    return await safeFetch(`${API_BASE}/ngos/${ngoId}`, { headers: getHeaders("ngo") });
  },

  getNgoVolunteers: async (ngoId: string) => {
    const data = await safeFetch(`${API_BASE}/ngos/${ngoId}/volunteers`, { headers: getHeaders("ngo") });
    return Array.isArray(data) ? data : [];
  },

  updateNgoResources: async (ngoId: string, resources: { food?: number; medicine?: number; shelter?: number }) => {
    return await safeFetch(`${API_BASE}/ngos/${ngoId}/resources`, {
      method: "PATCH",
      headers: getHeaders("ngo"),
      body: JSON.stringify(resources),
    });
  },

  assignResourcesToTask: async (ngoId: string, requestId: string, resources: { food?: number; medicine?: number; shelter?: number }) => {
    return await safeFetch(`${API_BASE}/ngos/${ngoId}/requests/${requestId}/resources`, {
      method: "POST",
      headers: getHeaders("ngo"),
      body: JSON.stringify(resources),
    });
  },

  assignVolunteer: async (requestId: string, volunteerId?: string) => {
    return await safeFetch(`${API_BASE}/volunteers/assign/${requestId}`, {
      method: "POST",
      headers: getHeaders("ngo"),
      body: volunteerId ? JSON.stringify({ volunteerId }) : undefined,
    });
  },

  unassignVolunteer: async (requestId: string, volunteerId: string) => {
    return await safeFetch(`${API_BASE}/volunteers/unassign/${requestId}`, {
      method: "POST",
      headers: getHeaders("ngo"),
      body: JSON.stringify({ volunteerId }),
    });
  },

  getVolunteerJoinRequests: async (ngoId: string) => {
    const data = await safeFetch(`${API_BASE}/ngos/${ngoId}/volunteer-requests`, { headers: getHeaders("ngo") });
    return data?.requests ?? [];
  },

  handleVolunteerJoinRequest: async (ngoId: string, requestId: string, action: "APPROVE" | "REJECT") => {
    return await safeFetch(`${API_BASE}/ngos/${ngoId}/volunteer-requests/${requestId}/action`, {
      method: "POST",
      headers: getHeaders("ngo"),
      body: JSON.stringify({ action }),
    });
  },

  submitVolunteerJoinRequest: async (ngoId: string, payload: any) => {
    return await safeFetch(`${API_BASE}/volunteers/request-join/${ngoId}`, {
      method: "POST",
      headers: getHeaders("volunteer"),
      body: JSON.stringify(payload),
    });
  },

  getVolunteerJoinRequestsByVolunteerId: async (volunteerId: string) => {
    const data = await safeFetch(`${API_BASE}/volunteers/${volunteerId}/join-requests`, { headers: getHeaders("volunteer") });
    return data?.requests ?? [];
  },

  getAllVolunteers: async () => {
    const data = await safeFetch(`${API_BASE}/volunteers`, { headers: getHeaders("volunteer") });
    return Array.isArray(data) ? data : [];
  },

  getVolunteer: async (volunteerId: string) => {
    return await safeFetch(`${API_BASE}/volunteers/${volunteerId}`, { headers: getHeaders("ngo") });
  },

  updateVolunteerProfile: async (volunteerId: string, payload: any) => {
    return await safeFetch(`${API_BASE}/volunteers/${volunteerId}/profile`, {
      method: "PATCH",
      headers: getHeaders("volunteer"),
      body: JSON.stringify(payload),
    });
  },

  getVolunteerApplications: async (volunteerId: string) => {
    const data = await safeFetch(`${API_BASE}/volunteers/${volunteerId}/applications`, { headers: getHeaders("volunteer") });
    return Array.isArray(data) ? data : data?.applications ?? [];
  },

  // Volunteer Opportunities — NGO volunteer postings visible to volunteers
  getVolunteerOpportunities: async () => {
    const data = await safeFetch(`${API_BASE}/volunteer-opportunities`, { headers: getHeaders("volunteer") });
    return Array.isArray(data) ? data : data?.opportunities ?? [];
  },

  getVolunteerOpportunity: async (opportunityId: string) => {
    return await safeFetch(`${API_BASE}/volunteer-opportunities/${opportunityId}`, { headers: getHeaders("volunteer") });
  },

  applyToOpportunity: async (opportunityId: string, payload: any) => {
    return await safeFetch(`${API_BASE}/volunteer-opportunities/${opportunityId}/apply`, {
      method: "POST",
      headers: getHeaders("volunteer"),
      body: JSON.stringify(payload),
    });
  },

  // Volunteer Assignments — teams, checklists, camp maps
  getVolunteerAssignments: async (volunteerId: string) => {
    const data = await safeFetch(`${API_BASE}/volunteers/${volunteerId}/assignments`, { headers: getHeaders("volunteer") });
    return Array.isArray(data) ? data : data?.assignments ?? [];
  },

  updateTaskStatus: async (requestId: string, taskId: string, status: string, volunteerId: string) => {
    return await safeFetch(`${API_BASE}/requests/${requestId}/checklist/${taskId}/status`, {
      method: "PATCH",
      headers: getHeaders("volunteer"),
      body: JSON.stringify({ status, volunteerId }),
    });
  },





  getPredictions: async () => {
    const data = await safeFetch(`${API_BASE}/predictions`, { headers: getHeaders() });
    return Array.isArray(data) ? data : [];
  },

  getDashboardStats: async () => {
    const data = await safeFetch(`${API_BASE}/dashboard`, { headers: getHeaders() });
    return data ?? {
      metrics: {
        totalUsers: 0,
        totalNgos: 0,
        totalVolunteers: 0,
        totalCitizens: 0,
        pendingNgoApprovals: 0,
      },
      recentNgos: [],
      recentUsers: [],
      recentRequests: [],
    };
  },

  getRequests: async () => {
    const data = await safeFetch(`${API_BASE}/requests`, { headers: getHeaders() });
    return Array.isArray(data) ? data : data?.requests ?? [];
  },

  getUsers: async () => {
    const data = await safeFetch(`${API_BASE}/users`, { headers: getHeaders() });
    return Array.isArray(data) ? data : [];
  },

  getAssignments: async () => {
    const data = await safeFetch(`${API_BASE}/assignments`, { headers: getHeaders() });
    return Array.isArray(data) ? data : [];
  },

  createAssignment: async (payload: { ngoName: string; campus: string; coordinator: string }) => {
    return await safeFetch(`${API_BASE}/assignments`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
  },

  createRequest: async (payload: any) => {
    const data = await safeFetch(`${API_BASE}/requests`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload),
    });
    return data?.request ?? data;
  },

  assignNgoToRequest: async (requestId: string, ngoId?: string) => {
    return await safeFetch(`${API_BASE}/admin/requests/${requestId}/assign-ngo`, {
      method: "POST",
      headers: getHeaders("admin"),
      body: ngoId ? JSON.stringify({ ngoId }) : undefined,
    });
  },

  updateRequestStatus: async (requestId: string, status: string) => {
    return await safeFetch(`${API_BASE}/requests/${requestId}/status`, {
      method: "PATCH",
      headers: getHeaders("ngo"),
      body: JSON.stringify({ status }),
    });
  },

  updateRequestChecklist: async (requestId: string, checklist: any[]) => {
    return await safeFetch(`${API_BASE}/requests/${requestId}/checklist`, {
      method: "POST",
      headers: getHeaders("ngo"),
      body: JSON.stringify({ checklist }),
    });
  },

  getNgos: async () => {
    const data = await safeFetch(`${API_BASE}/ngos`, { headers: getHeaders() });
    return Array.isArray(data) ? data : [];
  },

  registerNgo: async (payload: any) => {
    return await safeFetch(`${API_BASE}/ngos/register`, {
      method: "POST",
      headers: getHeaders("citizen"), // Allow citizen role to register NGO
      body: JSON.stringify(payload),
    });
  },

  approveNgo: async (ngoId: string, status: "approved" | "rejected" | "pending", reviewReason?: string) => {
    return await safeFetch(`${API_BASE}/ngos/${ngoId}/approve`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status, reviewReason }),
    });
  },

  getAnalytics: async () => {
    return (await safeFetch(`${API_BASE}/analytics`, { headers: getHeaders() })) ?? {};
  },

  getMapLayers: async () => {
    return (await safeFetch(`${API_BASE}/map-layers`, { headers: getHeaders() })) ?? {};
  },

  voteOnRequest: async (requestId: string, userId: string, voteType: "UPVOTE" | "DOWNVOTE") => {
    const res = await fetch(`${API_BASE}/requests/${requestId}/vote`, {
      method: "POST",
      headers: getHeaders("citizen"),
      body: JSON.stringify({ userId, voteType }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to vote");
    return data;
  },

  verifyRequest: async (requestId: string, userId: string) => {
    const res = await fetch(`${API_BASE}/requests/${requestId}/verify`, {
      method: "POST",
      headers: getHeaders("citizen"),
      body: JSON.stringify({ userId }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || "Failed to verify");
    return data;
  },
};
