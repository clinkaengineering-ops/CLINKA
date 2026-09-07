const STORAGE_KEY = "clinka.checkout.return";

export type StoredCheckoutReturn = {
  projectId: string;
  paymentId: number;
};

export function readCheckoutReturnStorage(): StoredCheckoutReturn | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { projectId?: string | number; paymentId?: number };
    const projectId =
      typeof parsed?.projectId === "string"
        ? parsed.projectId
        : typeof parsed?.projectId === "number" && parsed.projectId > 0
          ? String(parsed.projectId)
          : null;
    if (
      projectId &&
      parsed?.paymentId &&
      Number.isInteger(parsed.paymentId) &&
      parsed.paymentId > 0
    ) {
      return { projectId, paymentId: parsed.paymentId };
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
