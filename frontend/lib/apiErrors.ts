type ApiErrorBody = {
  message?: string;
  errors?: Record<string, string>;
};

/** Extract a user-facing message from axios / fetch failures. */
export function getApiErrorMessage(
  err: unknown,
  fallback = "Request failed",
): string {
  const e = err as {
    response?: { data?: ApiErrorBody };
    message?: string;
  };

  const data = e.response?.data;
  if (data?.message?.trim()) return data.message.trim();

  if (data?.errors) {
    const first = Object.values(data.errors).find(Boolean);
    if (first) return first;
  }

  const msg = e.message?.trim();
  if (msg && msg !== "Network Error") return msg;

  return fallback;
}
