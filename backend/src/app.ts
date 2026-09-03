import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { loadEnv } from "./config/loadEnv";
import { isAllowedOrigin } from "./config/cors";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import registerRoutes from "./routes/index";
import helmet from "helmet";
import rateLimit from "express-rate-limit";

import { ensureUploadRoot, getUploadRoot } from "./config/upload";

loadEnv();
const app = express();

ensureUploadRoot();
const uploadDir = getUploadRoot();

app.use("/uploads", express.static(uploadDir, {
  setHeaders: (res, filePath) => {
    const normalized = filePath.replace(/\\/g, "/");
    if (normalized.includes("/documents/")) {
      res.setHeader("Cache-Control", "private, no-store");
      return;
    }
    // Unique filenames can be cached immutably behind a CDN.
    res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  },
}));

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// Security headers
app.use(helmet());

// Rate limiting (max 1000 requests per 15 mins per IP)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many requests, please try again later." },
  handler: (req, res, _next, options) => {
    const resetTime = (req as typeof req & { rateLimit?: { resetTime?: Date } }).rateLimit
      ?.resetTime;
    const retryAfter = resetTime
      ? Math.max(1, Math.ceil((resetTime.getTime() - Date.now()) / 1000))
      : Math.max(1, Math.ceil(options.windowMs / 1000));
    res.setHeader("Retry-After", String(retryAfter));
    res.status(options.statusCode).json(options.message);
  },
});
app.use("/api", apiLimiter);

app.use(
  cors({
    origin(origin, callback) {
      if (isAllowedOrigin(origin)) {
        callback(null, true);
        return;
      }
      callback(null, false);
    },
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "API is running", success: true });
});
registerRoutes(app);

app.use(errorHandler);

export default app;
