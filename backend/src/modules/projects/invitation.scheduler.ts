import { expireStaleInvitations } from "./invitation.service";

let invitationInterval: NodeJS.Timeout;

export function startInvitationScheduler() {
  console.log("⏰ Starting invitation expiration scheduler...");
  
  // Run once immediately
  expireStaleInvitations().catch((err) => {
    console.error("❌ Error expiring stale invitations:", err);
  });

  // Run every 12 hours
  const INTERVAL_MS = 12 * 60 * 60 * 1000;
  invitationInterval = setInterval(async () => {
    try {
      await expireStaleInvitations();
    } catch (error) {
      console.error("❌ Scheduled expiration of stale invitations failed:", error);
    }
  }, INTERVAL_MS);
}

export function stopInvitationScheduler() {
  if (invitationInterval) {
    clearInterval(invitationInterval);
  }
}
