/**
 * Генерирует frontend/src/data/dtc-code-keys.json из справочника Django (импорт DTC).
 * Запуск из каталога frontend: npm run generate:dtc-sitemap-fallback
 */
import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, "..", "..");
const srcPath = join(repoRoot, "apps", "dtc", "data", "dtc_codes_source.json");
const outDir = join(__dirname, "..", "src", "data");
const outPath = join(outDir, "dtc-code-keys.json");

const raw = JSON.parse(readFileSync(srcPath, "utf8"));
const bucket = raw.codes && typeof raw.codes === "object" ? raw.codes : {};
const keys = Object.keys(bucket).sort();
mkdirSync(outDir, { recursive: true });
writeFileSync(outPath, `${JSON.stringify(keys)}\n`, "utf8");
console.info(`[generate-dtc-sitemap-fallback] wrote ${keys.length} codes → ${outPath}`);
