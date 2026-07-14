import { Application } from "express";
import authRouter from "../modules/auth/auth.routes";
import userRouter from "../modules/users/user.routes";
import projectRouter from "../modules/projects/project.routes";
import bidRouter from "../modules/bids/bids.routes";
import bidsMineRouter from "../modules/bids/bids-mine.routes";
import messageRouter from "../modules/messages/messages.routes";
import paymentsRouter from "../modules/payments/payments.routes";
import reviewsRouter from "../modules/reviews/reviews.routes";
import adminRouter from "../modules/admin/admin.routes";
import publicRouter from "../modules/public/public.routes";
import notificationsRouter from "../modules/notifications/notifications.routes";
import taxonomyRouter from "../modules/taxonomy/taxonomy.routes";

export default function registerRoutes(app: Application) {
  app.use("/api/public", publicRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/messages", messageRouter);
  app.use("/api/bids", bidsMineRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/projects", projectRouter);
  app.use("/api/projects", bidRouter);
  app.use("/api/taxonomy", taxonomyRouter);
}
