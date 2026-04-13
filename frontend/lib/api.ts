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

type HttpMethod = "GET" | "POST" | "PUT" | "DELETE";

interface RequestOptions {
  method: HttpMethod;
  endpoint: string;
  body?: Record<string, unknown>;
  token?: string;
}

async function requestJson<T>({ method, endpoint, body, token }: RequestOptions): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
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

  if (res.status === 204) {
    return undefined as T;
  }

  return res.json() as Promise<T>;
}

export async function apiPost<T>(endpoint: string, body: Record<string, unknown>): Promise<T> {
  return requestJson<T>({ method: "POST", endpoint, body });
}

export async function apiPutAuth<T>(endpoint: string, body: Record<string, unknown>, token: string): Promise<T> {
  return requestJson<T>({ method: "PUT", endpoint, body, token });
}

export async function apiGetAuth<T>(endpoint: string, token: string): Promise<T> {
  return requestJson<T>({ method: "GET", endpoint, token });
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
