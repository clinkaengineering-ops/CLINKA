import { ZodError } from "zod";

export type FieldErrors = Record<string, string>;

export function zodToFieldErrors(error: ZodError): FieldErrors {
  const errors: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
    if (!errors[key]) {
      errors[key] = issue.message;
    }
  }
  return errors;
}

export function formatZodError(error: ZodError): {
  message: string;
  errors: FieldErrors;
} {
  const errors = zodToFieldErrors(error);
  const first = Object.values(errors)[0];
  return {
    message: first ?? "Validation failed. Please check your input.",
    errors,
  };
}
