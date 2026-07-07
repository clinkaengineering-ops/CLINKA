import { loadEnv } from "./config/loadEnv";
loadEnv();
import http from "http";
import app from "./app";
import db from "./config/db";
import transporter from "./config/mailer";
import { validateProductionEnv } from "./config/env";
import { initSocket } from "./socket";
import { startPayoutReconciliationScheduler } from "./modules/payouts/payout.scheduler";

validateProductionEnv();

const PORT = Number(process.env.PORT) || 5000;

const httpServer = http.createServer(app);
initSocket(httpServer);               // ← attach Socket.IO

httpServer.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);

  await db.$connect();
  console.log("✅ Database connected successfully");

  startPayoutReconciliationScheduler();

  try {
    await transporter.verify();
    console.log("✅ SMTP transporter is ready");
  } catch (error) {
    console.error(
      "❌ SMTP transporter failed:",
      error instanceof Error ? error.message : error,
    );
  }
});