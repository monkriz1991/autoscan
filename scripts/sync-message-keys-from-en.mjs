/**
 * Дозаполняет в каждом messages/*.json отсутствующие ключи из en.json (рекурсивно).
 * Запуск: `node scripts/sync-message-keys-from-en.mjs`
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "messages");
const enPath = path.join(root, "en.json");
const en = JSON.parse(fs.readFileSync(enPath, "utf8"));

function fillMissing(target, source) {
  for (const key of Object.keys(source)) {
    if (!(key in target)) {
      target[key] = structuredClone(source[key]);
      continue;
    }
    const sv = source[key];
    const tv = target[key];
    if (sv !== null && typeof sv === "object" && !Array.isArray(sv) && tv !== null && typeof tv === "object" && !Array.isArray(tv)) {
      fillMissing(tv, sv);
    }
  }
}

for (const name of fs.readdirSync(root)) {
  if (!name.endsWith(".json") || name === "en.json") continue;
  const p = path.join(root, name);
  const data = JSON.parse(fs.readFileSync(p, "utf8"));
  fillMissing(data, en);
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log("synced:", name);
}
