// src/api.ts
const API_BASE = import.meta.env.VITE_API_URL;

// Generic request helper
async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || errorData.error || res.statusText);
  }

  return res.json();
}

export async function login(username: string, password: string) {
  return request<{ token: string; user: any; employee: any }>("/api/auth/login/", {
    method: "POST",
    body: JSON.stringify({ username, password }),
  });
}



// Employees
export async function getEmployees() {
  return request<any[]>("/api/employees/");
}

export async function getEmployee(id: string) {
  return request<any>(`/api/employees/${id}/`);
}

// Attendance
export async function getAttendanceHistory(employeeId: string) {
  return request<any[]>(`/api/employees/${employeeId}/attendance/`);
}

// Payslip
export async function getPayslips(employeeId: string) {
  return request<any[]>(`/api/employees/${employeeId}/payslips/`);
}
