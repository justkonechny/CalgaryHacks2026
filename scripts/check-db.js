/**
 * Check if the video database and tables exist.
 * Loads .env.local from project root for DB_* vars.
 * Run from project root: node scripts/check-db.js
 */

import { createConnection } from "mysql2/promise";
import { readFileSync, existsSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, "..");
const envPath = join(root, ".env.local");

if (existsSync(envPath)) {
  const content = readFileSync(envPath, "utf8");
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const eq = trimmed.indexOf("=");
      if (eq > 0) {
        const key = trimmed.slice(0, eq).trim();
        let val = trimmed.slice(eq + 1).trim();
        if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
          val = val.slice(1, -1);
        }
        process.env[key] = val;
      }
    }
  });
}

const host = process.env.DB_HOST || "localhost";
const port = Number(process.env.DB_PORT || 3306);
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database = process.env.DB_NAME || "video";

if (!user) {
  console.error("Missing DB_USER (set in .env.local or env)");
  process.exit(1);
}

async function main() {
  let conn;
  try {
    conn = await createConnection({
      host,
      port,
      user,
      password: password || undefined,
    });

    const [dbRows] = await conn.query("SHOW DATABASES LIKE ?", [database]);
    if (dbRows.length === 0) {
      console.log(`Database "${database}" does NOT exist.`);
      process.exit(1);
    }
    console.log(`Database "${database}" exists.`);

    await conn.changeUser({ database });
    const [tableRows] = await conn.query("SHOW TABLES");
    const tableNames = tableRows.map((r) => Object.values(r)[0]);
    console.log("Tables:", tableNames.length ? tableNames.join(", ") : "(none)");

    const expected = ["Thread", "Video", "Quiz", "QuizOption", "Progress", "ThreadSource", "ThreadSetting"];
    const missing = expected.filter((t) => !tableNames.includes(t));
    if (missing.length > 0) {
      console.log("Missing expected tables:", missing.join(", "));
    } else {
      console.log("All expected tables present.");
    }
  } catch (e) {
    console.error("Error:", e?.message || e?.code || String(e));
    if (e?.code) console.error("Code:", e.code);
    process.exit(1);
  } finally {
    await conn?.end();
  }
}

main();
