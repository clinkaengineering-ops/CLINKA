// Simple in-memory metrics tracker
export const metrics = {
  payouts_duplicate_blocked: 0,
  webhook_replay_blocked: 0,
  reconciliation_retries: 0,
  
  increment(metric: "payouts_duplicate_blocked" | "webhook_replay_blocked" | "reconciliation_retries") {
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
