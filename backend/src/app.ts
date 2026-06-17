import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import { getAllowedOrigins } from "./config/cors";
import { errorHandler } from "./middlewares/errorHandler.middleware";
import registerRoutes from "./routes/index";
dotenv.config();
const app = express();

const allowedOrigins = getAllowedOrigins();
app.use(
  cors({
    origin(origin, callback) {
      if (!origin || allowedOrigins.includes(origin)) {
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
