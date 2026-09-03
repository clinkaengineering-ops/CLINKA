/**
 * Direct smoke test — no browser, works through dev tunnels.
 * Run: node --experimental-strip-types tests/smoke.mts
 * Or:  npm run test:smoke
 */
const FRONTEND =
  process.env.CLINKA_FRONTEND_URL ?? "http://localhost:3000";
const BACKEND =
  process.env.CLINKA_BACKEND_URL ?? "http://127.0.0.1:5000";

type Result = { name: string; ok: boolean; detail: string };

async function check(name: string, fn: () => Promise<void>): Promise<Result> {
  try {
    await fn();
    return { name, ok: true, detail: "ok" };
  } catch (e) {
    return { name, ok: false, detail: e instanceof Error ? e.message : String(e) };
  }
}

async function getJson(url: string) {
  const res = await fetch(url, { redirect: "follow" });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${text.slice(0, 200)}`);
  return JSON.parse(text) as Record<string, unknown>;
}

async function getHtml(url: string) {
  const res = await fetch(url, { redirect: "follow" });
  const html = await res.text();
  if (!res.ok) throw new Error(`${res.status}`);
  if (html.includes("developer tunnel") && html.includes("Continue"))
    throw new Error("hit dev-tunnel consent page — use localhost or accept tunnel in browser first");
  return html;
}

const publicRoutes = [
  "/",
  "/login",
  "/register",
  "/forgot-password",
  "/about",
  "/privacy",
  "/terms",
  "/security",
  "/help",
  "/projects",
  "/engineers",
];

const results: Result[] = [];

for (const route of publicRoutes) {
  results.push(
    await check(`GET ${route}`, async () => {
      const html = await getHtml(`${FRONTEND}${route}`);
      if (html.length < 100) throw new Error("response too short");
    }),
  );
}

results.push(
  await check("GET /api/health", async () => {
    const body = await getJson(`${BACKEND}/api/health`);
    if (!body.success) throw new Error("success !== true");
  }),
);

results.push(
  await check("GET /api/public/landing", async () => {
    const body = await getJson(`${BACKEND}/api/public/landing`);
    if (!body.success) throw new Error("success !== true");
  }),
);

results.push(
  await check("GET /api/projects", async () => {
    const body = await getJson(`${BACKEND}/api/projects`);
    if (!body.success) throw new Error("success !== true");
  }),
);

results.push(
  await check("GET /api/users/engineers", async () => {
    const body = await getJson(`${BACKEND}/api/users/engineers`);
    if (!body.success) throw new Error("success !== true");
  }),
);

results.push(
  await check("POST /api/auth/login (bad creds → 4xx)", async () => {
    const res = await fetch(`${BACKEND}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "bad@test.com", password: "wrong" }),
    });
    if (res.status < 400) throw new Error(`expected 4xx, got ${res.status}`);
  }),
);

results.push(
  await check("GET /api/users/me (no auth → 401)", async () => {
    const res = await fetch(`${BACKEND}/api/users/me`);
    if (res.status !== 401) throw new Error(`expected 401, got ${res.status}`);
  }),
);

const passed = results.filter((r) => r.ok).length;
const failed = results.filter((r) => !r.ok);

console.log(`\nCLINKA smoke test — ${passed}/${results.length} passed`);
console.log(`Frontend: ${FRONTEND}`);
console.log(`Backend:  ${BACKEND}\n`);

for (const r of results) {
  console.log(`${r.ok ? "✓" : "✗"} ${r.name}${r.ok ? "" : ` — ${r.detail}`}`);
}

if (failed.length) process.exit(1);
