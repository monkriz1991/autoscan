import fs from "node:fs";
import path from "node:path";

const FILE = "terms-of-service";

/** Загрузка локализованного markdown условий; при отсутствии файла — EN. */
export function loadTermsMarkdown(locale: string): string {
  const base = path.join(process.cwd(), "src", "legal");
  const localized = path.join(base, `${FILE}.${locale}.md`);
  const fallback = path.join(base, `${FILE}.en.md`);
  try {
    if (fs.existsSync(localized)) {
      return fs.readFileSync(localized, "utf8");
    }
  } catch {
    /* fall through */
  }
  return fs.readFileSync(fallback, "utf8");
}
