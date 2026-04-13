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
  body?: unknown;
  token?: string;
  isFormData?: boolean;
}

async function requestJson<T>({ method, endpoint, body, token, isFormData = false }: RequestOptions): Promise<T> {
  const headers: HeadersInit = {};

  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${API_URL}${endpoint}`, {
    method,
    headers,
    body: body ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
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

export async function apiPost<T>(endpoint: string, body: unknown): Promise<T> {
  return requestJson<T>({ method: "POST", endpoint, body });
}

export async function apiGet<T>(endpoint: string): Promise<T> {
  return requestJson<T>({ method: "GET", endpoint });
}

export async function apiPutAuth<T>(endpoint: string, body: unknown, token: string): Promise<T> {
  return requestJson<T>({ method: "PUT", endpoint, body, token });
}

export async function apiGetAuth<T>(endpoint: string, token: string): Promise<T> {
  return requestJson<T>({ method: "GET", endpoint, token });
}

export async function apiPostAuth<T>(endpoint: string, body: unknown, token: string): Promise<T> {
  return requestJson<T>({ method: "POST", endpoint, body, token });
}

export async function apiDeleteAuth(endpoint: string, token: string): Promise<void> {
  return requestJson<void>({ method: "DELETE", endpoint, token });
}

export async function apiPostAuthFormData<T>(endpoint: string, formData: FormData, token: string): Promise<T> {
  return requestJson<T>({ method: "POST", endpoint, body: formData, token, isFormData: true });
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

export function getUserIdFromToken(): string | null {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;

    const payload = JSON.parse(atob(parts[1]));
    return typeof payload.userId === "string" ? payload.userId : null;
  } catch {
    return null;
  }
}

export function clearAuth() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    localStorage.removeItem("role");
  }
}
