/**
 * Выделяет первый OBD2 DTC из slug статьи блога (напр. p0420-code-meaning → P0420).
 */
export function extractDtcCodeFromSlug(slug: string): string | null {
  const m = slug.match(/[PBCU][0-9A-Fa-f]{4}/i);
  return m ? m[0].toUpperCase() : null;
}
