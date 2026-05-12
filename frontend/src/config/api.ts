export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

// API endpoints
export const API_ROUTES = {
  // Relative paths
  LOGIN: 'login/',
  CURRENT_USER: 'current-user/',
  EMPLOYEES: 'employees/',
  HUBS: 'hubs/',
  ATTENDANCE: 'attendance/',
  PAYROLL: 'payroll/',
  EDIT_REQUESTS: 'edit-requests/',
  ACTIVITY_LOGS: 'activity-logs/',
  SECURITY_ALERTS: 'security-alerts/',
} as const;

export const buildUrl = (endpoint: string): string => {
  return `${API_BASE_URL}/${endpoint}`;
};

// Query keys for React Query
export const QUERY_KEYS_FACTORY = {
  all: ['employees'] as const,
  lists: () => [{ ...QUERY_KEYS_FACTORY.all, scope: 'list' }] as const,
  list: (filters: Record<string, any>) => [{ ...QUERY_KEYS_FACTORY.lists()[0], filters }] as const,
  details: () => [{ ...QUERY_KEYS_FACTORY.all, scope: 'detail' }] as const,
  detail: (id: number) => [{ ...QUERY_KEYS_FACTORY.details()[0], id }] as const,
};
