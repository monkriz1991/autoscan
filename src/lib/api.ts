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

/** Сохранить JWT в cookies (логин, OAuth callback с бэкенда). */
export function setTokens(access: string, refresh?: string): void {
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

  const res = await fetch(url, { ...options, headers, credentials: "omit" });
  const data = await res.json().catch(() => ({}));

  // Только 401 — истёк/невалиден access JWT. 403 — «нет прав»; refresh не помогает и при сбое refresh
  // очищает cookies и разлогинивает пользователя без причины.
  const shouldTryRefresh = res.status === 401 && !!getRefreshToken();
  if (shouldTryRefresh) {
    const refresh = getRefreshToken();
    if (refresh) {
      try {
        const base = BASE_URL.replace(/\/$/, "");
        const refreshRes = await fetch(`${base}/auth/token/refresh/`, {
          method: "POST",
          credentials: "omit",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refresh }),
        });
        const refreshData = (await refreshRes.json()) as { access?: string; refresh?: string };
        if (refreshData.access) {
          const newRefresh = refreshData.refresh ?? refresh;
          setTokens(refreshData.access, newRefresh);
          headers.Authorization = `Bearer ${refreshData.access}`;
          const retry = await fetch(url, { ...options, headers, credentials: "omit" });
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
    const msgFromData =
      typeof data === "object" && data !== null
        ? (data as { error?: unknown; detail?: unknown })
        : null;
    const message =
      msgFromData && typeof msgFromData.error === "string" && msgFromData.error
        ? msgFromData.error
        : msgFromData && typeof msgFromData.detail === "string" && msgFromData.detail
          ? msgFromData.detail
          : `API error ${status}`;
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

/** Сообщение для UI: detail (DRF) или error (наши view). */
export function getApiErrorMessage(err: unknown): string {
  if (err instanceof ApiError && err.data && typeof err.data === "object" && err.data !== null) {
    const d = err.data as { error?: unknown; detail?: unknown };
    if (typeof d.error === "string" && d.error) return d.error;
    if (typeof d.detail === "string" && d.detail) return d.detail;
  }
  if (err instanceof Error) return err.message;
  return "Unknown error";
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

/** Ключ sessionStorage: целевой путь после OAuth Google/Apple (аналог ?next= на логине). */
export const POST_OAUTH_NEXT_STORAGE_KEY = "post_oauth_next";

/** URL редиректа на страницу согласия Google (серверный OAuth code flow). */
export async function getGoogleOAuthRedirectUrl(): Promise<string> {
  const data = await request<{ url?: string }>("auth/google/redirect/", {
    method: "GET",
  });
  if (!data.url || typeof data.url !== "string") {
    throw new ApiError(400, { detail: "No redirect URL from server" });
  }
  return data.url;
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
  /** Если не переданы — регистрация без капчи (бэкенд может потребовать повтор с капчей). */
  captcha_token?: string;
  captcha_answer?: number;
  accept_terms: boolean;
  accept_privacy_policy: boolean;
  accept_disclaimer: boolean;
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

/** true — email уже занят; false — можно регистрировать или проверка недоступна (404/500/сеть). */
export async function checkEmailExists(email: string): Promise<boolean> {
  try {
    const data = await request<{ exists?: boolean }>("auth/email-check/", {
      method: "POST",
      body: JSON.stringify({ email: email.trim().toLowerCase() }),
    });
    return data.exists === true;
  } catch (e) {
    if (e instanceof ApiError) {
      if (e.status === 404 || e.status >= 500) {
        return false;
      }
      throw e;
    }
    return false;
  }
}

export type MagicLinkVerifyResponse = {
  access: string;
  refresh: string;
  user: UserProfile;
};

export async function verifyMagicLink(
  token: string,
): Promise<MagicLinkVerifyResponse> {
  const q = new URLSearchParams({ token: token.trim() });
  return request<MagicLinkVerifyResponse>(
    `auth/magic-link/verify/?${q.toString()}`,
    { method: "GET" },
  );
}

export async function requestMagicLink(email: string): Promise<void> {
  await request<unknown>("auth/magic-link/", {
    method: "POST",
    body: JSON.stringify({ email: email.trim().toLowerCase() }),
  });
}

export async function register(
  payload: RegisterPayload,
  options?: { storeTokens?: boolean },
): Promise<RegisterResponse> {
  const normalizedPayload = {
    ...payload,
    email: payload.email.trim().toLowerCase(),
  };
  const body: Record<string, unknown> = {
    email: normalizedPayload.email,
    password1: normalizedPayload.password1,
    password2: normalizedPayload.password2,
    accept_terms: normalizedPayload.accept_terms,
    accept_privacy_policy: normalizedPayload.accept_privacy_policy,
    accept_disclaimer: normalizedPayload.accept_disclaimer,
  };
  if (
    normalizedPayload.captcha_token != null &&
    normalizedPayload.captcha_answer != null
  ) {
    body.captcha_token = normalizedPayload.captcha_token;
    body.captcha_answer = normalizedPayload.captcha_answer;
  }
  const data = await request<RegisterResponse>("auth/register/", {
    method: "POST",
    body: JSON.stringify(body),
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
  interface_locale?: string;
  is_staff?: boolean;
  is_premium?: boolean;
  license?: unknown;
  device_count?: number;
};

export async function getMe(): Promise<UserProfile> {
  return request<UserProfile>("users/me/");
}

/** Подключённые приложения (OAuth2-сессии), GET /users/me/devices/ */
export type UserDeviceSession = {
  id: number;
  application_name: string;
  device_name: string;
  hardware_id: string;
  last_active: string;
  is_active: boolean;
};

export async function getUserDevices(): Promise<UserDeviceSession[]> {
  const data = await request<UserDeviceSession[] | unknown>("users/me/devices/");
  return Array.isArray(data) ? data : [];
}

export async function deleteUserDeviceSession(id: number): Promise<void> {
  await request<unknown>(`users/me/devices/${id}/`, { method: "DELETE" });
}

export type UserProfileUpdate = Partial<
  Pick<UserProfile, "first_name" | "last_name" | "avatar_url" | "interface_locale">
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

/* ========== Notifications ========== */

export type UserNotificationDisplayMode = "one_time" | "banner";

export type UserNotification = {
  id: number;
  title: string;
  body: string;
  display_mode: UserNotificationDisplayMode;
  starts_at: string | null;
  ends_at: string | null;
  created_at: string;
  is_read: boolean;
};

export type NotificationsInboxResponse = {
  items: UserNotification[];
  last_id: number;
};

function normalizeNotificationDisplayMode(raw: unknown): UserNotificationDisplayMode {
  return String(raw ?? "").trim().toLowerCase() === "one_time" ? "one_time" : "banner";
}

function parseUserNotification(row: Record<string, unknown>): UserNotification {
  return {
    id: Number(row.id ?? 0),
    title: String(row.title ?? ""),
    body: String(row.body ?? ""),
    display_mode: normalizeNotificationDisplayMode(row.display_mode),
    starts_at: row.starts_at ? String(row.starts_at) : null,
    ends_at: row.ends_at ? String(row.ends_at) : null,
    created_at: String(row.created_at ?? ""),
    is_read: Boolean(row.is_read),
  };
}

export async function getNotificationsInbox(options?: {
  afterId?: number;
  limit?: number;
}): Promise<NotificationsInboxResponse> {
  const params = new URLSearchParams();
  const afterId = options?.afterId ?? 0;
  if (afterId > 0) params.set("after_id", String(afterId));
  const limit = options?.limit ?? 50;
  if (limit > 0) params.set("limit", String(limit));
  const path = `notifications/inbox/${params.toString() ? `?${params.toString()}` : ""}`;
  const raw = await request<{ items?: Record<string, unknown>[]; last_id?: number }>(path);
  const rows = Array.isArray(raw.items) ? raw.items : [];
  return {
    items: rows.map(parseUserNotification),
    last_id: Number(raw.last_id ?? 0),
  };
}

export async function markNotificationRead(id: number): Promise<{ ok: boolean; created: boolean }> {
  return request<{ ok: boolean; created: boolean }>(`notifications/${id}/read/`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export type NotificationSseEvent = {
  event: "notification" | "done" | string;
  data: Record<string, unknown>;
};

export async function subscribeNotificationsStream(options: {
  afterId?: number;
  onEvent: (event: NotificationSseEvent) => void;
  signal?: AbortSignal;
}): Promise<void> {
  const params = new URLSearchParams();
  const afterId = options.afterId ?? 0;
  if (afterId > 0) params.set("after_id", String(afterId));
  const path = `notifications/stream/${params.toString() ? `?${params.toString()}` : ""}`;
  const url = `${BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const token = getToken();
  const headers: Record<string, string> = {
    Accept: "text/event-stream",
    ...getLocaleHeaders(),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const res = await fetch(url, {
    method: "GET",
    headers,
    signal: options.signal,
  });
  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new ApiError(res.status, errBody);
  }

  if (!res.body) {
    return;
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const flushFrames = () => {
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) >= 0) {
      const frame = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      if (!frame.trim()) continue;

      let eventName = "";
      const dataLines: string[] = [];
      for (const line of frame.split("\n")) {
        if (line.startsWith("event:")) {
          eventName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trimStart());
        }
      }
      if (!eventName || dataLines.length === 0) continue;
      try {
        const data = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
        options.onEvent({ event: eventName, data });
      } catch {
        /* ignore malformed frame */
      }
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      flushFrames();
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    flushFrames();
  }
}

/* ========== Billing ========== */

/** Флаги тарифа с API (ключи без префикса feature_). */
export type PlanFeatures = {
  unlimited_devices: boolean;
  scan_errors: boolean;
  view_params: boolean;
  vehicle_config: boolean;
  ai_chat_history: boolean;
  record_params: boolean;
  metrics_history: boolean;
  realtime_analysis: boolean;
  predictive_maintenance_alerts?: boolean;
  ai_blog_search?: boolean;
  ai_chat_assistant?: boolean;
};

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
  features?: PlanFeatures;
};

/** Идентификатор способа оплаты на checkout (расширяется при добавлении шлюзов). */
export type PaymentMethodId = "crypto_trc20";

/** Описание способа оплаты для UI (список методов на странице оформления). */
export type PaymentMethod = {
  id: PaymentMethodId;
  available: boolean;
};

/** Публичный FAQ (локаль из Accept-Language / X-Locale). */
export type FaqPublicItem = {
  slug: string;
  question: string;
  excerpt: string;
  answer_html: string;
  sort_order: number;
  available_locales: string[];
  cover_image_url: string | null;
};

export async function getPublicFaq(options?: {
  /** Поиск по вопросу и краткому описанию (локаль — из Accept-Language / X-Locale). */
  q?: string;
}): Promise<FaqPublicItem[]> {
  const base = BASE_URL.replace(/\/$/, "");
  const params = new URLSearchParams();
  const q = (options?.q ?? "").trim();
  if (q) params.set("q", q.slice(0, 200));
  const qs = params.toString();
  const url = qs ? `${base}/faq/?${qs}` : `${base}/faq/`;
  const res = await fetch(url, {
    credentials: "omit",
    headers: getLocaleHeaders(),
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.json().catch(() => ({})));
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((row: Record<string, unknown>) => ({
    slug: String(row.slug ?? ""),
    question: String(row.question ?? ""),
    excerpt: String(row.excerpt ?? ""),
    answer_html: String(row.answer_html ?? ""),
    sort_order: Number(row.sort_order ?? 0),
    available_locales: Array.isArray(row.available_locales)
      ? (row.available_locales as string[]).filter((x) => typeof x === "string")
      : [],
    cover_image_url:
      row.cover_image_url === null ||
      row.cover_image_url === undefined ||
      row.cover_image_url === ""
        ? null
        : String(row.cover_image_url),
  }));
}

/** SSR FAQ с явной локалью: без document.documentElement на сервере иначе всегда будет DEFAULT_LOCALE. */
export async function getPublicFaqForLocale(
  locale: string,
  options?: { q?: string },
): Promise<FaqPublicItem[]> {
  const base = BASE_URL.replace(/\/$/, "");
  const params = new URLSearchParams();
  const q = (options?.q ?? "").trim();
  if (q) params.set("q", q.slice(0, 200));
  const qs = params.toString();
  const url = qs ? `${base}/faq/?${qs}` : `${base}/faq/`;
  const res = await fetch(url, {
    credentials: "omit",
    headers: {
      "Accept-Language": locale,
      "X-Locale": locale,
    },
    next: { revalidate: 120 },
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.json().catch(() => ({})));
  }
  const data = await res.json();
  if (!Array.isArray(data)) return [];
  return data.map((row: Record<string, unknown>) => ({
    slug: String(row.slug ?? ""),
    question: String(row.question ?? ""),
    excerpt: String(row.excerpt ?? ""),
    answer_html: String(row.answer_html ?? ""),
    sort_order: Number(row.sort_order ?? 0),
    available_locales: Array.isArray(row.available_locales)
      ? (row.available_locales as string[]).filter((x) => typeof x === "string")
      : [],
    cover_image_url:
      row.cover_image_url === null ||
      row.cover_image_url === undefined ||
      row.cover_image_url === ""
        ? null
        : String(row.cover_image_url),
  }));
}

/** Состояние доступа к файлу установщика (как в API downloads). */
export type DownloadAssetAccess = "download" | "login_required" | "paid_required";

export type DownloadsAssetDto = {
  id: number;
  os_type: string;
  os_label: string;
  architecture: string;
  installer_type: string;
  installer_label: string;
  file_size: number;
  checksum_sha256: string;
  download_label: string;
  access: DownloadAssetAccess;
  download_url: string | null;
  download_api_url: string | null;
};

export type DownloadsReleaseDto = {
  id: number;
  version: string;
  version_code: number;
  title: string;
  release_notes_short: string;
  release_notes_full: string;
  is_prerelease: boolean;
  published_at: string | null;
};

export type DownloadsArchiveRow = {
  release: DownloadsReleaseDto;
  assets: DownloadsAssetDto[];
};

export type DownloadsPageDto = {
  client_os: string;
  latest: DownloadsReleaseDto | null;
  primary_asset: DownloadsAssetDto | null;
  secondary_assets: DownloadsAssetDto[];
  archive: DownloadsArchiveRow[];
};

function normalizeDownloadAssetAccess(raw: unknown): DownloadAssetAccess {
  const s = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  if (s === "login_required") return "login_required";
  if (s === "paid_required") return "paid_required";
  return "download";
}

function parseDownloadsAsset(row: Record<string, unknown>): DownloadsAssetDto {
  return {
    id: Number(row.id ?? 0),
    os_type: String(row.os_type ?? ""),
    os_label: String(row.os_label ?? ""),
    architecture: String(row.architecture ?? ""),
    installer_type: String(row.installer_type ?? ""),
    installer_label: String(row.installer_label ?? ""),
    file_size: Number(row.file_size ?? 0),
    checksum_sha256: String(row.checksum_sha256 ?? ""),
    download_label: String(row.download_label ?? ""),
    access: normalizeDownloadAssetAccess(row.access),
    download_url: row.download_url ? String(row.download_url) : null,
    download_api_url: row.download_api_url ? String(row.download_api_url) : null,
  };
}

function parseDownloadsRelease(row: Record<string, unknown> | null): DownloadsReleaseDto | null {
  if (!row || typeof row !== "object") return null;
  return {
    id: Number(row.id ?? 0),
    version: String(row.version ?? ""),
    version_code: Number(row.version_code ?? 0),
    title: String(row.title ?? ""),
    release_notes_short: String(row.release_notes_short ?? ""),
    release_notes_full: String(row.release_notes_full ?? ""),
    is_prerelease: Boolean(row.is_prerelease),
    published_at: row.published_at ? String(row.published_at) : null,
  };
}

function buildDownloadsPageFromRaw(raw: Record<string, unknown>): DownloadsPageDto {
  const archiveRaw = Array.isArray(raw.archive) ? raw.archive : [];
  return {
    client_os: String(raw.client_os ?? "unknown"),
    latest: parseDownloadsRelease((raw.latest as Record<string, unknown>) ?? null),
    primary_asset: raw.primary_asset
      ? parseDownloadsAsset(raw.primary_asset as Record<string, unknown>)
      : null,
    secondary_assets: Array.isArray(raw.secondary_assets)
      ? (raw.secondary_assets as Record<string, unknown>[]).map(parseDownloadsAsset)
      : [],
    archive: archiveRaw
      .map((row) => {
        const r = row as Record<string, unknown>;
        const rel = parseDownloadsRelease((r.release as Record<string, unknown>) ?? null);
        if (!rel) return null;
        return {
          release: rel,
          assets: Array.isArray(r.assets)
            ? (r.assets as Record<string, unknown>[]).map(parseDownloadsAsset)
            : [],
        };
      })
      .filter((x): x is DownloadsArchiveRow => x !== null),
  };
}

/** GET /downloads/page/ — данные для страницы «Скачать» (JWT опционален). */
export async function getDownloadsPage(clientOs: string): Promise<DownloadsPageDto> {
  const params = new URLSearchParams();
  const co = (clientOs || "unknown").trim().toLowerCase();
  if (co) params.set("client_os", co.slice(0, 32));
  const qs = params.toString();
  const path = qs ? `downloads/page/?${qs}` : "downloads/page/";
  const raw = await request<Record<string, unknown>>(path);
  return buildDownloadsPageFromRaw(raw);
}

/**
 * SSR страницы «Скачать»: локаль и опционально Cookie (JWT) для персонализации доступа к файлам.
 */
export async function getDownloadsPageForLocale(
  clientOs: string,
  locale: string,
  options?: { cookieHeader?: string | null },
): Promise<DownloadsPageDto> {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1").replace(
    /\/$/,
    "",
  );
  const params = new URLSearchParams();
  const co = (clientOs || "unknown").trim().toLowerCase();
  if (co) params.set("client_os", co.slice(0, 32));
  const qs = params.toString();
  const path = qs ? `downloads/page/?${qs}` : "downloads/page/";
  const url = `${base}/${path}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "Accept-Language": locale,
    "X-Locale": locale,
  };
  const cookieHeader = options?.cookieHeader;
  if (cookieHeader) {
    headers.Cookie = cookieHeader;
  }
  const res = await fetch(url, { headers, next: { revalidate: 60 } });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, data);
  }
  return buildDownloadsPageFromRaw(data as Record<string, unknown>);
}

/**
 * Скачивание через защищённый URL (Bearer из cookie). Прямой media-URL открывается без этого.
 */
export async function downloadProtectedAsset(
  absoluteApiFileUrl: string,
  filenameFallback: string,
): Promise<void> {
  if (typeof window === "undefined") return;
  const token = getToken();
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await fetch(absoluteApiFileUrl, { headers });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new ApiError(res.status, data);
  }
  const blob = await res.blob();
  const cd = res.headers.get("Content-Disposition");
  let name = filenameFallback;
  if (cd) {
    const mStar = /filename\*=UTF-8''([^;]+)/i.exec(cd);
    const mQ = /filename="([^"]+)"/i.exec(cd);
    const mPlain = /filename=([^;\s]+)/i.exec(cd);
    const rawName = mStar?.[1] || mQ?.[1] || mPlain?.[1];
    if (rawName) {
      try {
        name = decodeURIComponent(rawName.replace(/"/g, ""));
      } catch {
        name = rawName.replace(/"/g, "");
      }
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name || filenameFallback;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export type BlogPostItem = {
  slug: string;
  title: string;
  excerpt: string;
  published_at: string;
  available_locales: string[];
  cover_image_url: string | null;
};

export type BlogPostDetail = BlogPostItem & {
  body_html: string;
};

function mapBlogPostRows(data: unknown): BlogPostItem[] {
  if (!Array.isArray(data)) return [];
  return data.map((row: Record<string, unknown>) => ({
    slug: String(row.slug ?? ""),
    title: String(row.title ?? ""),
    excerpt: String(row.excerpt ?? ""),
    published_at: String(row.published_at ?? ""),
    available_locales: Array.isArray(row.available_locales)
      ? (row.available_locales as string[]).filter((x) => typeof x === "string")
      : [],
    cover_image_url:
      row.cover_image_url === null ||
      row.cover_image_url === undefined ||
      row.cover_image_url === ""
        ? null
        : String(row.cover_image_url),
  }));
}

export async function getBlogPosts(): Promise<BlogPostItem[]> {
  const base = BASE_URL.replace(/\/$/, "");
  const url = `${base}/blog/`;
  const res = await fetch(url, {
    credentials: "omit",
    headers: getLocaleHeaders(),
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.json().catch(() => ({})));
  }
  const data = await res.json();
  return mapBlogPostRows(data);
}

/** SSR списка блога с нужной локалью. */
export async function getBlogPostsForLocale(locale: string): Promise<BlogPostItem[]> {
  const base = (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1").replace(
    /\/$/,
    "",
  );
  const res = await fetch(`${base}/blog/`, {
    credentials: "omit",
    headers: {
      "Content-Type": "application/json",
      "Accept-Language": locale,
      "X-Locale": locale,
    },
    next: { revalidate: 120 },
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.json().catch(() => ({})));
  }
  const data = await res.json();
  return mapBlogPostRows(data);
}

export async function getBlogPost(slug: string): Promise<BlogPostDetail> {
  const base = BASE_URL.replace(/\/$/, "");
  const url = `${base}/blog/${encodeURIComponent(slug)}/`;
  const res = await fetch(url, {
    credentials: "omit",
    headers: getLocaleHeaders(),
  });
  if (!res.ok) {
    throw new ApiError(res.status, await res.json().catch(() => ({})));
  }
  const data = await res.json();
  return {
    slug: String(data.slug ?? ""),
    title: String(data.title ?? ""),
    excerpt: String(data.excerpt ?? ""),
    published_at: String(data.published_at ?? ""),
    body_html: String(data.body_html ?? ""),
    available_locales: Array.isArray(data.available_locales)
      ? (data.available_locales as string[]).filter((x) => typeof x === "string")
      : [],
    cover_image_url:
      data.cover_image_url === null ||
      data.cover_image_url === undefined ||
      data.cover_image_url === ""
        ? null
        : String(data.cover_image_url),
  };
}

/** SSR/метаданные: пост с заголовками локали (getBlogPost на сервере всегда брал бы en). */
export async function getBlogPostForLocale(
  slug: string,
  locale: string,
): Promise<BlogPostDetail | null> {
  const base = (
    typeof window !== "undefined"
      ? (process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1")
      : process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8001/api/v1"
  ).replace(/\/$/, "");
  const url = `${base}/blog/${encodeURIComponent(slug)}/`;
  const res = await fetch(url, {
    credentials: "omit",
    headers: {
      "Accept-Language": locale,
      "X-Locale": locale,
    },
    next: { revalidate: 120 },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return {
    slug: String(data.slug ?? ""),
    title: String(data.title ?? ""),
    excerpt: String(data.excerpt ?? ""),
    published_at: String(data.published_at ?? ""),
    body_html: String(data.body_html ?? ""),
    available_locales: Array.isArray(data.available_locales)
      ? (data.available_locales as string[]).filter((x) => typeof x === "string")
      : [],
    cover_image_url:
      data.cover_image_url === null ||
      data.cover_image_url === undefined ||
      data.cover_image_url === ""
        ? null
        : String(data.cover_image_url),
  };
}

export async function getPlans(): Promise<Plan[]> {
  const base = BASE_URL.replace(/\/$/, "");
  const res = await fetch(`${base}/billing/plans/`, {
    credentials: "omit",
    headers: getLocaleHeaders(),
  });
  if (!res.ok) throw new ApiError(res.status, await res.json().catch(() => ({})));
  const data = await res.json();
  const list = Array.isArray(data) ? data : (data as { results?: Plan[] }).results ?? [];
  return [...list].sort((a, b) => (b.sort_order ?? 0) - (a.sort_order ?? 0));
}

/** План по id из публичного списка тарифов (отдельного эндпоинта нет). */
export async function getPlanById(planId: number): Promise<Plan | null> {
  const plans = await getPlans();
  return plans.find((p) => p.id === planId) ?? null;
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

export type PlisioCreateInvoiceResponse = {
  payment_id: number;
  plisio_invoice_id: string;
  invoice_url: string;
};

export type PlisioAllowedCurrency = { id: string; label: string };

export type PlisioAllowedCurrenciesResponse = {
  currencies: PlisioAllowedCurrency[];
};

export async function getPlisioAllowedCurrencies(): Promise<PlisioAllowedCurrenciesResponse> {
  return request<PlisioAllowedCurrenciesResponse>(
    "billing/plisio/allowed-currencies/",
  );
}

export async function createPlisioInvoice(
  planId: number,
  currency?: string | null,
): Promise<PlisioCreateInvoiceResponse> {
  const body: Record<string, unknown> = { plan_id: planId };
  if (currency != null && String(currency).trim() !== "") {
    body.currency = String(currency).trim();
  }
  return request<PlisioCreateInvoiceResponse>("billing/plisio/create-invoice/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** Ответ GET billing/upgrade-preview/:id/ при eligible=true */
export type UpgradePreview = {
  current_plan_id: number;
  target_plan_id: number;
  p_old: string;
  p_new: string;
  currency: string;
  d_total: number;
  d_remaining: number;
  credit_time: string;
  request_limit: number;
  requests_used: number;
  credit_requests: string;
  credit_applied: string;
  upgrade_amount: string;
};

/**
 * Если апгрейд недоступен (400) — null; иные ошибки пробрасываются.
 */
export async function getUpgradePreview(planId: number): Promise<UpgradePreview | null> {
  try {
    const data = await request<UpgradePreview & { eligible?: boolean }>(
      `billing/upgrade-preview/${planId}/`,
    );
    if (data.eligible === false) return null;
    return data;
  } catch (e) {
    if (e instanceof ApiError && e.status === 400) return null;
    throw e;
  }
}

export async function createUpgradeInvoice(
  planId: number,
  currency?: string | null,
): Promise<PlisioCreateInvoiceResponse> {
  const body: Record<string, unknown> = {};
  if (currency != null && String(currency).trim() !== "") {
    body.currency = String(currency).trim();
  }
  return request<PlisioCreateInvoiceResponse>(
    `billing/upgrade/${planId}/create-invoice/`,
    {
      method: "POST",
      body: JSON.stringify(body),
    },
  );
}

export type PlisioPaymentStatusResponse = {
  payment_id: number;
  plisio_invoice_id: string;
  invoice_url: string;
  status: string;
  plan: string;
  amount_usd: string;
  currency: string;
  created_at: string;
};

export async function getPlisioPaymentStatus(
  paymentId: number,
): Promise<PlisioPaymentStatusResponse> {
  return request<PlisioPaymentStatusResponse>(
    `billing/plisio/payment/${paymentId}/`,
  );
}

/* ========== Usage ========== */

export type UsageStatus = {
  plan_name: string;
  request_limit: number;
  requests_used: number;
  period: string;
  on_demand_used_usd?: string;
  on_demand_limit_type?: "fixed" | "unlimited" | null;
  on_demand_limit_amount_usd?: string | null;
  next_request_may_be_ondemand?: boolean;
};

export async function getUsageStatus(): Promise<UsageStatus> {
  return request<UsageStatus>("usage/");
}

/* ========== Account aggregates (cabinet) ========== */

export type BillingSummaryPayment = {
  id: number;
  /** Сумма в USD (legacy; дублирует amount_usd). */
  amount: string;
  /** Код валюты оплаты на стороне Plisio (крипто); дублирует pay_currency. */
  currency: string;
  amount_usd?: string;
  pay_currency?: string;
  /** Человекочитаемое имя валюты Plisio (маппинг с бэка); неизвестный код = сам код. */
  pay_currency_label?: string;
  amount_crypto?: string | null;
  status: string;
  provider: string;
  plan_name: string;
  created_at: string;
  paid_at: string | null;
  invoice_url: string | null;
  receipt_url: string | null;
};

export type BillingSummaryLicense = {
  status: string;
  is_active: boolean;
  plan?: string | null;
  expires_at?: string | null;
  device_limit?: number;
  device_count?: number;
  session_limit?: number;
  session_count?: number;
  reason?: string | null;
  plan_label?: string;
  status_label?: string;
  reason_label?: string;
};

export type BillingSummary = {
  license: BillingSummaryLicense;
  current_plan: {
    plan_name: string;
    tier: string | null;
    status: string;
    is_active: boolean;
    started_at: string | null;
    expires_at: string | null;
    renews_at: string | null;
    request_limit: number;
    device_limit: number;
    metrics_limit: number | null;
    on_demand_limit_usd: string | null;
    price: string;
    currency: string;
  };
  payments: BillingSummaryPayment[];
  subscriptions: Array<{
    id: number;
    plan_name: string;
    tier: string;
    status: string;
    is_active_now: boolean;
    started_at: string;
    valid_until: string;
    request_limit: number;
    device_limit: number;
  }>;
  entitlements: {
    requests_per_month: number;
    sessions_max: number;
    devices_in_use: number;
    sessions_in_use: number;
  };
  actions: {
    show_upgrade: boolean;
    show_renew: boolean;
    pricing_path: string;
    /** On-demand пополнение только при активной платной подписке (нет в старых ответах API — считать false). */
    on_demand_available?: boolean;
  };
  on_demand: {
    balance_usd: string;
    available_requests_estimate: number;
    pending_invoice: {
      id: string;
      invoice_number: string;
      amount_usd: string;
      status: string;
      created_at: string;
      expired_at: string | null;
      invoice_url: string | null;
    } | null;
  };
};

export async function getBillingSummary(): Promise<BillingSummary> {
  return request<BillingSummary>("account/billing-summary/");
}

export type UsageDashboardPeriod = "today" | "7d" | "30d" | "all";

export type UsageDashboardResponse = {
  period: UsageDashboardPeriod;
  kpis: {
    ai_requests_in_period: number;
    ai_requests_included_in_period: number;
    ai_requests_ondemand_in_period: number;
    metrics_sessions_in_period: number;
    metrics_total_duration_ms: number;
    metrics_total_points: number;
    connected_devices_count: number;
    total_requests_all_periods: number;
    requests_used_current_period: number;
  };
  limits: {
    request_limit: number;
    requests_used_current_period: number;
    billing_period: string;
    devices_in_use: number;
    on_demand_used_usd?: string | null;
    on_demand_limit_type?: string | null;
    on_demand_limit_amount_usd?: string | null;
  };
  progress: {
    requests: { used: number; limit: number; percent: number };
  };
  chart_points: Array<{
    date: string;
    ai_requests: number;
    metrics_sessions: number;
  }>;
  chart_granularity: string;
  breakdown: { diagnostic_reports_by_kind: Record<string, number> };
  recent_activity: Array<{
    external_id?: string;
    created_at?: string | null;
    vehicle_name_meta?: string;
    duration_ms?: number | null;
    points_count?: number | null;
  }>;
};

export async function getUsageDashboard(
  period: UsageDashboardPeriod,
): Promise<UsageDashboardResponse> {
  const q = new URLSearchParams({ period });
  return request<UsageDashboardResponse>(
    `account/usage-dashboard/?${q.toString()}`,
  );
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

export type OnDemandBalanceApi = {
  balance_usd: string;
  available_requests_estimate: number;
  usd_per_request: string;
  pending_invoices_count: number;
};

export type OnDemandInvoiceApi = {
  id: string;
  invoice_number: string;
  amount_usd: string;
  status: string;
  payment_provider: string;
  created_at: string;
  paid_at: string | null;
  expired_at: string | null;
  cancelled_at: string | null;
  invoice_url: string;
};

export type OnDemandInvoiceCreated = OnDemandInvoiceApi & {
  payment_url?: string | null;
  plisio_invoice_id?: string | null;
};

export type OnDemandTransactionApi = {
  id: string;
  transaction_type: string;
  amount_usd: string;
  balance_before_usd: string;
  balance_after_usd: string;
  created_at: string;
  description: string;
};

export async function getOnDemandBalance(): Promise<OnDemandBalanceApi> {
  return request<OnDemandBalanceApi>("billing/on-demand/balance/");
}

export async function listOnDemandInvoices(): Promise<
  Paginated<OnDemandInvoiceApi>
> {
  return request<Paginated<OnDemandInvoiceApi>>("billing/on-demand/invoices/");
}

export async function createOnDemandInvoice(
  amount_usd: string,
  currency?: string | null,
): Promise<OnDemandInvoiceCreated> {
  const body: Record<string, unknown> = { amount_usd };
  if (currency != null && String(currency).trim() !== "") {
    body.currency = String(currency).trim();
  }
  return request<OnDemandInvoiceCreated>("billing/on-demand/invoices/", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export async function cancelOnDemandInvoice(
  id: string,
): Promise<OnDemandInvoiceApi> {
  return request<OnDemandInvoiceApi>(
    `billing/on-demand/invoices/${id}/cancel/`,
    { method: "POST", body: JSON.stringify({}) },
  );
}

export async function listOnDemandTransactions(): Promise<
  Paginated<OnDemandTransactionApi>
> {
  return request<Paginated<OnDemandTransactionApi>>(
    "billing/on-demand/transactions/",
  );
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

/* ========== OBD records & diagnostic chat ========== */

export type OBDRecordBriefVehicle = {
  id: number;
  make: string;
  model: string;
  year: number | null;
};

export type OBDRecordListItem = {
  id: number;
  external_id: string;
  schema_version: number;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  vehicle: OBDRecordBriefVehicle | null;
  vehicle_name_meta: string;
  vin: string;
  adapter_type: string;
  comment: string;
  tags: string[];
  pids: string[];
  points_count: number;
  errors_survey_kind: string;
  errors_captured_at: string | null;
  created_at: string;
  updated_at: string;
};

export type Paginated<T> = {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
};

export async function getObdRecordsPage(
  page = 1,
  pageSize = 20,
): Promise<Paginated<OBDRecordListItem>> {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  return request<Paginated<OBDRecordListItem>>(`diagnostics/obd-records/?${params}`);
}

export type OBDRecordDetail = OBDRecordListItem & {
  errors_snapshot: Record<string, unknown> | null;
};

export async function getObdRecordDetail(externalId: string): Promise<OBDRecordDetail> {
  return request<OBDRecordDetail>(`diagnostics/obd-records/${externalId}/`);
}

export type OBDRecordSummary = {
  record_id: string;
  meta: Record<string, unknown>;
  pids: string[];
  points_total: number;
  time_from_ms: number | null;
  time_to_ms: number | null;
  stats: Record<string, { min?: number; max?: number; avg?: number; samples: number }>;
  anomalies: string[];
  text_summary: string;
};

export async function getObdRecordSummary(externalId: string): Promise<OBDRecordSummary> {
  return request<OBDRecordSummary>(`diagnostics/obd-records/${externalId}/summary/`);
}

export type OBDRecordSegment = {
  record_id: string;
  from_ms: number;
  to_ms: number;
  fields: string[];
  points: Array<{ timestamp: number; values: Record<string, unknown> }>;
};

export async function getObdRecordSegment(
  externalId: string,
  fromMs: number,
  toMs: number,
  fields?: string[],
): Promise<OBDRecordSegment> {
  const params = new URLSearchParams({
    from: String(fromMs),
    to: String(toMs),
  });
  if (fields?.length) {
    params.set("fields", fields.join(","));
  }
  return request<OBDRecordSegment>(`diagnostics/obd-records/${externalId}/segment/?${params}`);
}

export type OBDRecordChatBootstrap = {
  chat_session_id: number;
  session_id: number;
  created: boolean;
};

export async function bootstrapObdRecordChat(externalId: string): Promise<OBDRecordChatBootstrap> {
  return request<OBDRecordChatBootstrap>(
    `diagnostics/obd-records/${externalId}/chat/bootstrap/`,
    {
      method: "POST",
      body: JSON.stringify({}),
    },
  );
}

export type DiagnosticChatMessage = {
  id: number;
  role: string;
  content: string;
  created_at: string;
};

export type DiagnosticChatSessionDetail = {
  id: number;
  vehicle_id: number | null;
  title: string;
  created_at: string;
  updated_at: string;
  source_obd_record_id: number | null;
  source_obd_record_external_id: string | null;
  messages: DiagnosticChatMessage[];
};

export type DiagnosticChatFollowupResponse = {
  ai_analysis: string;
  session_id: number;
  ai_quota_mode?: string;
  next_request_may_be_ondemand?: boolean;
};

export async function sendDiagnosticChatMessage(
  sessionId: number,
  message: string,
): Promise<DiagnosticChatFollowupResponse> {
  return request<DiagnosticChatFollowupResponse>(
    `diagnostics/chat/sessions/${sessionId}/messages/`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    },
  );
}

/** @deprecated Use getVehicles instead */
export async function getDiagnosticsVehicles(): Promise<Vehicle[]> {
  return getVehicles();
}

/* ========== История ИИ-диагностики ========== */

export type DiagnosticReportListItem = {
  id: number;
  report_kind: string;
  dtc_codes: string[];
  created_at: string;
  vehicle_id: number | null;
};

export type DiagnosticHistoryResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: DiagnosticReportListItem[];
};

export type DiagnosticReportDetail = {
  id: number;
  report_kind: string;
  dtc_codes: string[];
  live_data_snapshot: Record<string, unknown>;
  ai_analysis: string;
  created_at: string;
  vehicle: {
    id: number;
    make: string;
    model: string;
    year: number | null;
  } | null;
};

export async function getDiagnosticHistory(
  page = 1,
  pageSize?: number,
): Promise<DiagnosticHistoryResponse> {
  const params = new URLSearchParams({ page: String(page) });
  if (pageSize != null) params.set("page_size", String(pageSize));
  return request<DiagnosticHistoryResponse>(
    `diagnostics/history/?${params.toString()}`,
  );
}

export async function getDiagnosticReport(
  id: number,
): Promise<DiagnosticReportDetail> {
  return request<DiagnosticReportDetail>(`diagnostics/reports/${id}/`);
}

/* ========== Чат-сессии диагностики (мультитёрн follow-up) ========== */

export type DiagnosticChatSessionCreated = {
  id: number;
  created_at: string;
  updated_at: string;
};

export type DiagnosticChatSessionListItem = {
  id: number;
  title: string;
  created_at: string;
  updated_at: string;
  vehicle_id: number | null;
  message_count: number;
  last_message_preview: string;
};

export type DiagnosticChatSessionsResponse = {
  count: number;
  next: string | null;
  previous: string | null;
  results: DiagnosticChatSessionListItem[];
};

/** GET /api/v1/diagnostics/chat/sessions/ — список сессий (пагинация DRF) */
export async function getDiagnosticChatSessions(
  page = 1,
  pageSize?: number,
): Promise<DiagnosticChatSessionsResponse> {
  const params = new URLSearchParams({ page: String(page) });
  if (pageSize != null) params.set("page_size", String(pageSize));
  return request<DiagnosticChatSessionsResponse>(
    `diagnostics/chat/sessions/?${params.toString()}`,
  );
}

/** POST /api/v1/diagnostics/chat/sessions/ — опционально { vehicle_id } */
export async function createDiagnosticChatSession(body?: {
  vehicle_id?: number | null;
}): Promise<DiagnosticChatSessionCreated> {
  return request<DiagnosticChatSessionCreated>("diagnostics/chat/sessions/", {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
}

/** GET /api/v1/diagnostics/chat/sessions/<id>/ — история сообщений */
export async function getDiagnosticChatSession(
  id: number,
): Promise<DiagnosticChatSessionDetail> {
  return request<DiagnosticChatSessionDetail>(
    `diagnostics/chat/sessions/${id}/`,
  );
}

/** POST /api/v1/diagnostics/chat/sessions/<id>/messages/ — свободный текст (квота как у analyze) */
export async function postDiagnosticChatMessage(
  sessionId: number,
  message: string,
): Promise<{ ai_analysis: string; session_id: number }> {
  return request<{ ai_analysis: string; session_id: number }>(
    `diagnostics/chat/sessions/${sessionId}/messages/`,
    {
      method: "POST",
      body: JSON.stringify({ message }),
    },
  );
}

/** Одно событие SSE из POST .../messages/stream/ */
export type DiagnosticChatSseEvent = {
  event: string;
  data: Record<string, unknown>;
};

/**
 * POST /api/v1/diagnostics/chat/sessions/<id>/messages/stream/ — поток SSE.
 * События: `status`, `reasoning_delta`, `content_delta`, `sources`, `done`, `error`.
 * `done` приходит после биллинга и содержит `ai_quota_mode`, `web_search_sources`, …
 */
export async function postDiagnosticChatMessageStream(
  sessionId: number,
  message: string,
  options: {
    onEvent: (e: DiagnosticChatSseEvent) => void;
    signal?: AbortSignal;
  },
): Promise<void> {
  const path = `diagnostics/chat/sessions/${sessionId}/messages/stream/`;
  const url = path.startsWith("http")
    ? path
    : `${BASE_URL.replace(/\/$/, "")}/${path.replace(/^\//, "")}`;
  const token = getToken();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Accept: "text/event-stream",
    ...getLocaleHeaders(),
  };
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify({ message }),
    signal: options.signal,
  });

  if (!res.ok) {
    const errBody = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    throw new ApiError(res.status, errBody);
  }

  const body = res.body;
  if (!body) {
    return;
  }

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  const flushCompleteFrames = () => {
    let sep: number;
    while ((sep = buffer.indexOf("\n\n")) >= 0) {
      const rawBlock = buffer.slice(0, sep);
      buffer = buffer.slice(sep + 2);
      if (!rawBlock.trim()) {
        continue;
      }
      let evName = "";
      const dataLines: string[] = [];
      for (const line of rawBlock.split("\n")) {
        if (line.startsWith("event:")) {
          evName = line.slice(6).trim();
        } else if (line.startsWith("data:")) {
          dataLines.push(line.slice(5).trimStart());
        }
      }
      if (!evName || dataLines.length === 0) {
        continue;
      }
      try {
        const data = JSON.parse(dataLines.join("\n")) as Record<string, unknown>;
        options.onEvent({ event: evName, data });
      } catch {
        /* некорректный JSON в кадре */
      }
    }
  };

  for (;;) {
    const { done, value } = await reader.read();
    if (done) {
      flushCompleteFrames();
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    flushCompleteFrames();
  }
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
