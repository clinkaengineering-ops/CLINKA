"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.metrics = void 0;
// Simple in-memory metrics tracker
exports.metrics = {
    payouts_duplicate_blocked: 0,
    webhook_replay_blocked: 0,
    reconciliation_retries: 0,
    increment(metric) {
        this[metric]++;
    },
    get() {
        return {
            payouts_duplicate_blocked: this.payouts_duplicate_blocked,
            webhook_replay_blocked: this.webhook_replay_blocked,
            reconciliation_retries: this.reconciliation_retries,
        };
    }
};
