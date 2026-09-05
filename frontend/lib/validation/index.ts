import type { ZodType } from "zod";

export type FieldErrors = Record<string, string>;

export type ValidationResult<T> =
  | { success: true; data: T; errors: FieldErrors }
  | { success: false; data?: undefined; errors: FieldErrors };

export function validateForm<T>(
  schema: ZodType<T>,
  data: unknown,
): ValidationResult<T> {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data, errors: {} };
  }

  const errors: FieldErrors = {};
  for (const issue of result.error.issues) {
    const key = issue.path.length > 0 ? String(issue.path[0]) : "_form";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return { success: false, errors };
}

export function firstError(errors: FieldErrors): string | null {
  return errors._form ?? Object.values(errors)[0] ?? null;
}

export type ApiErrorBody = {
  message?: string;
  errors?: FieldErrors;
  data?: { errors?: FieldErrors };
};

type AxiosLikeError = {
  code?: string;
  message?: string;
  response?: { status?: number; data?: ApiErrorBody };
};

/** Merge server validation errors with a fallback message. */
export function parseApiValidation(err: unknown): {
  message: string;
  errors: FieldErrors;
} {
  const e = err as AxiosLikeError;

  if (e.code === "ECONNABORTED") {
    return {
      message: "Upload timed out. Check your connection and try again.",
      errors: {},
    };
  }

  if (e.code === "ERR_NETWORK" || !e.response) {
    return {
      message: "Could not reach the server. Check your connection and try again.",
      errors: {},
    };
  }

  const status = e.response.status;
  if (status === 413) {
    return {
      message: "This upload is too large. Please use smaller files and try again.",
      errors: {},
    };
  }

  const body = e.response.data;
  const errors = body?.errors ?? body?.data?.errors ?? {};
  let message =
    body?.message ??
    errors._form ??
    Object.values(errors)[0] ??
    null;

  if (
    !message ||
    (status !== undefined &&
      status >= 500 &&
      message.toLowerCase().includes("internal server"))
  ) {
    message = "Something went wrong. Please try again.";
  }

  return { message, errors };
}

export * from "./schemas";
export * from "./fields";
