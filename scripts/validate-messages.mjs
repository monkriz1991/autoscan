/**
 * Проверка messages/*.json: валидный JSON + паритет ключей с en.json (плоский список путей).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "messages");

/** Плоский список путей вида `a.b.c` для вложенных объектов (массивы — лист). */
function flattenKeys(obj, prefix = "") {
  const out = {};
  if (obj === null || typeof obj !== "object") {
    out[prefix || "__root__"] = obj;
    return out;
  }
  if (Array.isArray(obj)) {
    out[prefix || "__root__"] = obj;
    return out;
  }
  for (const k of Object.keys(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    const v = obj[k];
    if (v !== null && typeof v === "object" && !Array.isArray(v)) {
      Object.assign(out, flattenKeys(v, key));
    } else {
      out[key] = v;
    }
  }
  return out;
}

const files = fs.readdirSync(root).filter((f) => f.endsWith(".json"));
let ok = 0;
const parsed = {};
for (const name of files) {
  const p = path.join(root, name);
  try {
    parsed[name] = JSON.parse(fs.readFileSync(p, "utf8"));
    ok += 1;
  } catch (e) {
    console.error(`Invalid JSON: ${p}\n${e.message}`);
    process.exit(1);
  }
}

const refName = "en.json";
if (!parsed[refName]) {
  console.error(`Missing reference file: ${refName}`);
  process.exit(1);
}
const refFlat = flattenKeys(parsed[refName]);
const refKeys = Object.keys(refFlat).sort();

for (const name of files) {
  if (name === refName) continue;
  const flat = flattenKeys(parsed[name]);
  const missing = refKeys.filter((k) => !(k in flat));
  const extra = Object.keys(flat).filter((k) => !(k in refFlat));
  if (missing.length || extra.length) {
    console.error(`Parity mismatch: ${name}`);
    if (missing.length) {
      console.error(
        "  missing:",
        missing.slice(0, 40).join(", "),
        missing.length > 40 ? `… (+${missing.length - 40} more)` : "",
      );
    }
    if (extra.length) {
      console.error(
        "  extra:",
        extra.slice(0, 40).join(", "),
        extra.length > 40 ? `… (+${extra.length - 40} more)` : "",
      );
    }
    process.exit(1);
  }
}

console.log(`messages: ${ok} JSON file(s) OK; key parity with ${refName} (${refKeys.length} keys)`);
