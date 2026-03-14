/**
 * API-клиент для работы с backend auto_ai_auth.
 * Использует NEXT_PUBLIC_API_BASE_URL (например, http://localhost:8000/api/v1).
 */

const BASE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1")
    : process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000/api/v1";

const TOKEN_COOKIE = "token";
const REFRESH_COOKIE = "refresh_token";

function getToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + TOKEN_COOKIE + "=([^;]*)"),
  );
  return match ? decodeURIComponent(match[1]) : null;
}

function setTokens(access: string, refresh?: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(access)}; path=/; max-age=86400; samesite=lax`;
  if (refresh) {
    document.cookie = `${REFRESH_COOKIE}=${encodeURIComponent(refresh)}; path=/; max-age=2592000; samesite=lax`;
  }
}

function clearTokens(): void {
  if (typeof document === "undefined") return;
  document.cookie = `${TOKEN_COOKIE}=; path=/; max-age=0`;
  document.cookie = `${REFRESH_COOKIE}=; path=/; max-age=0`;
}

export function isAuthenticated(): boolean {
  return !!getToken();
}

export function logout(): void {
  clearTokens();
}

async function request<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const url = path.startsWith("http") ? path : `${BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...((options.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (res.status === 401) {
    const refresh = typeof document !== "undefined"
      ? document.cookie
          .split("; ")
          .find((c) => c.startsWith(REFRESH_COOKIE + "="))
          ?.split("=")[1]
      : null;
    if (refresh) {
      try {
        const refreshRes = await fetch(`${BASE_URL}/auth/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
        const refreshData = (await refreshRes.json()) as { access?: string };
        if (refreshData.access) {
          setTokens(refreshData.access, refresh);
          headers.Authorization = `Bearer ${refreshData.access}`;
          const retry = await fetch(url, { ...options, headers });
          const retryData = await retry.json().catch(() => ({}));
          if (!retry.ok) throw new ApiError(retry.status, retryData);
          return retryData as T;
        }
      } catch {
        clearTokens();
        if (typeof window !== "undefined") window.location.href = "/login";
      }
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data as T;
}

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, data: unknown) {
    super(typeof data === "object" && data !== null && "detail" in data
      ? String((data as { detail?: unknown }).detail)
      : `API error ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/* ========== Auth ========== */

export type LoginResponse = { access: string; refresh: string };

export async function login(email: string, password: string): Promise<LoginResponse> {
  const data = await request<LoginResponse>("auth/login/", {
    method: "POST",
    body: JSON.stringify({
      email,
      password,
    }),
  });
  setTokens(data.access, data.refresh);
  return data;
}

export type RegisterPayload = {
  email: string;
  password1: string;
  password2: string;
};

export type RegisterResponse = {
  access?: string;
  refresh?: string;
  user?: unknown;
  detail?: string;
};

export async function register(
  payload: RegisterPayload,
  options?: { storeTokens?: boolean },
): Promise<RegisterResponse> {
  const data = await request<RegisterResponse>("auth/register/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  if (options?.storeTokens !== false && data.access && data.refresh) {
    setTokens(data.access, data.refresh);
  }
  return data;
}

/* ========== Users ========== */

export type UserProfile = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar_url?: string;
  is_staff?: boolean;
  is_premium?: boolean;
  license?: unknown;
  device_count?: number;
};

export async function getMe(): Promise<UserProfile> {
  return request<UserProfile>("users/me/");
}

export type AdminUser = {
  id: number;
  email: string;
  first_name?: string;
  last_name?: string;
  is_staff?: boolean;
  date_joined?: string;
};

export async function getAdminUsers(): Promise<AdminUser[]> {
  const res = await request<{ results?: AdminUser[] }>("admin/users/");
  return Array.isArray((res as { results?: AdminUser[] }).results)
    ? (res as { results: AdminUser[] }).results
    : Array.isArray(res)
      ? (res as AdminUser[])
      : [];
}

export async function getAdminUser(id: string | number): Promise<AdminUser> {
  return request<AdminUser>(`admin/users/${id}/`);
}

/* ========== Billing ========== */

export type BillingStatus = {
  status: string;
  is_active: boolean;
  plan?: string;
  expires_at?: string;
  device_limit?: number;
  device_count?: number;
};

export async function getBillingStatus(): Promise<BillingStatus> {
  return request<BillingStatus>("billing/status/");
}

/* ========== Diagnostics (для будущей интеграции) ========== */

export async function getDiagnosticsVehicles(): Promise<unknown[]> {
  const res = await request<{ results?: unknown[] }>("diagnostics/vehicles/");
  return Array.isArray((res as { results?: unknown[] }).results)
    ? (res as { results: unknown[] }).results
    : Array.isArray(res)
      ? (res as unknown[])
      : [];
}

/* ========== Stub: services/specialists (нет в backend auto_ai_auth) ========== */

export type ServiceStub = { _id: string; name: string; parent: string | null };
export type SpecialistStub = {
  _id: string;
  name: string;
  categories: string[];
};

export async function getServicesStub(_businessId?: string): Promise<ServiceStub[]> {
  return [];
}

export async function getSpecialistsStub(_businessId?: string): Promise<SpecialistStub[]> {
  return [];
}
