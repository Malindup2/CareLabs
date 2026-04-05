const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export interface AuthResponse {
  token: string;
  email: string;
  role: string;
}

export interface ApiError {
  message: string;
  status: number;
}

export async function apiPost<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API_URL}${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    let errorMessage = "Something went wrong";
    try {
      const errorBody = await res.json();
      errorMessage = errorBody.message || errorBody.error || errorMessage;
    } catch {
      // response wasn't JSON
    }
    const err: ApiError = { message: errorMessage, status: res.status };
    throw err;
  }

  return res.json() as Promise<T>;
}

export function saveAuth(data: AuthResponse) {
  if (typeof window !== "undefined") {
    localStorage.setItem("token", data.token);
    localStorage.setItem("email", data.email);
    localStorage.setItem("role", data.role);
  }
}

export function getToken(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("token");
  }
  return null;
}

export function getRole(): string | null {
  if (typeof window !== "undefined") {
    return localStorage.getItem("role");
  }
  return null;
}

export function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
  }
}
