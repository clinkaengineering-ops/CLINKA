import dotenv from "dotenv";
import path from "path";

let loaded = false;

/** Load `.env` then `.env.local` (local overrides) from the backend package root. */
export function loadEnv(): void {
  if (loaded) return;

  const root = path.resolve(__dirname, "../..");
  dotenv.config({ path: path.join(root, ".env") });
  dotenv.config({ path: path.join(root, ".env.local"), override: true });

  loaded = true;
}
