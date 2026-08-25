import { execFileSync } from "node:child_process";
import { writeFileSync } from "node:fs";

try {
  const output = execFileSync("npx", ["supabase", "gen", "types", "typescript", "--linked", "--schema", "public"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "inherit"],
  });
  writeFileSync("src/types/database.types.ts", output);
  console.log("Database types updated from linked Supabase project.");
} catch {
  console.error("Database types were not changed. Link/authenticate the remote Supabase project first.");
  process.exit(1);
}
