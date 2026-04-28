/**
 * Генерирует frontend/src/data/dtc-code-keys.json из справочника Django (импорт DTC).
 * Запуск из каталога frontend: npm run generate:dtc-sitemap-fallback
 */
import { existsSync, readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");
const srcPath = join(repoRoot, "apps", "dtc", "data", "dtc_codes_source.json");
const outDir = join(__dirname, "..", "src", "data");
const outPath = join(outDir, "dtc-code-keys.json");

if (!existsSync(srcPath)) {
  if (!existsSync(outPath)) {
    throw new Error(
      `[generate-dtc-sitemap-fallback] source not found: ${srcPath}; fallback not found: ${outPath}`,
    );
  }

  const keys = JSON.parse(readFileSync(outPath, "utf8"));
  if (!Array.isArray(keys)) {
    throw new Error(`[generate-dtc-sitemap-fallback] fallback must be a JSON array: ${outPath}`);
  }

  console.info(`[generate-dtc-sitemap-fallback] source missing, using existing ${keys.length} codes → ${outPath}`);
  process.exit(0);
}

const raw = JSON.parse(readFileSync(srcPath, "utf8"));
const bucket = raw.codes && typeof raw.codes === "object" ? raw.codes : {};
const keys = Object.keys(bucket).sort();
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, `${JSON.stringify(keys)}\n`, "utf8");
console.info(`[generate-dtc-sitemap-fallback] wrote ${keys.length} codes → ${outPath}`);
