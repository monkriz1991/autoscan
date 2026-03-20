/**
 * История: в production скрываем служебные поля снимка (промпты, _*).
 * В dev или при NEXT_PUBLIC_HISTORY_DEBUG=1 — полный JSON.
 */

export function isHistoryDebugMode(): boolean {
  if (typeof process === "undefined") return false;
  return (
    process.env.NODE_ENV === "development" ||
    process.env.NEXT_PUBLIC_HISTORY_DEBUG === "1"
  );
}

export function sanitizeLiveDataSnapshotForHistory(
  snapshot: Record<string, unknown>,
  isDev: boolean,
): Record<string, unknown> {
  if (isDev) {
    return { ...snapshot };
  }
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(snapshot)) {
    if (k.startsWith("_")) {
      continue;
    }
    const lower = k.toLowerCase();
    if (
      lower === "system" ||
      lower === "system_prompt" ||
      lower === "user_prompt" ||
      lower.includes("system_prompt") ||
      lower.includes("user_prompt") ||
      lower.includes("resolved_prompt") ||
      lower.includes("llm_system") ||
      lower.includes("prompt_template") ||
      lower.includes("prompt_debug")
    ) {
      continue;
    }
    out[k] = v;
  }
  return out;
}
