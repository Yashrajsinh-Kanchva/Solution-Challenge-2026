/**
 * API client for admin screens. The Express API reads Firebase Realtime
 * Database paths seeded by scripts/seed-firebase-admin-data.ts.
 */
const API_BASE = "http://localhost:5000/api";

import { getCookie } from "../utils/cookies";

const getHeaders = (role = "admin") => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${role === "ngo" ? "MOCK_NGO_TOKEN" : "MOCK_ADMIN_TOKEN"}`,
  };
  
  if (role === "ngo") {
    const ngoId = getCookie("vb_ngo_id");
    if (ngoId) headers["x-ngo-id"] = ngoId;
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

  getVolunteer: async (volunteerId: string) => {
    return await safeFetch(`${API_BASE}/volunteers/${volunteerId}`, { headers: getHeaders("ngo") });
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
};
