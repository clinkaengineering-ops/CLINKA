const STORAGE_KEY = "clinka.checkout.return";

export type StoredCheckoutReturn = {
  projectId: number;
  paymentId: number;
};

export function readCheckoutReturnStorage(): StoredCheckoutReturn | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { projectId?: number; paymentId?: number };
    if (
      parsed?.projectId &&
      Number.isInteger(parsed.projectId) &&
      parsed.projectId > 0 &&
      parsed?.paymentId &&
      Number.isInteger(parsed.paymentId) &&
      parsed.paymentId > 0
    ) {
      return { projectId: parsed.projectId, paymentId: parsed.paymentId };
    }
  } catch {
    // ignore malformed fallback data
  }
  return null;
}

export function writeCheckoutReturnStorage(state: StoredCheckoutReturn) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore storage failures
  }
}

export function clearCheckoutReturnStorage() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(STORAGE_KEY);
}
