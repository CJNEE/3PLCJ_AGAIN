const devFallback = 'http://localhost:8000/api';

/** In production builds, same-origin `/api` is rewritten by `vercel.json` to the Render backend. Set `VITE_API_URL` to override (e.g. point a preview at a staging API). */
function resolveApiBaseUrl(): string {
  const fromEnv = import.meta.env.VITE_API_URL?.trim();
  if (fromEnv) {
    return fromEnv.replace(/\/$/, '');
  }
  return import.meta.env.PROD ? '/api' : devFallback;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const API_ENDPOINTS = {
  // Auth
  LOGIN: '/login/',
  LOGOUT: '/logout/',
  CURRENT_USER: '/current-user/',
  
  // Employees
  EMPLOYEES: '/employees/',
  EMPLOYEE_DETAIL: (id: number) => `/employees/${id}/`,
  EMPLOYEE_DOCUMENTS: (id: number) => `/employees/${id}/documents/`,
  
  // Hubs
  HUBS: '/hubs/',
  HUB_DETAIL: (id: number) => `/hubs/${id}/`,
  
  // Attendance
  ATTENDANCE: '/attendance/',
  ATTENDANCE_CLOCK_IN: '/attendance/clock_in/',
  ATTENDANCE_CLOCK_OUT: '/attendance/clock_out/',
  ATTENDANCE_DETAIL: (id: number) => `/attendance/${id}/`,
  
  // Payroll
  PAYROLL: '/payroll/',
  PAYROLL_DETAIL: (id: number) => `/payroll/${id}/`,
  PAYROLL_DOWNLOAD_CSV: (hubId: number) => `/payroll/download/${hubId}/`,
  
  // Edit Requests
  EDIT_REQUESTS: '/edit-requests/',
  EDIT_REQUEST_DETAIL: (id: number) => `/edit-requests/${id}/`,
  EDIT_REQUEST_APPROVE: (id: number) => `/edit-requests/${id}/approve/`,
  EDIT_REQUEST_REJECT: (id: number) => `/edit-requests/${id}/reject/`,
  
  // Live Locations
  LIVE_LOCATIONS: '/live-locations/',
  
  // Stats
  STATS: '/stats/',
  META: '/meta/',
  
  // Activity Logs
  ACTIVITY_LOGS: '/activity-logs/',
  
  // Security Alerts
  SECURITY_ALERTS: '/security-alerts/',
  
  // Employee Documents
  EMPLOYEE_DOCUMENTS_LIST: '/employee-documents/',
  EMPLOYEE_DOCUMENT_DETAIL: (id: number) => `/employee-documents/${id}/`,
  
  // Security
  LOCK_UNLOCK_ACCOUNT: (employeeId: number) => `/lock-unlock-account/${employeeId}/`,
  RESET_PASSWORD: (employeeId: number) => `/reset-password/${employeeId}/`,
} as const;

export const QUERY_KEYS = {
  EMPLOYEES: ['employees'],
  EMPLOYEE: (id: number) => ['employees', id],
  HUBS: ['hubs'],
  HUB: (id: number) => ['hubs', id],
  ATTENDANCE: ['attendance'],
  PAYROLL: ['payroll'],
  EDIT_REQUESTS: ['edit-requests'],
  LIVE_LOCATIONS: ['live-locations'],
  STATS: ['stats'],
  ACTIVITY_LOGS: ['activity-logs'],
  SECURITY_ALERTS: ['security-alerts'],
  CURRENT_USER: ['current-user'],
  DOCUMENTS: ['documents'],
  DOCUMENT: (id: number) => ['documents', id],
} as const;
