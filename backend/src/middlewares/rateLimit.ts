import rateLimit from "express-rate-limit";

// Limit repeated login attempts to 10 per 15 minutes per IP
export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: "Too many login attempts. Please try again later." },
});

// Limit OTP generation to 5 per 15 minutes per IP
export const otpRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many OTP requests. Please try again later." },
});

// Limit manual payment submissions to 5 per hour per IP
export const manualSubmitRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: { success: false, message: "Too many manual payment submissions. Please wait before submitting again." },
});
