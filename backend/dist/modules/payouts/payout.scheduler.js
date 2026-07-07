"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPayoutReconciliationScheduler = startPayoutReconciliationScheduler;
const payout_service_1 = require("./payout.service");
const paymob_1 = require("../../config/paymob");
const DEFAULT_INTERVAL_MS = 5 * 60 * 1000;
function startPayoutReconciliationScheduler() {
    if (process.env.PAYMOB_PAYOUT_RECONCILE_ENABLED === "false") {
        console.log("ℹ️ Paymob payout reconciliation scheduler disabled");
        return;
    }
    if (!(0, paymob_1.isPaymobPayoutConfigured)()) {
        console.log("ℹ️ Paymob payout reconciliation skipped (credentials not configured)");
        return;
    }
    const intervalMs = Number(process.env.PAYMOB_PAYOUT_RECONCILE_INTERVAL_MS ?? DEFAULT_INTERVAL_MS);
    const run = async () => {
        try {
            const result = await (0, payout_service_1.reconcilePendingPayouts)();
            if (result.updated > 0) {
                console.log(`[payout-reconcile] Updated ${result.updated} of ${result.checked} pending payouts`);
            }
        }
        catch (error) {
            console.error("[payout-reconcile] Unexpected error:", error instanceof Error ? error.message : error);
        }
    };
    void run();
    setInterval(run, intervalMs);
    console.log(`✅ Paymob payout reconciliation scheduler started (every ${Math.round(intervalMs / 1000)}s)`);
}
