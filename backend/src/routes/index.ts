import { Application } from "express";
import authRouter from "../modules/auth/auth.routes";
import userRouter from "../modules/users/user.routes";
import projectRouter from "../modules/projects/project.routes";
import bidRouter from "../modules/bids/bids.routes";
import bidsMineRouter from "../modules/bids/bids-mine.routes";
import messageRouter from "../modules/messages/messages.routes";
import paymentsRouter from "../modules/payments/payments.routes";
import manualPaymentRouter from "../modules/payments/manual-payment.routes";
import reviewsRouter from "../modules/reviews/reviews.routes";
import adminRouter from "../modules/admin/admin.routes";
import adminFinanceRouter from "../modules/admin/admin.finance.routes";
import publicRouter from "../modules/public/public.routes";
import notificationsRouter from "../modules/notifications/notifications.routes";
import taxonomyRouter from "../modules/taxonomy/taxonomy.routes";
import disputesRouter from "../modules/disputes/disputes.routes";

export default function registerRoutes(app: Application) {
  app.use("/api/public", publicRouter);
  app.use("/api/notifications", notificationsRouter);
  app.use("/api/payments", paymentsRouter);
  app.use("/api/payments", manualPaymentRouter);
  app.use("/api/reviews", reviewsRouter);
  app.use("/api/admin/finance", adminFinanceRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api/messages", messageRouter);
  app.use("/api/bids", bidsMineRouter);
  app.use("/api/auth", authRouter);
  app.use("/api/users", userRouter);
  app.use("/api/projects", projectRouter);
  app.use("/api/projects", bidRouter);
  app.use("/api/taxonomy", taxonomyRouter);
  app.use("/api/disputes", disputesRouter);

  // Debug endpoints
  app.get("/api/debug/email", async (req, res) => {
    if (process.env.NODE_ENV === "production" && req.query.admin !== "true") {
      return res.status(403).json({ error: "Forbidden in production" });
    }

    try {
      const transporter = (await import("../config/mailer")).default;
      const { getEmailFrom, notificationEmailHtml } = await import("../utils/emailTemplate");
      const to = req.query.to as string || "test@example.com";
      
      const result = await transporter.sendMail({
        from: getEmailFrom(),
        to,
        subject: "CLINKA Test Email",
        html: notificationEmailHtml({
          title: "Test Email from CLINKA Debug",
          body: "If you received this, the email configuration is working correctly.",
        }),
      });

      res.json({ success: true, messageId: result.messageId, accepted: result.accepted });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      });
    }
  });
}
