/**
 * API client for admin screens. The Express API reads Firebase Realtime
 * Database paths seeded by scripts/seed-firebase-admin-data.ts.
 */
const API_BASE = "http://localhost:5000/api";

const getHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: "Bearer MOCK_ADMIN_TOKEN",
});

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

  updateRequestStatus: async (requestId: string, status: "approved" | "rejected") => {
    return await safeFetch(`${API_BASE}/requests/${requestId}/status`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ status }),
    });
  },

  getNgos: async () => {
    const data = await safeFetch(`${API_BASE}/ngos`, { headers: getHeaders() });
    return Array.isArray(data) ? data : [];
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
