/**
 * Определение ОС клиента для страницы скачивания (query client_os к API).
 */

export type ClientOs =
  | "windows"
  | "macos_arm"
  | "macos_intel"
  | "linux"
  | "unknown";

/** По User-Agent (SSR из headers или клиент navigator). */
export function detectClientOsFromUserAgent(ua: string | null | undefined): ClientOs {
  if (!ua || typeof ua !== "string") return "unknown";
  const u = ua.toLowerCase();

  if (u.includes("windows") || u.includes("win32") || u.includes("win64")) {
    return "windows";
  }

  if (u.includes("linux") && !u.includes("android")) {
    return "linux";
  }

  if (u.includes("mac os x") || u.includes("macintosh")) {
    if (u.includes("arm64") || u.includes("aarch64")) return "macos_arm";
    return "macos_intel";
  }

  return "unknown";
}

/** На клиенте: navigator.userAgent. */
export function detectClientOsInBrowser(): ClientOs {
  if (typeof navigator === "undefined" || !navigator.userAgent) return "unknown";
  return detectClientOsFromUserAgent(navigator.userAgent);
}

/** @deprecated Используйте detectClientOsInBrowser — алиас для совместимости. */
export const detectClientOs = detectClientOsInBrowser;
