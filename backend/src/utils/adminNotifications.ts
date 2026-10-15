import db from "../config/db";
import transporter from "../config/mailer";
import {
  getEmailFrom,
  supportTicketNotificationEmailHtml,
  disputeEscalatedNotificationEmailHtml,
} from "./emailTemplate";

/**
 * Returns all active users in the system who hold the ADMIN role.
 */
export async function getAdminUsers(): Promise<{ id: string; email: string | null; name: string }[]> {
  try {
    return await db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true, name: true },
    });
  } catch (err) {
    console.error("Failed to query admin users:", err);
    return [];
  }
}

/**
 * Resolves the list of email addresses that should receive administrative alerts.
 * Combines all ADMIN users from the database with any explicit ADMIN_EMAIL environment variable.
 */
export async function getAdminEmailRecipients(): Promise<string[]> {
  const admins = await getAdminUsers();
  const emails = admins
    .map((a) => a.email?.trim())
    .filter((e): e is string => Boolean(e));

  const envAdmin = process.env.ADMIN_EMAIL?.trim();
  if (envAdmin) {
    const list = envAdmin.split(",").map((s) => s.trim()).filter(Boolean);
    for (const item of list) {
      if (!emails.some((existing) => existing.toLowerCase() === item.toLowerCase())) {
        emails.push(item);
      }
    }
  }

  return emails;
}

/**
 * Sends an email notification to admins and records in-app notifications
 * when a user or visitor submits a Support Contact Ticket.
 */
export async function notifyAdminsSupportTicket(input: {
  ticketId: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  userId?: string;
  submissionDate?: Date;
}): Promise<void> {
  const [admins, adminEmails] = await Promise.all([
    getAdminUsers(),
    getAdminEmailRecipients(),
  ]);

  const submissionDateStr = (input.submissionDate ?? new Date()).toLocaleString("en-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // 1. Send email to admin recipients
  if (adminEmails.length > 0) {
    try {
      await transporter.sendMail({
        from: getEmailFrom(),
        to: adminEmails,
        subject: `New Support Ticket: ${input.subject}`,
        html: supportTicketNotificationEmailHtml({
          ticketId: input.ticketId,
          name: input.name,
          email: input.email,
          subject: input.subject,
          message: input.message,
          submissionDate: submissionDateStr,
          userRegistered: Boolean(input.userId),
        }),
      });
    } catch (err) {
      console.error(
        "Failed to send support ticket email to admins:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // 2. Create in-app notifications for each admin user
  if (admins.length > 0) {
    try {
      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "SUPPORT_TICKET_CREATED",
          title: "New Support Ticket",
          body: `${input.name}: ${input.subject}`,
          link: "/admin?tab=support",
        })),
      });
    } catch (err) {
      console.error("Failed to create in-app notification for admins (support ticket):", err);
    }
  }
}

/**
 * Sends an email notification to admins and records in-app notifications
 * when a project dispute is escalated to ESCALATED_TO_ADMIN.
 */
export async function notifyAdminsDisputeEscalated(input: {
  disputeId: number;
  projectId: string;
  projectTitle: string;
  clientName?: string;
  clientEmail?: string;
  engineerName?: string;
  engineerEmail?: string;
  reason: string;
  amount?: string;
  escalatedAt?: Date;
}): Promise<void> {
  const [admins, adminEmails] = await Promise.all([
    getAdminUsers(),
    getAdminEmailRecipients(),
  ]);

  const escalatedAtStr = (input.escalatedAt ?? new Date()).toLocaleString("en-EG", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // 1. Send email to admin recipients
  if (adminEmails.length > 0) {
    try {
      await transporter.sendMail({
        from: getEmailFrom(),
        to: adminEmails,
        subject: `Dispute Escalated to Admin: ${input.projectTitle}`,
        html: disputeEscalatedNotificationEmailHtml({
          disputeId: input.disputeId,
          projectId: input.projectId,
          projectTitle: input.projectTitle,
          clientName: input.clientName,
          clientEmail: input.clientEmail,
          engineerName: input.engineerName,
          engineerEmail: input.engineerEmail,
          reason: input.reason,
          amount: input.amount,
          escalatedAt: escalatedAtStr,
        }),
      });
    } catch (err) {
      console.error(
        "Failed to send dispute escalation email to admins:",
        err instanceof Error ? err.message : err,
      );
    }
  }

  // 2. Create in-app notifications for each admin user
  if (admins.length > 0) {
    try {
      await db.notification.createMany({
        data: admins.map((admin) => ({
          userId: admin.id,
          type: "DISPUTE_ESCALATED",
          title: "Dispute Escalated to Admin",
          body: `Dispute for project "${input.projectTitle}" has been escalated to admin for review.`,
          link: "/admin?tab=disputes",
        })),
      });
    } catch (err) {
      console.error("Failed to create in-app notification for admins (dispute escalation):", err);
    }
  }
}

