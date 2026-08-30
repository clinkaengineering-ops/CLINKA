import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import { recordPaymentLedger, netEngineerAmount } from "../../utils/paymentLedger";
import { ensureWallet, walletHoldReleaseDate } from "../../utils/wallet";
import { createNotification } from "../../utils/notifications";

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

export async function submitManualPayment(
  clientId: number,
  projectId: number,
  input: SubmitManualPaymentInput,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { payment: true },
  });
  if (!project) throw new ApiError(404, "Project not found");
  if (project.clientId !== clientId) {
    throw new ApiError(403, "Only the project owner can submit payment");
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

  // Check if there is already a PENDING submission for this payment
  const existingPending = await db.manualPaymentSubmission.findFirst({
    where: { paymentId: payment.id, status: "PENDING" },
  });
  if (existingPending) {
    throw new ApiError(400, "You already have a pending payment submission. Wait for admin review.");
  }

  // Require proof upload
  if (!input.proofUrl) {
    throw new ApiError(400, "Payment proof screenshot is required.");
  }

  const submission = await db.manualPaymentSubmission.create({
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

      // Receiving destination snapshot
      receivingMethod: input.receivingMethod ?? input.paymentMethod,
      receivingCountry: input.receivingCountry ?? null,
      receivingAccountName: input.receivingAccountName ?? null,
      receivingBankName: input.receivingBankName ?? null,
      receivingAccountNumber: input.receivingAccountNumber ?? null,
      receivingIban: input.receivingIban ?? null,
      receivingSwift: input.receivingSwift ?? null,
      receivingCurrency: input.receivingCurrency ?? null,
      receivingWalletProvider: input.receivingWalletProvider ?? null,
      receivingWalletNumber: input.receivingWalletNumber ?? null,
      receivingInstapayAccount: input.receivingInstapayAccount ?? null,
    },
  });

  // Notify admins
  const admins = await db.user.findMany({
    where: { role: "ADMIN" },
    select: { id: true },
  });
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
  clientId: number,
  projectId: number,
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
  adminUserId: number,
  adminNote?: string,
) {
  // Atomic conditional update — prevents race conditions
  const updateResult = await db.manualPaymentSubmission.updateMany({
    where: { id: submissionId, status: "PENDING" },
    data: {
      status: "VERIFIED",
      verifiedBy: adminUserId,
      verifiedAt: new Date(),
      adminNote: adminNote ?? null,
    },
  });

  if (updateResult.count === 0) {
    throw new ApiError(400, "Submission is no longer pending (already verified or rejected)");
  }

  // Fetch the full submission with payment details
  const submission = await db.manualPaymentSubmission.findUnique({
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
  if (!submission) throw new ApiError(404, "Submission not found");

  const payment = submission.payment;

  // Fund the payment using the existing financial system
  await db.$transaction(async (tx) => {
    // Update payment to FUNDED
    await tx.payment.update({
      where: { id: payment.id },
      data: { status: "FUNDED", provider: "MANUAL" },
    });

    // Record ledger entries (same as Paymob flow)
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

  });

  // Notify client
  await createNotification(
    payment.clientId,
    "PAYMENT_RECEIVED",
    "Payment Verified",
    `Your manual payment for "${payment.project.title}" has been verified. The project escrow is now funded.`,
    `/projects?id=${payment.projectId}`,
  );

  // Notify engineer
  await createNotification(
    payment.engineer.user.id,
    "ESCROW_FUNDED",
    "Escrow Funded",
    `Escrow for "${payment.project.title}" has been funded. You can now start working.`,
    `/projects?id=${payment.projectId}`,
  );

  return submission;
}

// ─── Admin: Reject manual payment ───────────────────────────────────────────

export async function adminRejectManualPayment(
  submissionId: number,
  adminUserId: number,
  reason?: string,
) {
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
    throw new ApiError(400, "Submission is no longer pending (already verified or rejected)");
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
    await createNotification(
      submission.payment.project.clientId,
      "PAYMENT_RECEIVED",
      "Payment Rejected",
      `Your manual payment for "${submission.payment.project.title}" was rejected.${reason ? ` Reason: ${reason}` : ""} Please resubmit.`,
      `/projects?id=${submission.payment.projectId}`,
    );
  }

  return submission;
}

// ─── Client: Fetch manual payment settings (configured destinations) ───────

export async function getManualPaymentSettingsForClient() {
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
