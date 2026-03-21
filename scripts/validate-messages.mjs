/**
 * Проверка, что все messages/*.json — валидный JSON (ранний фейл до Turbopack).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "messages");
let ok = 0;
for (const name of fs.readdirSync(root)) {
  if (!name.endsWith(".json")) continue;
  const p = path.join(root, name);
  try {
    JSON.parse(fs.readFileSync(p, "utf8"));
    ok += 1;
  } catch (e) {
    console.error(`Invalid JSON: ${p}\n${e.message}`);
    process.exit(1);
  }
}
console.log(`messages: ${ok} JSON file(s) OK`);
