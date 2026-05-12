const API_BASE = import.meta.env.VITE_API_URL;

export async function login(username: string, password: string) {
  const res = await fetch(`${API_BASE}/api/auth/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error("Login failed");
  return res.json();
}

export async function getEmployees() {
  const res = await fetch(`${API_BASE}/api/employees/`);
  if (!res.ok) throw new Error("Failed to fetch employees");
  return res.json();
}
