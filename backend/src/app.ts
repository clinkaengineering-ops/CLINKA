import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import authRouter from "./modules/auth/auth.routes";
import { errorHandler } from "./middlewares/errorHandler.middleware";

dotenv.config();
const app = express();

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "API is running", success: true });
});

app.use("/api/auth", authRouter);

app.use(errorHandler);

export default app;