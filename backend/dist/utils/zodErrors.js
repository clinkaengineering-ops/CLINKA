"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.zodToFieldErrors = zodToFieldErrors;
exports.formatZodError = formatZodError;
function zodToFieldErrors(error) {
    const errors = {};
    for (const issue of error.issues) {
        const key = issue.path.length > 0 ? issue.path.join(".") : "_form";
        if (!errors[key]) {
            errors[key] = issue.message;
        }
    }
    return errors;
}
function formatZodError(error) {
    const errors = zodToFieldErrors(error);
    const first = Object.values(errors)[0];
    return {
        message: first ?? "Validation failed. Please check your input.",
        errors,
    };
}
