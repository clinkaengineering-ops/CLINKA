import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import { recordPaymentLedger, netEngineerAmount } from "../../utils/paymentLedger";
import { ensureWallet, walletHoldReleaseDate } from "../../utils/wallet";
import { createNotification } from "../../utils/notifications";
import { logSystemEvent } from "../../utils/auditLogger";
import transporter from "../../config/mailer";
import { getEmailFrom, manualPaymentNotificationEmailHtml } from "../../utils/emailTemplate";
import { getAdminEmailRecipients } from "../../utils/adminNotifications";

function toNumber(value: number | { toString(): string }) {
  return typeof value === "number" ? value : Number(value.toString());
}

// ─── Client: Submit manual payment proof ───────────────────────────────────

export interface SubmitManualPaymentInput {
  paymentMethod: string;
  transactionReference: string;
  amount: number;
  currency?: string;
  note?: string;

  // Proof file metadata (populated from uploaded file)
  proofUrl?: string;
  proofOriginalName?: string;
  proofMimeType?: string;
  proofFileSize?: number;

  // Selected destination account ID
  destinationAccountId?: string;

  // Receiving destination snapshot
  receivingMethod?: string;
  receivingCountry?: string;
  receivingAccountName?: string;
  receivingBankName?: string;
  receivingAccountNumber?: string;
  receivingIban?: string;
  receivingSwift?: string;
  receivingCurrency?: string;
  receivingWalletProvider?: string;
  receivingWalletNumber?: string;
  receivingInstapayAccount?: string;
}

export interface DestinationSnapshot {
  receivingMethod: string;
  receivingCountry?: string | null;
  receivingAccountName?: string | null;
  receivingBankName?: string | null;
  receivingAccountNumber?: string | null;
  receivingIban?: string | null;
  receivingSwift?: string | null;
  receivingCurrency?: string | null;
  receivingWalletProvider?: string | null;
  receivingWalletNumber?: string | null;
  receivingInstapayAccount?: string | null;
}

export function resolveDestinationSnapshot(
  rawSettings: any,
  method: string,
  destinationAccountId?: string,
  fallbackInput?: Partial<SubmitManualPaymentInput>,
): DestinationSnapshot {
  let matchedAccount: any = null;

  if (method === "bank_transfer") {
    const accounts: any[] = Array.isArray(rawSettings?.bankAccounts)
      ? rawSettings.bankAccounts.filter((a: any) => a.enabled !== false)
      : [];
    if (
      accounts.length === 0 &&
      rawSettings?.bankTransfer &&
      (rawSettings.bankTransfer.bankName ||
        rawSettings.bankTransfer.iban ||
        rawSettings.bankTransfer.accountNumber)
    ) {
      accounts.push({
        id: "legacy-bank",
        country: rawSettings.bankTransfer.country || "EG",
        bankName: rawSettings.bankTransfer.bankName || "",
        accountHolder: rawSettings.bankTransfer.accountHolder || "",
        accountNumber: rawSettings.bankTransfer.accountNumber || "",
        iban: rawSettings.bankTransfer.iban || "",
        swift: rawSettings.bankTransfer.swift || "",
        currency: rawSettings.bankTransfer.currency || "EGP",
        enabled: true,
      });
    }

    if (destinationAccountId) {
      matchedAccount = accounts.find((a) => a.id === destinationAccountId);
      if (!matchedAccount) {
        throw new ApiError(400, "The selected bank account is invalid or disabled");
      }
    } else if (fallbackInput?.receivingIban || fallbackInput?.receivingAccountNumber) {
      matchedAccount = accounts.find(
        (a) =>
          (fallbackInput.receivingIban && a.iban === fallbackInput.receivingIban) ||
          (fallbackInput.receivingAccountNumber &&
            a.accountNumber === fallbackInput.receivingAccountNumber),
      );
    }
    if (!matchedAccount && accounts.length === 1) {
      matchedAccount = accounts[0];
    }

    if (matchedAccount) {
      return {
        receivingMethod: "bank_transfer",
        receivingCountry: matchedAccount.country || null,
        receivingAccountName: matchedAccount.accountHolder || null,
        receivingBankName: matchedAccount.bankName || null,
        receivingAccountNumber: matchedAccount.accountNumber || null,
        receivingIban: matchedAccount.iban || null,
        receivingSwift: matchedAccount.swift || null,
        receivingCurrency: matchedAccount.currency || null,
      };
    }
  } else if (method === "instapay") {
    const accounts: any[] = Array.isArray(rawSettings?.instapayAccounts)
      ? rawSettings.instapayAccounts.filter((a: any) => a.enabled !== false)
      : [];
    if (accounts.length === 0 && rawSettings?.instapay?.account) {
      accounts.push({
        id: "legacy-instapay",
        account: rawSettings.instapay.account,
        accountHolder: rawSettings.instapay.accountHolder || "",
        enabled: true,
      });
    }

    if (destinationAccountId) {
      matchedAccount = accounts.find((a) => a.id === destinationAccountId);
      if (!matchedAccount) {
        throw new ApiError(400, "The selected InstaPay account is invalid or disabled");
      }
    } else if (fallbackInput?.receivingInstapayAccount) {
      matchedAccount = accounts.find(
        (a) => a.account === fallbackInput.receivingInstapayAccount,
      );
    }
    if (!matchedAccount && accounts.length === 1) {
      matchedAccount = accounts[0];
    }

    if (matchedAccount) {
      return {
        receivingMethod: "instapay",
        receivingAccountName: matchedAccount.accountHolder || null,
        receivingInstapayAccount: matchedAccount.account || null,
      };
    }
  } else if (method === "ewallet") {
    const accounts: any[] = Array.isArray(rawSettings?.walletAccounts)
      ? rawSettings.walletAccounts.filter((a: any) => a.enabled !== false)
      : [];
    if (accounts.length === 0 && rawSettings?.mobileWallet?.number) {
      accounts.push({
        id: "legacy-wallet",
        provider: rawSettings.mobileWallet.provider || "",
        number: rawSettings.mobileWallet.number || "",
        accountHolder: rawSettings.mobileWallet.accountHolder || "",
        enabled: true,
      });
    }

    if (destinationAccountId) {
      matchedAccount = accounts.find((a) => a.id === destinationAccountId);
      if (!matchedAccount) {
        throw new ApiError(400, "The selected wallet is invalid or disabled");
      }
    } else if (fallbackInput?.receivingWalletNumber) {
      matchedAccount = accounts.find(
        (a) => a.number === fallbackInput.receivingWalletNumber,
      );
    }
    if (!matchedAccount && accounts.length === 1) {
      matchedAccount = accounts[0];
    }

    if (matchedAccount) {
      return {
        receivingMethod: "ewallet",
        receivingAccountName: matchedAccount.accountHolder || null,
        receivingWalletProvider: matchedAccount.provider || null,
        receivingWalletNumber: matchedAccount.number || null,
      };
    }
  }

  return {
    receivingMethod: method,
    receivingCountry: fallbackInput?.receivingCountry || null,
    receivingAccountName: fallbackInput?.receivingAccountName || null,
    receivingBankName: fallbackInput?.receivingBankName || null,
    receivingAccountNumber: fallbackInput?.receivingAccountNumber || null,
    receivingIban: fallbackInput?.receivingIban || null,
    receivingSwift: fallbackInput?.receivingSwift || null,
    receivingCurrency: fallbackInput?.receivingCurrency || null,
    receivingWalletProvider: fallbackInput?.receivingWalletProvider || null,
    receivingWalletNumber: fallbackInput?.receivingWalletNumber || null,
    receivingInstapayAccount: fallbackInput?.receivingInstapayAccount || null,
  };
}

export async function submitManualPayment(
  clientId: string,
  projectId: string,
  input: SubmitManualPaymentInput,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { payment: true, client: true },
  });
  if (!project) throw new ApiError(404, "Project not found");
  if (project.clientId !== clientId) {
    throw new ApiError(403, "Only the project owner can submit payment");
  }
  if (project.status !== "IN_PROGRESS" && project.status !== "AWAITING_PAYMENT") {
    throw new ApiError(
      400,
      "Escrow payment is only available for in-progress projects",
    );
  }

  const payment = project.payment;
  if (!payment) {
    throw new ApiError(400, "No payment record exists for this project. Start checkout first.");
  }
  if (payment.status === "FUNDED") {
    throw new ApiError(400, "Payment is already funded");
  }
  if (payment.status === "RELEASED") {
    throw new ApiError(400, "Payment has already been released");
  }
  if (payment.status === "REFUNDED") {
    throw new ApiError(400, "Payment has already been refunded");
  }

  // Validate payment method is enabled in platform settings
  const settings = await db.platformSettings.findFirst();
  const rawSettings = (settings?.manualPaymentSettings as any) ?? {};

  const isMethodEnabled =
    input.paymentMethod === "bank_transfer"
      ? rawSettings?.bankTransfer?.enabled !== false
      : input.paymentMethod === "instapay"
      ? rawSettings?.instapay?.enabled !== false
      : input.paymentMethod === "ewallet"
      ? rawSettings?.mobileWallet?.enabled !== false
      : false;

  if (!isMethodEnabled) {
    throw new ApiError(400, `Payment method '${input.paymentMethod}' is currently disabled`);
  }

  // Validate amount exactly matches expected payment amount
  if (input.currency === "EGP") {
    if (Math.abs(Number(input.amount) - Number(payment.amountEgp)) > 0.01) {
      throw new ApiError(400, `Submitted EGP amount (${input.amount}) must exactly match the required payment amount (${payment.amountEgp})`);
    }
  } else if (input.currency === "USD") {
    if (Math.abs(Number(input.amount) - Number(payment.amountUsd)) > 0.01) {
      throw new ApiError(400, `Submitted USD amount (${input.amount}) must exactly match the required payment amount (${payment.amountUsd})`);
    }
  } else {
    throw new ApiError(400, "Unsupported currency");
  }

  // Require proof upload
  if (!input.proofUrl) {
    throw new ApiError(400, "Payment proof screenshot is required.");
  }

  const destinationSnapshot = resolveDestinationSnapshot(
    rawSettings,
    input.paymentMethod,
    input.destinationAccountId,
    input,
  );

  const submission = await db.$transaction(async (tx) => {
    // Check if there is already a PENDING submission for this payment
    const existingPending = await tx.manualPaymentSubmission.findFirst({
      where: { paymentId: payment.id, status: "PENDING" },
    });
    if (existingPending) {
      throw new ApiError(400, "You already have a pending payment submission. Wait for admin review.");
    }

    try {
      return await tx.manualPaymentSubmission.create({
        data: {
          paymentId: payment.id,
          paymentMethod: input.paymentMethod,
          transactionReference: input.transactionReference,
          amount: input.amount,
          currency: input.currency ?? "EGP",
          receiptUrl: input.proofUrl ?? null, // backward compat
          note: input.note ?? null,
          status: "PENDING",

          // Proof metadata
          proofUrl: input.proofUrl ?? null,
          proofOriginalName: input.proofOriginalName ?? null,
          proofMimeType: input.proofMimeType ?? null,
          proofFileSize: input.proofFileSize ?? null,

          // Receiving destination snapshot (resolved from settings)
          ...destinationSnapshot,
        },
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        throw new ApiError(
          409,
          "A submission with this transaction reference already exists. Please check your reference number.",
        );
      }
      throw err;
    }
  });

  // Notify admins
  const [admins, adminEmails] = await Promise.all([
    db.user.findMany({
      where: { role: "ADMIN" },
      select: { id: true, email: true },
    }),
    getAdminEmailRecipients(),
  ]);
  
  if (adminEmails.length > 0) {
    try {
      await transporter.sendMail({
        from: getEmailFrom(),
        to: adminEmails,
        subject: `New Manual Payment - ${input.currency} ${input.amount}`,
        html: manualPaymentNotificationEmailHtml({
          clientName: project.client.name,
          clientEmail: project.client.email,
          projectTitle: project.title,
          amount: `${input.currency} ${input.amount}`,
          method: input.paymentMethod,
          submissionDate: new Date().toLocaleString("en-EG", {
            dateStyle: "medium",
            timeStyle: "short",
          }),
        }),
      });
    } catch (err) {
      console.error("Failed to send manual payment notification email", err);
    }
  }

  for (const admin of admins) {
    await createNotification(
      admin.id,
      "PAYMENT_RECEIVED",
      "New Manual Payment Submission",
      `Client submitted manual payment for project "${project.title}" — ${input.paymentMethod}: ${input.transactionReference}`,
      `/admin?tab=payments`,
    );
  }

  return submission;
}

// ─── Client: Get my submissions for a project ──────────────────────────────

export async function getManualPaymentSubmissions(
  clientId: string,
  projectId: string,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { payment: true },
  });
  if (!project) throw new ApiError(404, "Project not found");
  if (project.clientId !== clientId) {
    throw new ApiError(403, "Not authorized");
  }
  if (!project.payment) return [];

  return db.manualPaymentSubmission.findMany({
    where: { paymentId: project.payment.id },
    orderBy: { createdAt: "desc" },
  });
}

// ─── Admin: List manual payments (with filters & pagination) ───────────────────

export async function listAdminManualPayments(
  page = 1,
  limit = 20,
  status?: string,
  method?: string,
  search?: string,
  currency?: string,
  country?: string,
) {
  const skip = (page - 1) * limit;

  const where: any = {};
  if (status && status !== "ALL") {
    where.status = status;
  }
  if (method && method !== "ALL") {
    where.paymentMethod = method;
  }
  if (currency && currency !== "ALL") {
    where.currency = currency;
  }
  if (country && country !== "ALL") {
    where.receivingCountry = country;
  }
  if (search) {
    where.OR = [
      { transactionReference: { contains: search, mode: "insensitive" } },
      { payment: { project: { title: { contains: search, mode: "insensitive" } } } },
      { payment: { client: { name: { contains: search, mode: "insensitive" } } } },
      { payment: { engineer: { user: { name: { contains: search, mode: "insensitive" } } } } },
    ];
  }

  const [total, items] = await Promise.all([
    db.manualPaymentSubmission.count({ where }),
    db.manualPaymentSubmission.findMany({
      where,
      include: {
        payment: {
          include: {
            project: { select: { id: true, title: true, status: true, budget: true } },
            client: { select: { id: true, name: true, email: true } },
            engineer: {
              select: {
                id: true,
                user: { select: { id: true, name: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
  ]);

  return { total, items, page, limit, totalPages: Math.ceil(total / limit) };
}

// ─── Admin: Get Single Manual Payment Detailed View ────────────────────────

export async function getAdminManualPaymentDetails(submissionId: number) {
  const submission = await db.manualPaymentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      payment: {
        include: {
          project: true,
          client: true,
          engineer: { include: { user: true } },
          manualSubmissions: {
            orderBy: { createdAt: 'desc' }
          }
        },
      },
    },
  });

  if (!submission) throw new ApiError(404, "Submission not found");
  return submission;
}

// ─── Admin: Verify manual payment (atomically) ─────────────────────────────

export async function adminVerifyManualPayment(
  submissionId: number,
  adminUserId: string,
  adminNote?: string,
) {
  // Execute the entire verification sequence in a single database transaction
  const verificationResult = await db.$transaction(async (tx) => {
    // 1. Fetch the submission under transaction isolation
    const submission = await tx.manualPaymentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        payment: {
          include: {
            project: true,
            engineer: {
              include: { user: { select: { id: true, name: true } } },
            },
          },
        },
      },
    });

    if (!submission) {
      throw new ApiError(404, "Submission not found");
    }

    const payment = submission.payment;

    // 2. IDEMPOTENT CHECK: If already verified and payment is funded, return cleanly
    if (submission.status === "VERIFIED" && payment.status === "FUNDED") {
      return { submission, alreadyProcessed: true };
    }

    // 3. State validation
    if (submission.status !== "PENDING") {
      throw new ApiError(
        400,
        `Submission is no longer pending (already ${submission.status.toLowerCase()})`,
      );
    }

    const paymentStatus = payment.status ?? "PENDING";
    if (paymentStatus !== "PENDING") {
      throw new ApiError(
        409,
        `Payment cannot be funded because current status is ${paymentStatus}`,
      );
    }

    // 4. Lock the parent Payment row via pessimistic locking (FOR UPDATE) to serialize concurrent operations
    if (typeof tx.$executeRaw === "function") {
      await tx.$executeRaw`SELECT id FROM "Payment" WHERE id = ${payment.id} FOR UPDATE`;
    }

    // 5. Conditionally update Payment to FUNDED first
    const updatePaymentResult = await tx.payment.updateMany({
      where: { id: payment.id, status: "PENDING" },
      data: { status: "FUNDED", provider: "MANUAL" },
    });

    if (updatePaymentResult.count === 0) {
      throw new ApiError(409, "Conflict: payment was funded or modified concurrently");
    }

    // 6. Conditionally update Submission to VERIFIED
    const updateSubResult = await tx.manualPaymentSubmission.updateMany({
      where: { id: submissionId, status: "PENDING" },
      data: {
        status: "VERIFIED",
        verifiedBy: adminUserId,
        verifiedAt: new Date(),
        adminNote: adminNote ?? null,
      },
    });

    if (updateSubResult && updateSubResult.count === 0) {
      throw new ApiError(409, "Conflict: submission was modified concurrently");
    }

    // 7. Prevent duplicate ledger entries
    const existingFunded = await tx.paymentLedgerEntry.findFirst({
      where: { paymentId: payment.id, type: "FUNDED" },
      select: { id: true },
    });

    if (!existingFunded) {
      const amountUsd = toNumber(payment.amountUsd);
      const commission = toNumber(payment.commission);
      const netAmount = netEngineerAmount(amountUsd, commission);

      await recordPaymentLedger(tx, payment.id, [
        {
          type: "FUNDED",
          amount: amountUsd,
          note: "Client escrow payment received via manual payment",
        },
        {
          type: "ENGINEER_ESCROW",
          amount: netAmount,
          note: "Engineer share held in escrow",
        },
        {
          type: "PLATFORM_COMMISSION",
          amount: commission,
          note: "Platform commission on funded payment",
        },
      ]);
    }

    // 8. Transition project to IN_PROGRESS once payment is funded
    if (payment.project.status !== "IN_PROGRESS") {
      await tx.project.update({
        where: { id: payment.projectId },
        data: { status: "IN_PROGRESS" },
      });
      payment.project.status = "IN_PROGRESS";
    }

    // 9. Auto-reject any other pending submissions for this payment to prevent lingering rows
    await tx.manualPaymentSubmission.updateMany({
      where: {
        paymentId: payment.id,
        id: { not: submissionId },
        status: "PENDING",
      },
      data: {
        status: "REJECTED",
        verifiedBy: adminUserId,
        verifiedAt: new Date(),
        adminNote: `Superseded by verified submission #${submissionId}`,
      },
    });

    submission.status = "VERIFIED";
    submission.verifiedBy = adminUserId;
    submission.verifiedAt = new Date();
    submission.adminNote = adminNote ?? null;
    payment.status = "FUNDED";
    payment.provider = "MANUAL";

    return { submission, alreadyProcessed: false };
  });

  // Post-commit side effects: notifications and system audit log (outside transaction)
  if (!verificationResult.alreadyProcessed) {
    const payment = verificationResult.submission.payment;

    await Promise.allSettled([
      createNotification(
        payment.clientId,
        "PAYMENT_RECEIVED",
        "Payment Verified",
        `Your manual payment for "${payment.project.title}" has been verified. The project escrow is now funded.`,
        `/projects?id=${payment.projectId}`,
      ),
      createNotification(
        payment.engineer.user.id,
        "ESCROW_FUNDED",
        "Escrow Funded",
        `Escrow for "${payment.project.title}" has been funded. You can now start working.`,
        `/projects?id=${payment.projectId}`,
      ),
      logSystemEvent({
        actorId: adminUserId,
        actorRole: "ADMIN",
        action: "admin.manual_payment_verified",
        targetType: "ManualPaymentSubmission",
        targetId: String(submissionId),
        beforeState: { status: "PENDING" },
        afterState: { status: "VERIFIED", adminNote },
      }),
    ]);
  }

  return verificationResult.submission;
}

// ─── Admin: Reject manual payment ───────────────────────────────────────────

export async function adminRejectManualPayment(
  submissionId: number,
  adminUserId: string,
  reason?: string,
) {
  const existing = await db.manualPaymentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      payment: {
        include: { project: { select: { id: true, title: true, clientId: true } } },
      },
    },
  });

  if (!existing) throw new ApiError(404, "Submission not found");

  // Idempotency: if already rejected, return cleanly
  if (existing.status === "REJECTED") {
    return existing;
  }

  if (existing.status !== "PENDING") {
    throw new ApiError(
      400,
      `Submission is no longer pending (already ${existing.status.toLowerCase()})`,
    );
  }

  const updateResult = await db.manualPaymentSubmission.updateMany({
    where: { id: submissionId, status: "PENDING" },
    data: {
      status: "REJECTED",
      verifiedBy: adminUserId,
      verifiedAt: new Date(),
      adminNote: reason ?? null,
    },
  });

  if (updateResult.count === 0) {
    throw new ApiError(409, "Conflict: submission was modified or rejected concurrently");
  }

  const submission = await db.manualPaymentSubmission.findUnique({
    where: { id: submissionId },
    include: {
      payment: {
        include: { project: { select: { id: true, title: true, clientId: true } } },
      },
    },
  });

  if (submission) {
    const isAlreadyFunded = submission.payment.status === "FUNDED" || submission.payment.status === "RELEASED";
    const notificationMessage = isAlreadyFunded
      ? `Your manual payment submission for "${submission.payment.project.title}" was reviewed and closed.${reason ? ` Reason: ${reason}` : ""}`
      : `Your manual payment for "${submission.payment.project.title}" was rejected.${reason ? ` Reason: ${reason}` : ""} Please resubmit.`;

    await createNotification(
      submission.payment.project.clientId,
      "PAYMENT_RECEIVED",
      "Payment Rejected",
      notificationMessage,
      `/projects?id=${submission.payment.projectId}`,
    );
  }

  await logSystemEvent({
    actorId: adminUserId,
    actorRole: "ADMIN",
    action: "admin.manual_payment_rejected",
    targetType: "ManualPaymentSubmission",
    targetId: String(submissionId),
    beforeState: { status: "PENDING" },
    afterState: { status: "REJECTED", adminNote: reason },
  });

  return submission;
}

// ─── Client: Fetch manual payment settings (configured destinations) ───────

export async function getManualPaymentSettingsForClient(userId: string) {
  // Ensure the user actually has a project awaiting payment or in progress
  const pendingProject = await db.project.findFirst({
    where: {
      clientId: userId,
      OR: [
        { payment: { status: "PENDING" } },
        { status: { in: ["AWAITING_PAYMENT", "IN_PROGRESS"] } },
      ],
    },
  });
  if (!pendingProject) {
    throw new ApiError(403, "You do not have any pending payments");
  }

  const settings = await db.platformSettings.findFirst();
  if (!settings || !settings.manualPaymentSettings) {
    return { bankAccounts: [], instapayAccounts: [], walletAccounts: [] };
  }

  const raw = settings.manualPaymentSettings as any;

  // Build structured lists from the settings JSON
  const bankAccounts: any[] = [];
  const instapayAccounts: any[] = [];
  const walletAccounts: any[] = [];

  // Support both legacy single-account format and new multi-account arrays
  if (raw.bankTransfer?.enabled !== false) {
    if (Array.isArray(raw.bankAccounts)) {
      bankAccounts.push(
        ...raw.bankAccounts.filter((a: any) => a.enabled !== false),
      );
    } else if (raw.bankTransfer && (raw.bankTransfer.bankName || raw.bankTransfer.iban || raw.bankTransfer.accountNumber)) {
      // Legacy single-account format
      bankAccounts.push({
        id: "legacy-bank",
        country: raw.bankTransfer.country || "EG",
        bankName: raw.bankTransfer.bankName || "",
        accountHolder: raw.bankTransfer.accountHolder || "",
        accountNumber: raw.bankTransfer.accountNumber || "",
        iban: raw.bankTransfer.iban || "",
        swift: raw.bankTransfer.swift || "",
        currency: raw.bankTransfer.currency || "EGP",
        enabled: true,
      });
    }
  }

  if (raw.instapay?.enabled !== false) {
    if (Array.isArray(raw.instapayAccounts)) {
      instapayAccounts.push(
        ...raw.instapayAccounts.filter((a: any) => a.enabled !== false),
      );
    } else if (raw.instapay?.account) {
      instapayAccounts.push({
        id: "legacy-instapay",
        account: raw.instapay.account,
        accountHolder: raw.instapay.accountHolder || "",
        enabled: true,
      });
    }
  }

  if (raw.mobileWallet?.enabled !== false) {
    if (Array.isArray(raw.walletAccounts)) {
      walletAccounts.push(
        ...raw.walletAccounts.filter((a: any) => a.enabled !== false),
      );
    } else if (raw.mobileWallet?.number) {
      walletAccounts.push({
        id: "legacy-wallet",
        provider: raw.mobileWallet.provider || "",
        number: raw.mobileWallet.number || "",
        accountHolder: raw.mobileWallet.accountHolder || "",
        enabled: true,
      });
    }
  }

  return {
    bankAccounts,
    instapayAccounts,
    walletAccounts,
    processingNotice: raw.processingNotice || null,
  };
}
