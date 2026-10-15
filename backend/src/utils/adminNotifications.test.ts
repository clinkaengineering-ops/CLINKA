import {
  getAdminEmailRecipients,
  notifyAdminsSupportTicket,
  notifyAdminsDisputeEscalated,
} from "./adminNotifications";
import db from "../config/db";
import transporter from "../config/mailer";

jest.mock("../config/db", () => ({
  __esModule: true,
  default: {
    user: {
      findMany: jest.fn(),
    },
    notification: {
      createMany: jest.fn(),
    },
  },
}));

jest.mock("../config/mailer", () => ({
  __esModule: true,
  default: {
    sendMail: jest.fn().mockResolvedValue({ messageId: "mock-msg-id", accepted: ["admin@example.com"] }),
  },
}));

describe("adminNotifications utility", () => {
  const originalAdminEmail = process.env.ADMIN_EMAIL;

  beforeEach(() => {
    jest.clearAllMocks();
    delete process.env.ADMIN_EMAIL;
  });

  afterAll(() => {
    process.env.ADMIN_EMAIL = originalAdminEmail;
  });

  describe("getAdminEmailRecipients", () => {
    it("should return email addresses of all ADMIN users in the database", async () => {
      (db.user.findMany as jest.Mock).mockResolvedValue([
        { id: "admin-1", email: "admin1@example.com", name: "Admin One" },
        { id: "admin-2", email: "admin2@example.com", name: "Admin Two" },
      ]);

      const recipients = await getAdminEmailRecipients();
      expect(recipients).toEqual(["admin1@example.com", "admin2@example.com"]);
    });

    it("should include addresses from ADMIN_EMAIL env variable and deduplicate", async () => {
      process.env.ADMIN_EMAIL = "admin1@example.com, superadmin@example.com";
      (db.user.findMany as jest.Mock).mockResolvedValue([
        { id: "admin-1", email: "admin1@example.com", name: "Admin One" },
      ]);

      const recipients = await getAdminEmailRecipients();
      expect(recipients).toEqual(["admin1@example.com", "superadmin@example.com"]);
    });

    it("should filter out null or empty email addresses", async () => {
      (db.user.findMany as jest.Mock).mockResolvedValue([
        { id: "admin-1", email: null, name: "No Email" },
        { id: "admin-2", email: "   ", name: "Spaces" },
        { id: "admin-3", email: "valid@example.com", name: "Valid" },
      ]);

      const recipients = await getAdminEmailRecipients();
      expect(recipients).toEqual(["valid@example.com"]);
    });
  });

  describe("notifyAdminsSupportTicket", () => {
    it("should send an email to admins and create in-app notifications", async () => {
      (db.user.findMany as jest.Mock).mockResolvedValue([
        { id: "admin-1", email: "admin@example.com", name: "Admin" },
      ]);
      (db.notification.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      await notifyAdminsSupportTicket({
        ticketId: 101,
        name: "John Doe",
        email: "john@example.com",
        subject: "Login issue",
        message: "Cannot access my account after password reset",
      });

      expect(transporter.sendMail).toHaveBeenCalledTimes(1);
      const mailCall = (transporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(mailCall.to).toEqual(["admin@example.com"]);
      expect(mailCall.subject).toBe("New Support Ticket: Login issue");
      expect(mailCall.html).toContain("John Doe");
      expect(mailCall.html).toContain("john@example.com");
      expect(mailCall.html).toContain("Cannot access my account after password reset");
      expect(mailCall.html).toContain("/admin?tab=support");

      expect(db.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: "admin-1",
            type: "SUPPORT_TICKET_CREATED",
            title: "New Support Ticket",
            body: "John Doe: Login issue",
            link: "/admin?tab=support",
          },
        ],
      });
    });
  });

  describe("notifyAdminsDisputeEscalated", () => {
    it("should send an escalation email to admins and record in-app notifications", async () => {
      (db.user.findMany as jest.Mock).mockResolvedValue([
        { id: "admin-1", email: "admin@example.com", name: "Admin" },
      ]);
      (db.notification.createMany as jest.Mock).mockResolvedValue({ count: 1 });

      await notifyAdminsDisputeEscalated({
        disputeId: 42,
        projectId: "proj-123",
        projectTitle: "Villa Structural Blueprint",
        clientName: "Alice Client",
        clientEmail: "alice@example.com",
        engineerName: "Bob Engineer",
        engineerEmail: "bob@example.com",
        reason: "Deliverables missing foundation calculations",
        amount: "$1,500.00",
      });

      expect(transporter.sendMail).toHaveBeenCalledTimes(1);
      const mailCall = (transporter.sendMail as jest.Mock).mock.calls[0][0];
      expect(mailCall.to).toEqual(["admin@example.com"]);
      expect(mailCall.subject).toBe("Dispute Escalated to Admin: Villa Structural Blueprint");
      expect(mailCall.html).toContain("Villa Structural Blueprint");
      expect(mailCall.html).toContain("Alice Client");
      expect(mailCall.html).toContain("Bob Engineer");
      expect(mailCall.html).toContain("Deliverables missing foundation calculations");
      expect(mailCall.html).toContain("$1,500.00");
      expect(mailCall.html).toContain("/admin?tab=disputes");

      expect(db.notification.createMany).toHaveBeenCalledWith({
        data: [
          {
            userId: "admin-1",
            type: "DISPUTE_ESCALATED",
            title: "Dispute Escalated to Admin",
            body: 'Dispute for project "Villa Structural Blueprint" has been escalated to admin for review.',
            link: "/admin?tab=disputes",
          },
        ],
      });
    });
  });
});

