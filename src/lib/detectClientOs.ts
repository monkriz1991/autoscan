/**
 * Эвристика определения ОС в браузере для выбора установщика на странице «Скачать».
 * Значения совпадают с query client_os backend API.
 */

export type ClientOs =
  | "windows"
  | "macos_intel"
  | "macos_arm"
  | "linux"
  | "unknown";

type NavigatorUAData = {
  platform?: string;
  getHighEntropyValues?: (hints: string[]) => Promise<{ architecture?: string; bitness?: string }>;
};

function uaHasArmMac(ua: string): boolean {
  const u = ua.toLowerCase();
  return (
    u.includes("mac os x") &&
    (u.includes("arm64") || u.includes("aarch64") || /\barm\b.*mac|\bmac.*\barm\b/.test(u))
  );
}

/**
 * Синхронная часть (без await userAgentData): достаточно для первого рендера.
 */
export function detectClientOsSync(): ClientOs {
  if (typeof navigator === "undefined") return "unknown";

  const ua = navigator.userAgent || "";
  const platform = (navigator.platform || "").toLowerCase();

  if (/win/i.test(navigator.userAgent) || platform.includes("win")) {
    return "windows";
  }

  if (/android/i.test(ua)) {
    return "unknown";
  }

  if (/linux/i.test(ua) && !/android/i.test(ua)) {
    return "linux";
  }

  const isMac =
    /macintosh|mac os x/i.test(ua) || platform === "macintel" || platform.includes("mac");
  if (isMac) {
    if (uaHasArmMac(ua)) return "macos_arm";
    if (platform === "macintel" || /intel/i.test(ua)) return "macos_intel";
    return "macos_arm";
  }

  return "unknown";
}

/**
 * Уточнение через User-Agent Client Hints (Chrome и др.), если доступно.
 */
export async function detectClientOs(): Promise<ClientOs> {
  const sync = detectClientOsSync();
  if (typeof navigator === "undefined") return "unknown";

  const nav = navigator as Navigator & { userAgentData?: NavigatorUAData };
  const uad = nav.userAgentData;
  if (!uad?.getHighEntropyValues) return sync;

  try {
    const hints = await uad.getHighEntropyValues(["architecture", "bitness"]);
    const plat = (uad.platform || "").toLowerCase();
    const arch = (hints.architecture || "").toLowerCase();

    if (plat.includes("windows")) return "windows";
    if (plat.includes("linux")) return "linux";
    if (plat.includes("mac")) {
      if (arch.includes("arm") || arch === "aarch64") return "macos_arm";
      return "macos_intel";
    }
  } catch {
    // игнорируем — остаётся sync
  }

  return sync;
}
