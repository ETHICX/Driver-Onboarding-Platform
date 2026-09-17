import { 
  AuthUser, 
  DriverFullData, 
  AdminDashboardStats, 
  AdminApplicationSummary,
  Application,
  Vehicle,
  DriverProfile,
  DocumentRecord
} from '../types';

const TOKEN_KEY = 'fleet_auth_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // If not FormData, set Content-Type to JSON
  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    if (response.status === 401) {
      const err = new Error(data?.error || data?.message || 'Unauthorized') as Error & { status?: number };
      err.status = 401;
      throw err;
    }
    const errorMsg = data?.error || data?.message || `Request failed with status ${response.status}`;
    const err = new Error(errorMsg) as Error & { status?: number; details?: string[]; requiresVerification?: boolean; email?: string; phone?: string; demoOtp?: string };
    err.status = response.status;
    if (data?.details) err.details = data.details;
    if (data?.requiresVerification) {
      err.requiresVerification = true;
      err.email = data.email;
      err.phone = data.phone;
      err.demoOtp = data.demoOtp;
    }
    throw err;
  }

  return data as T;
}

export const api = {
  // Auth
  register: (payload: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    password: string;
    confirmPassword: string;
    termsAccepted: boolean;
  }) => request<{ success: boolean; message: string; email: string; phone: string; demoOtp: string }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(payload),
  }),

  verifyOtp: (payload: { email: string; code: string }) => 
    request<{ success: boolean; token: string; user: AuthUser; message?: string }>('/api/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  resendOtp: (email: string) => 
    request<{ success: boolean; message: string; demoOtp: string }>('/api/auth/resend-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  login: (payload: { identifier: string; password: string }) =>
    request<{ success: boolean; token: string; user: AuthUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  quickLogin: (payload: { role?: 'driver' | 'admin'; email?: string }) =>
    request<{ success: boolean; token: string; user: AuthUser }>('/api/auth/quick-login', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  getMe: () => request<{ user: AuthUser }>('/api/auth/me'),
  getCurrentUser: async (): Promise<{ user: AuthUser | null }> => {
    try {
      const token = getStoredToken();
      if (!token) {
        return { user: null };
      }
      return await request<{ user: AuthUser }>('/api/auth/me');
    } catch (err: any) {
      if (err?.status === 401 || err?.message?.toLowerCase().includes('unauthorized')) {
        setStoredToken(null);
        return { user: null };
      }
      throw err;
    }
  },

  logout: async () => {
    setStoredToken(null);
    return { success: true };
  },

  quickSwitch: (email: string) =>
    request<{ success: boolean; token: string; user: AuthUser }>('/api/auth/quick-login', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }).then(res => {
      if (res.token) setStoredToken(res.token);
      return res;
    }),

  // Driver Onboarding
  getDriverApplication: () => request<DriverFullData>('/api/driver/application'),
  getMyApplication: () => request<DriverFullData>('/api/driver/application'),

  savePersonal: (payload: Partial<DriverProfile>) =>
    request<{ success: boolean; profile: DriverProfile }>('/api/driver/personal', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  saveIdentity: (payload: { nationalIdNumber: string; driverLicenceNumber: string; driverLicenceExpiryDate: string }) =>
    request<{ success: boolean; profile: DriverProfile }>('/api/driver/identity', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  saveVehicle: (payload: Partial<Vehicle>) =>
    request<{ success: boolean; vehicle: Vehicle }>('/api/driver/vehicle', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  uploadDocument: (formData: FormData) =>
    request<{ success: boolean; document: DocumentRecord }>('/api/driver/documents/upload', {
      method: 'POST',
      body: formData,
    }),

  deleteDocument: (id: string) =>
    request<{ success: boolean }>('/api/driver/documents/' + id, {
      method: 'DELETE',
    }),

  submitApplication: () =>
    request<{ success: boolean; message: string; application: Application }>('/api/driver/application/submit', {
      method: 'POST',
    }),

  // Admin
  getAdminDashboard: () =>
    request<{ stats: AdminDashboardStats; applications: AdminApplicationSummary[] }>('/api/admin/dashboard'),

  getAdminApplicationDetail: (id: string) =>
    request<{
      application: Application;
      profile: DriverProfile | null;
      vehicle: Vehicle | null;
      documents: DocumentRecord[];
    }>('/api/admin/applications/' + id),

  startAdminReview: (id: string) =>
    request<{ success: boolean; application: Application }>(`/api/admin/applications/${id}/start-review`, {
      method: 'POST',
    }),

  approveApplication: (id: string) =>
    request<{ success: boolean; application: Application }>(`/api/admin/applications/${id}/approve`, {
      method: 'POST',
    }),

  rejectApplication: (id: string, reason: string) =>
    request<{ success: boolean; application: Application }>(`/api/admin/applications/${id}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),

  resetApplicationStatus: (id: string, status: string) =>
    request<{ success: boolean; application: Application }>(`/api/admin/applications/${id}/reset-status`, {
      method: 'POST',
      body: JSON.stringify({ status }),
    }),
};
