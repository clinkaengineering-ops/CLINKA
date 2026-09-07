import db from "./config/db";

async function run() {
  try {
    const u = await db.user.create({
      data: { email: `test_${Date.now()}@test.com`, password: "x", name: "Test User", role: "CLIENT" }
    });
    console.log("SUCCESS:", u);
  } catch (e) {
    console.error("FAILED:", e);
  }
}
run();
