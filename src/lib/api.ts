/**
 * API-клиент для работы с backend auto_ai_auth.
 * Использует NEXT_PUBLIC_API_BASE_URL (например, http://localhost:8000/api/v1).
 */

const BASE_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1")
    : process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1";

const TOKEN_COOKIE = "token";
const REFRESH_COOKIE = "refresh_token";

const SUPPORTED_LOCALES = ["en", "de", "ru", "pl", "it", "es"];
const DEFAULT_LOCALE = "en";

function getLocale(): string {
  if (typeof document === "undefined") return DEFAULT_LOCALE;
  const lang = document.documentElement?.lang;
  if (lang) {
    const short = lang.split("-")[0].toLowerCase();
    if (SUPPORTED_LOCALES.includes(short)) return short;
  }
  return DEFAULT_LOCALE;
}

function getLocaleHeaders(): Record<string, string> {
  const locale = getLocale();
  return {
    "Accept-Language": locale,
    "X-Locale": locale,
  };
}

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
    ...getLocaleHeaders(),
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

export type OAuth2AuthorizeParams = {
  client_id: string;
  redirect_uri: string;
  response_type: string;
  scope?: string;
  state?: string;
  code_challenge?: string;
  code_challenge_method?: string;
};

export type OAuth2AuthorizeResponse = { redirect_url: string };

export type OAuth2Config = {
  client_id: string;
  scanner_web_redirect_uri?: string;
};

export async function getOAuth2Config(): Promise<OAuth2Config> {
  const base = BASE_URL.replace(/\/$/, "");
  const url = base.endsWith("/api/v1") ? `${base}/auth/oauth2-config/` : `${base.replace(/\/api\/v1\/?$/, "")}/api/v1/auth/oauth2-config/`;
  const res = await fetch(url);
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  return res.json();
}

export async function createOAuth2Authorization(
  params: OAuth2AuthorizeParams,
): Promise<OAuth2AuthorizeResponse> {
  return request<OAuth2AuthorizeResponse>("auth/oauth2/authorize/", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

async function sha256Base64Url(input: string): Promise<string> {
  const enc = new TextEncoder();
  const data = enc.encode(input);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(hash)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

async function generatePKCE(): Promise<{ codeVerifier: string; codeChallenge: string }> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const verifier = Array.from(crypto.getRandomValues(new Uint8Array(64)))
    .map((b) => chars[b % chars.length])
    .join("");
  const challenge = await sha256Base64Url(verifier);
  return { codeVerifier: verifier, codeChallenge: challenge };
}

/** Подключение к сканеру: если пользователь авторизован, создаёт код и перенаправляет в приложение. */
export async function connectToScannerApp(): Promise<void> {
  const config = await getOAuth2Config();
  const redirectUri = config.scanner_web_redirect_uri || "http://localhost:3001/auth/callback";
  const { codeVerifier, codeChallenge } = await generatePKCE();
  const state = crypto.randomUUID();

  const { redirect_url } = await createOAuth2Authorization({
    client_id: config.client_id,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "read write",
    state,
    code_challenge: codeChallenge,
    code_challenge_method: "S256",
  });
  // Verifier в fragment (не отправляется на сервер) — callback сканера прочитает
  const withVerifier = `${redirect_url}#verifier=${encodeURIComponent(codeVerifier)}`;
  window.location.href = withVerifier;
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

export type UserDevice = {
  id: number;
  application_name?: string;
  device_name: string;
  hardware_id: string;
  last_active: string;
  is_active: boolean;
};

export async function getDevices(): Promise<UserDevice[]> {
  const res = await request<UserDevice[] | { results?: UserDevice[] }>(
    "users/me/devices/",
  );
  return Array.isArray(res) ? res : (res as { results?: UserDevice[] }).results ?? [];
}

export async function revokeDevice(deviceId: number): Promise<void> {
  await request(`users/me/devices/${deviceId}/`, { method: "DELETE" });
}

export async function uploadAvatar(file: File): Promise<UserProfile> {
  const base = BASE_URL.replace(/\/$/, "");
  const token = getToken();
  const formData = new FormData();
  formData.append("avatar", file);

  const headers: Record<string, string> = { ...getLocaleHeaders() };
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
    headers: getLocaleHeaders(),
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
  session_limit?: number;
  session_count?: number;
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

/* ========== Cars catalog ========== */

export type CarMake = { id: number; name: string; make_id?: number };

export type CarModel = {
  id: number;
  name: string;
  make: number;
  make_name: string;
  year_from?: number | null;
  year_to?: number | null;
};

export type CarModification = {
  id: number;
  name: string;
  model: number;
  model_name: string;
  make_name: string;
  year_from?: number | null;
  year_to?: number | null;
  characteristics: Record<string, string>;
};

export async function getCarMakes(q?: string): Promise<CarMake[]> {
  const path = q ? `cars/makes/?q=${encodeURIComponent(q)}` : "cars/makes/";
  const res = await request<CarMake[] | { results?: CarMake[] }>(path);
  return Array.isArray(res) ? res : (res as { results?: CarMake[] }).results ?? [];
}

export async function getCarModels(
  make: string,
  year?: number,
): Promise<CarModel[]> {
  const params = new URLSearchParams({ make });
  if (year) params.set("year", String(year));
  const res = await request<CarModel[] | { results?: CarModel[] }>(
    `cars/models/?${params}`,
  );
  return Array.isArray(res) ? res : (res as { results?: CarModel[] }).results ?? [];
}

export type CarFilterOptions = {
  body_types: string[];
  engine_types: string[];
};

export async function getCarModelYears(modelId: number): Promise<number[]> {
  const res = await request<{ years: number[] }>(
    `cars/models/${modelId}/years/`,
  );
  return res.years ?? [];
}

export async function getCarFilterOptions(
  modelId: number,
  year?: number,
): Promise<CarFilterOptions> {
  const params = new URLSearchParams();
  if (year != null && !isNaN(year) && year > 0) {
    params.set("year", String(year));
  }
  const queryString = params.toString();
  const path = `cars/models/${modelId}/filter-options/${queryString ? `?${queryString}` : ""}`;
  return request<CarFilterOptions>(path);
}

export async function getCarModifications(
  modelId: number,
  params?: {
    year?: number;
    body_type?: string;
    engine_type?: string;
  },
): Promise<CarModification[]> {
  const searchParams = new URLSearchParams();
  if (params?.year != null && !isNaN(params.year) && params.year > 0) {
    searchParams.set("year", String(params.year));
  }
  if (params?.body_type?.trim()) {
    searchParams.set("body_type", params.body_type.trim());
  }
  if (params?.engine_type?.trim()) {
    searchParams.set("engine_type", params.engine_type.trim());
  }
  const queryString = searchParams.toString();
  const path = `cars/models/${modelId}/modifications/${queryString ? `?${queryString}` : ""}`;
  const res = await request<CarModification[] | { results?: CarModification[] }>(
    path,
  );
  return Array.isArray(res) ? res : (res as { results?: CarModification[] }).results ?? [];
}

export async function getCarModificationDetail(
  modId: number,
): Promise<CarModification> {
  return request<CarModification>(`cars/modifications/${modId}/`);
}

export type CarsSearchExternalItem = {
  Make_Name: string;
  Model_Name: string;
};

export async function searchCarsExternal(
  make: string,
  year: number,
): Promise<CarsSearchExternalItem[]> {
  const params = new URLSearchParams({
    make,
    year: String(year),
  });
  return request<CarsSearchExternalItem[]>(
    `cars/search-external/?${params}`,
  );
}

export type DecodeVinResult = {
  make: string;
  model: string;
  year: number | null;
};

export async function decodeVin(vin: string): Promise<DecodeVinResult> {
  const params = new URLSearchParams({ vin: vin.trim().toUpperCase() });
  return request<DecodeVinResult>(`cars/decode-vin/?${params}`);
}

/* ========== Vehicles (garage) ========== */

export type Vehicle = {
  id: number;
  vin: string;
  make: string;
  model: string;
  year: number | null;
  modification_id: number | null;
  characteristics: Record<string, string>;
};

export type VehicleCreateUpdate = {
  vin?: string;
  make: string;
  model: string;
  year?: number | null;
  modification_id?: number | null;
};

export async function getVehicles(): Promise<Vehicle[]> {
  const res = await request<Vehicle[] | { results?: Vehicle[] }>(
    "diagnostics/vehicles/",
  );
  return Array.isArray(res) ? res : (res as { results?: Vehicle[] }).results ?? [];
}

export async function createVehicle(
  payload: VehicleCreateUpdate,
): Promise<Vehicle> {
  return request<Vehicle>("diagnostics/vehicles/", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function updateVehicle(
  id: number,
  payload: Partial<VehicleCreateUpdate>,
): Promise<Vehicle> {
  return request<Vehicle>(`diagnostics/vehicles/${id}/`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
}

export async function deleteVehicle(id: number): Promise<void> {
  await request(`diagnostics/vehicles/${id}/`, { method: "DELETE" });
}

/** @deprecated Use getVehicles instead */
export async function getDiagnosticsVehicles(): Promise<Vehicle[]> {
  return getVehicles();
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
