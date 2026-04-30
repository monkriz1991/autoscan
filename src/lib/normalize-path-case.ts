/**
 * Нормализация регистра сегментов пути без префикса локали:
 * /DTC/p0420 → /dtc/P0420 (код DTC — верхний регистр).
 */
export function normalizePathSegmentsCase(pathWithoutLocale: string): string | null {
  const raw = pathWithoutLocale.trim();
  if (!raw || raw === "/") {
    return null;
  }
  const trimmed = raw.replace(/\/+$/, "") || "/";
  const parts = trimmed.split("/");
  const out: string[] = [];
  let prevSeg = "";
  let changed = false;
  for (const part of parts) {
    if (part === "") {
      out.push("");
      continue;
    }
    const isDtcCode = /^[PBCU][0-9A-Fa-f]{4}$/.test(part);
    if (prevSeg === "dtc" && isDtcCode) {
      const canon = part.toUpperCase();
      if (canon !== part) {
        changed = true;
      }
      out.push(canon);
      prevSeg = canon;
    } else {
      const low = part.toLowerCase();
      if (low !== part) {
        changed = true;
      }
      out.push(low);
      prevSeg = low;
    }
  }
  const normalized = out.join("/");
  return changed ? normalized : null;
}
