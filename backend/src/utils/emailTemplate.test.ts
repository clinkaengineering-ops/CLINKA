import {
  supportTicketNotificationEmailHtml,
  disputeEscalatedNotificationEmailHtml,
  manualPaymentNotificationEmailHtml,
  withdrawalNotificationEmailHtml,
} from "./emailTemplate";

describe("Email Templates for Admin Notifications", () => {
  it("renders support ticket notification email with ticket details and CTA", () => {
    const html = supportTicketNotificationEmailHtml({
      ticketId: 789,
      name: "Tarek Smith",
      email: "tarek@example.com",
      subject: "Urgent Payment Inquiry",
      message: "My bank transfer reference is REF123456.",
      submissionDate: "15 Oct 2026, 18:00",
      userRegistered: true,
    });

    expect(html).toContain("New Support Ticket");
    expect(html).toContain("#789");
    expect(html).toContain("Tarek Smith");
    expect(html).toContain("tarek@example.com");
    expect(html).toContain("Urgent Payment Inquiry");
    expect(html).toContain("My bank transfer reference is REF123456.");
    expect(html).toContain("Registered Member");
    expect(html).toContain("View Support Tickets");
    expect(html).toContain("/admin?tab=support");
  });

  it("renders dispute escalated notification email with project details and CTA", () => {
    const html = disputeEscalatedNotificationEmailHtml({
      disputeId: 44,
      projectId: "proj-abc",
      projectTitle: "Commercial Mall HVAC Design",
      clientName: "Client Company Ltd",
      clientEmail: "client@example.com",
      engineerName: "Eng. Omar",
      engineerEmail: "omar@example.com",
      reason: "Revision requested 3 days ago with no response.",
      amount: "$2,800.00",
      escalatedAt: "15 Oct 2026, 18:30",
    });

    expect(html).toContain("Dispute Escalated to Admin");
    expect(html).toContain("Commercial Mall HVAC Design");
    expect(html).toContain("Client Company Ltd");
    expect(html).toContain("Eng. Omar");
    expect(html).toContain("Revision requested 3 days ago with no response.");
    expect(html).toContain("$2,800.00");
    expect(html).toContain("Review &amp; Resolve Dispute");
    expect(html).toContain("/admin?tab=disputes");
  });

  it("renders manual payment notification email with review link", () => {
    const html = manualPaymentNotificationEmailHtml({
      clientName: "Sara Client",
      clientEmail: "sara@example.com",
      projectTitle: "Landscape Architecture",
      amount: "USD 1200",
      method: "INSTAPAY",
      submissionDate: "15 Oct 2026, 19:00",
    });

    expect(html).toContain("New manual payment submitted");
    expect(html).toContain("Sara Client");
    expect(html).toContain("Landscape Architecture");
    expect(html).toContain("USD 1200");
    expect(html).toContain("INSTAPAY");
    expect(html).toContain("Review Payment Proof");
    expect(html).toContain("/admin/finance/payments");
  });

  it("renders withdrawal notification email with dashboard link", () => {
    const html = withdrawalNotificationEmailHtml({
      engineerName: "Kareem Engineer",
      engineerEmail: "kareem@example.com",
      amount: "$850.00",
      method: "E_WALLET",
      accountNumber: "01012345678",
      requestDate: "15 Oct 2026, 19:15",
    });

    expect(html).toContain("New withdrawal request");
    expect(html).toContain("Kareem Engineer");
    expect(html).toContain("$850.00");
    expect(html).toContain("E_WALLET");
    expect(html).toContain("01012345678");
    expect(html).toContain("View in Admin Dashboard");
    expect(html).toContain("/admin?tab=payouts");
  });
});

