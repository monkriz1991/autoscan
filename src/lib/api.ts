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

function getRefreshToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(
    new RegExp("(?:^|; )" + REFRESH_COOKIE + "=([^;]*)"),
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

  const shouldTryRefresh = (res.status === 401 || res.status === 403) && !!getRefreshToken();
  if (shouldTryRefresh) {
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        const base = BASE_URL.replace(/\/$/, "");
        const refreshRes = await fetch(`${base}/auth/token/refresh/`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
        const refreshData = (await refreshRes.json()) as { access?: string; refresh?: string };
        if (refreshData.access) {
          const newRefresh = refreshData.refresh ?? refresh;
          setTokens(refreshData.access, newRefresh);
          headers.Authorization = `Bearer ${refreshData.access}`;
          const retry = await fetch(url, { ...options, headers });
          const retryData = await retry.json().catch(() => ({}));
          if (!retry.ok) throw new ApiError(retry.status, retryData);
          return retryData as T;
        }
      } catch {
        // retry failed or network error
      }
      // refresh не удался (401 на /token/refresh или нет access) — разлогинить
      clearTokens();
      if (typeof window !== "undefined") {
        const next = encodeURIComponent(window.location.pathname || "/");
        window.location.href = `/login?next=${next}`;
      }
      throw new ApiError(401, { detail: "Session expired" });
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
      email: email.trim().toLowerCase(),
      password,
    }),
  });
  setTokens(data.access, data.refresh);
  return data;
}

export type CaptchaResponse = {
  a: number;
  b: number;
  c: number;
  token: string;
};

export type RegisterPayload = {
  email: string;
  password1: string;
  password2: string;
  captcha_token: string;
  captcha_answer: number;
};

export type RegisterResponse = {
  access?: string;
  refresh?: string;
  user?: unknown;
  detail?: string;
};

export async function getCaptcha(): Promise<CaptchaResponse> {
  return request<CaptchaResponse>("auth/captcha/");
}

export async function register(
  payload: RegisterPayload,
  options?: { storeTokens?: boolean },
): Promise<RegisterResponse> {
  const normalizedPayload = {
    ...payload,
    email: payload.email.trim().toLowerCase(),
  };
  const data = await request<RegisterResponse>("auth/register/", {
    method: "POST",
    body: JSON.stringify(normalizedPayload),
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

export type UserProfileUpdate = Partial<
  Pick<UserProfile, "first_name" | "last_name" | "avatar_url">
>;

export async function updateMe(payload: UserProfileUpdate): Promise<UserProfile> {
  return request<UserProfile>("users/me/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const base = BASE_URL.replace(/\/$/, "");
  const token = getToken();
  const formData = new FormData();
  formData.append("avatar", file);

  const headers: Record<string, string> = {};
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(`${base}/users/me/avatar/`, {
    method: "POST",
    headers,
    body: formData,
    credentials: "omit",
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return data as UserProfile;
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

export type Plan = {
  id: number;
  name: string;
  tier: string;
  price: string;
  currency: string;
  duration_days: number | null;
  max_devices: number;
  max_requests?: number;
  sort_order: number;
};

export async function getPlans(): Promise<Plan[]> {
  const base = BASE_URL.replace(/\/$/, "");
  const res = await fetch(`${base}/billing/plans/`, {
    credentials: "omit",
  });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data as { results?: Plan[] }).results ?? [];
  return [...list].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
}

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

/* ========== Usage ========== */

export type UsageStatus = {
  plan_name: string;
  request_limit: number;
  requests_used: number;
  period: string;
};

export async function getUsageStatus(): Promise<UsageStatus> {
  return request<UsageStatus>("usage/");
}

/* ========== On-Demand ========== */

export type OnDemandSettings = {
  limit_type: "fixed" | "unlimited";
  limit_amount: number | null;
};

export async function getOnDemandSettings(): Promise<OnDemandSettings> {
  return request<OnDemandSettings>("on-demand/settings/");
}

export async function updateOnDemandSettings(
  payload: Partial<OnDemandSettings>,
): Promise<OnDemandSettings> {
  return request<OnDemandSettings>("on-demand/settings/", {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
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
