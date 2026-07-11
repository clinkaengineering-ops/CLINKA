import db from "../../config/db";
import { sanitizeWithdrawalForEngineer } from "../payouts/payout.presenter";
import { BALANCE_HELD_STATUSES } from "../payouts/payout.state";
import { getClientUrl } from "../../config/clientUrl";
import {
  buildPaymobCheckoutUrl,
  getPaymobConfig,
  getPaymobPayoutConfig,
  isPaymobPayoutConfigured,
} from "../../config/paymob";

import ApiError from "../../utils/ApiError";
import {
  createPaymobIntention,
  listConfiguredPaymobMethods,
} from "./paymob.api";
import {
  fetchPaymobTransactionById,
  inquirePaymobTransactionByMerchantOrderId,
  inquirePaymobTransactionByOrderId,
  validatePaymobTransactionForPayment,
} from "./paymob.inquiry";
import {
  parsePaymobSpecialReference,
  verifyPaymobTransactionHmac,
  type PaymobTransactionObject,
} from "./paymob.webhook";
import {
  collectGatewayIds,
  parseCheckoutReturnQuery,
} from "./checkoutReturnQuery";
import {
  getLegacyReservedWithdrawalAmount,
} from "../payouts/payout.service";
import {
  // CreateWithdrawalRequestInput, // OLD_WITHDRAWAL: commented out for auto-withdrawal
  AutoWithdrawalInput,
  InitiateCheckoutInput,
  paymobWebhookSchema,
  type VerifyCheckoutReturnInput,
} from "./payments.validation";
import {
  netEngineerAmount,
  recordPaymentLedger,
} from "../../utils/paymentLedger";
import { isReviewableStatus } from "../projects/project.status";
import transporter from "../../config/mailer";
import {
  getEmailFrom,
  withdrawalNotificationEmailHtml,
} from "../../utils/emailTemplate";
import {
  ensureWallet,
  settleMaturedWalletTransactions,
  walletHoldReleaseDate,
} from "../../utils/wallet";
function toNumber(value: number | { toString(): string }) {
  return typeof value === "number" ? value : Number(value.toString());
}
function amountToCents(amount: number) {
  return Math.round(amount * 100);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const CHECKOUT_VERIFY_POLL_ATTEMPTS = 6;
const CHECKOUT_VERIFY_POLL_INTERVAL_MS = 1500;

function paymobPaymentReferenceBase(paymentId: number) {
  return `clinka-payment-${paymentId}`;
}

function paymobCheckoutSpecialReference(paymentId: number) {
  // Unique per checkout attempt — Paymob rejects duplicate merchant references.
  return `${paymobPaymentReferenceBase(paymentId)}-${Date.now()}`;
}

async function createProjectPaymobIntention(
  project: {
    id: number;
    title: string;
    client: { name: string; email: string };
  },
  payment: { id: number },
  totalCharged: number,
  phone: string,
  address: string,
  paymentMethodIds?: number[],
) {
  const config = getPaymobConfig();
  const { first_name, last_name } = splitCustomerName(project.client.name);
  const redirectionUrls = getRedirectionUrls(project.id, payment.id);
  const amountCents = amountToCents(totalCharged);

  const intention = await createPaymobIntention({
    amountCents,
    currency: config.currency,
    paymentMethods: paymentMethodIds?.length
      ? paymentMethodIds
      : config.integrationIds,
    items: [
      {
        name: project.title.slice(0, 100),
        amount: amountCents,
        quantity: 1,
        description: `Escrow funding for project #${project.id}`,
      },
    ],
    billingData: {
      first_name,
      last_name,
      email: project.client.email,
      phone_number: phone,
      street: address,
    },
    specialReference: paymobCheckoutSpecialReference(payment.id),
    notificationUrl: redirectionUrls.webhookUrl,
    redirectionUrl: redirectionUrls.successUrl,
    extras: {
      projectId: project.id,
      paymentId: payment.id,
    },
  });

  return {
    intention,
    checkoutUrl: buildPaymobCheckoutUrl(config, intention.clientSecret),
  };
}

function splitCustomerName(fullName: string): {
  first_name: string;
  last_name: string;
} {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { first_name: parts[0], last_name: parts[0] };
  }
  return {
    first_name: parts[0],
    last_name: parts.slice(1).join(" "),
  };
}

function getRedirectionUrls(projectId: number, paymentId: number) {
  const clientUrl = getClientUrl();
  const apiUrl = (
    process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 5000}`
  ).replace(/\/$/, "");

  return {
    successUrl: `${clientUrl}/checkout?projectId=${projectId}&paymentId=${paymentId}&status=success`,
    failUrl: `${clientUrl}/checkout?projectId=${projectId}&paymentId=${paymentId}&status=fail`,
    pendingUrl: `${clientUrl}/checkout?projectId=${projectId}&paymentId=${paymentId}&status=pending`,
    webhookUrl: `${apiUrl}/api/payments/webhook/paymob`,
  };
}

function formatEgp(amount: number) {
  return `${Math.round(amount * 100) / 100} EGP`;
}

/* OLD_WITHDRAWAL_START — Manual withdrawal email notification (commented out for auto-withdrawal via Paymob)
async function sendWithdrawalRequestEmailToAdmins(input: {
  engineerName: string;
  engineerEmail: string;
  amount: number;
  method: string;
  accountNumber: string;
  requestDate: Date;
}) {
  const admins = await db.user.findMany({
    where: { role: "ADMIN" },
    select: { email: true },
  });
  const recipients = admins
    .map((a) => a.email?.trim())
    .filter((email): email is string => Boolean(email));

  if (recipients.length === 0) return;

  try {
    await transporter.sendMail({
      from: getEmailFrom(),
      to: recipients.join(","),
      subject: `New Withdrawal Request - ${formatEgp(input.amount)}`,
      html: withdrawalNotificationEmailHtml({
        engineerName: input.engineerName,
        engineerEmail: input.engineerEmail,
        amount: formatEgp(input.amount),
        method: input.method,
        accountNumber: input.accountNumber,
        requestDate: input.requestDate.toLocaleString("en-EG", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
      }),
    });
  } catch (error) {
    console.warn(
      "Failed to send withdrawal notification email:",
      error instanceof Error ? error.message : "Unknown error",
    );
  }
}
OLD_WITHDRAWAL_END */

async function getAcceptedBidForProject(projectId: number) {
  const bid = await db.bid.findFirst({
    where: { projectId, status: "ACCEPTED" },
    include: {
      engineer: { include: { user: { select: { id: true } } } },
    },
  });
  if (!bid) {
    throw new ApiError(400, "No accepted bid found for this project");
  }
  return bid;
}

export async function listPaymentMethods() {
  if (!process.env.PAYMOB_SECRET_KEY?.trim()) {
    throw new ApiError(
      503,
      "Payment gateway is not configured (PAYMOB_SECRET_KEY)",
    );
  }

  return listConfiguredPaymobMethods();
}

export async function getProjectPayment(projectId: number, userId: number) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { payment: true },
  });
  if (!project) throw new ApiError(404, "Project not found");

  const isClient = project.clientId === userId;
  const acceptedBid = await db.bid.findFirst({
    where: { projectId, status: "ACCEPTED" },
    include: { engineer: { include: { user: { select: { id: true } } } } },
  });
  const isEngineer = acceptedBid?.engineer.user.id === userId;

  if (!isClient && !isEngineer) {
    throw new ApiError(403, "You do not have access to this payment");
  }

  return project.payment;
}

export async function initiateProjectCheckout(
  clientId: number,
  projectId: number,
  input: InitiateCheckoutInput,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { payment: true, client: true },
  });
  if (!project) throw new ApiError(404, "Project not found");
  if (project.clientId !== clientId) {
    throw new ApiError(403, "Only the project owner can fund escrow");
  }
  if (project.status !== "IN_PROGRESS") {
    throw new ApiError(
      400,
      "Escrow payment is only available for in-progress projects",
    );
  }

  if (project.payment?.status === "FUNDED") {
    throw new ApiError(400, "Escrow is already funded for this project");
  }
  if (project.payment?.status === "RELEASED") {
    throw new ApiError(400, "Payment has already been released");
  }

  const bid = await getAcceptedBidForProject(projectId);
  // bid.engineerId is the EngineerProfile.id — correct foreign key for Payment.engineerId
  const engineerProfileId = bid.engineerId;
  const config = getPaymobConfig();
  const amount = toNumber(bid.price);
  const commission = Math.round(amount * config.commissionRate * 100) / 100;
  // Client is charged amount + commission so the platform fee is actually collected
  const totalCharged = Math.round((amount + commission) * 100) / 100;

  const payment =
    project.payment ??
    (await db.payment.create({
      data: {
        projectId,
        clientId,
        engineerId: engineerProfileId,
        amount,
        commission,
        status: "PENDING",
      },
    }));

  const { intention, checkoutUrl } = await createProjectPaymobIntention(
    project,
    payment,
    totalCharged,
    input.phone ?? "01000000000",
    input.address ?? "N/A",
    input.paymentMethodId ? [input.paymentMethodId] : undefined,
  );

  const updatedPayment = await db.payment.update({
    where: { id: payment.id },
    data: {
      gatewayInvoiceId: String(intention.orderId || intention.id),
      gatewayInvoiceKey: intention.id,
      status: "PENDING",
    },
  });

  return {
    payment: updatedPayment,
    intentionId: intention.id,
    orderId: intention.orderId,
    checkoutUrl,
    clientSecret: intention.clientSecret,
  };
}

/** Prepare Paymob Unified Checkout — creates pending payment + checkout URL */
export async function prepareProjectCheckoutSession(
  clientId: number,
  projectId: number,
  phone?: string,
  address?: string,
) {
  const project = await db.project.findUnique({
    where: { id: projectId },
    include: { payment: true, client: true },
  });
  if (!project) throw new ApiError(404, "Project not found");
  if (project.clientId !== clientId) {
    throw new ApiError(403, "Only the project owner can fund escrow");
  }
  if (project.status !== "IN_PROGRESS") {
    throw new ApiError(
      400,
      "Escrow payment is only available for in-progress projects",
    );
  }
  if (project.payment?.status === "FUNDED") {
    throw new ApiError(400, "Escrow is already funded for this project");
  }
  if (project.payment?.status === "RELEASED") {
    throw new ApiError(400, "Payment has already been released");
  }

  const bid = await getAcceptedBidForProject(projectId);
  // bid.engineerId is the EngineerProfile.id — correct foreign key for Payment.engineerId
  const engineerProfileId = bid.engineerId;
  const currency = process.env.PAYMOB_CURRENCY ?? "EGP";
  const commissionRate = Number(process.env.PLATFORM_COMMISSION_RATE ?? "0.1");
  const amount = toNumber(bid.price);
  const commission = Math.round(amount * commissionRate * 100) / 100;
  // Client is charged amount + commission so the platform fee is actually collected
  const totalCharged = Math.round((amount + commission) * 100) / 100;

  const payment =
    project.payment ??
    (await db.payment.create({
      data: {
        projectId,
        clientId,
        engineerId: engineerProfileId,
        amount,
        commission,
        status: "PENDING",
      },
    }));

  if (!process.env.PAYMOB_SECRET_KEY?.trim()) {
    throw new ApiError(503, "Payment gateway is not configured (PAYMOB_SECRET_KEY)");
  }

  const config = getPaymobConfig();
  const { intention, checkoutUrl } = await createProjectPaymobIntention(
    project,
    payment,
    totalCharged,
    phone ?? "01000000000",
    address ?? "N/A",
  );

  await db.payment.update({
    where: { id: payment.id },
    data: {
      gatewayInvoiceId: String(intention.orderId || intention.id),
      gatewayInvoiceKey: intention.id,
      status: "PENDING",
    },
  });

  return {
    checkoutUrl,
    clientSecret: intention.clientSecret,
    intentionId: intention.id,
    orderId: intention.orderId,
    currency: config.currency,
    projectId,
    projectTitle: project.title,
    paymentId: payment.id,
    amount,
    commission,
    totalCharged,
  };
}

async function isGatewayTransactionAlreadyFunded(
  transactionId: number,
  excludePaymentId?: number,
) {
  const existing = await db.payment.findFirst({
    where: {
      gatewayInvoiceKey: String(transactionId),
      status: { in: ["FUNDED", "RELEASED"] },
      ...(excludePaymentId ? { NOT: { id: excludePaymentId } } : {}),
    },
    select: { id: true },
  });
  return Boolean(existing);
}

/** Atomically mark a payment FUNDED only after Paymob transaction is verified. */
async function fundPaymentFromVerifiedTransaction(
  paymentId: number,
  transaction: PaymobTransactionObject,
  source: "webhook" | "inquiry",
) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      project: { select: { id: true, title: true, clientId: true, status: true } },
      engineer: { include: { user: { select: { id: true } } } },
    },
  });
  if (!payment) throw new ApiError(404, "Payment not found");

  if (payment.status === "FUNDED" || payment.status === "RELEASED") {
    return { payment, duplicate: true as const };
  }
  if (payment.status === "REFUNDED") {
    throw new ApiError(400, "Cannot fund a refunded payment");
  }

  const config = getPaymobConfig();
  validatePaymobTransactionForPayment(transaction, payment, config.integrationIds);

  if (await isGatewayTransactionAlreadyFunded(transaction.id, paymentId)) {
    throw new ApiError(409, "This Paymob transaction was already applied to a payment");
  }

  const netAmount = netEngineerAmount(payment.amount, payment.commission);
  const ledgerNote =
    source === "webhook"
      ? "Client escrow payment received via Paymob"
      : "Client escrow payment confirmed via Paymob inquiry";

  const result = await db.$transaction(async (tx) => {
    const fundedCount = await tx.payment.updateMany({
      where: { id: paymentId, status: "PENDING" },
      data: {
        status: "FUNDED",
        gatewayInvoiceId: transaction.order?.id
          ? String(transaction.order.id)
          : payment.gatewayInvoiceId,
        gatewayInvoiceKey: String(transaction.id),
      },
    });

    const funded = await tx.payment.findUniqueOrThrow({
      where: { id: paymentId },
      include: {
        project: { select: { id: true, title: true, clientId: true, status: true } },
        engineer: { include: { user: { select: { id: true } } } },
      },
    });

    if (fundedCount.count === 0) {
      return { funded, wasNewlyFunded: false };
    }

    const existingLedger = await tx.paymentLedgerEntry.findFirst({
      where: { paymentId, type: "FUNDED" },
      select: { id: true },
    });

    if (!existingLedger) {
      await recordPaymentLedger(tx, funded.id, [
        {
          type: "FUNDED",
          amount: toNumber(funded.amount) + toNumber(funded.commission),
          note: ledgerNote,
        },
        {
          type: "ENGINEER_ESCROW",
          amount: netAmount,
          note: "Engineer share held in escrow",
        },
        {
          type: "PLATFORM_COMMISSION",
          amount: funded.commission,
          note: "Platform commission on funded payment",
        },
      ]);
    }

    if (funded.project.status !== "IN_PROGRESS") {
      await tx.project.update({
        where: { id: funded.projectId },
        data: { status: "IN_PROGRESS" },
      });
    }

    return { funded, wasNewlyFunded: true };
  });

  if (result.wasNewlyFunded) {
    const { createNotification } = await import("../../utils/notifications");
    await createNotification(
      result.funded.engineer.user.id,
      "ESCROW_FUNDED",
      "Payment received",
      `The client paid for "${result.funded.project.title}". You can start working.`,
      `/messages?project=${result.funded.projectId}`,
    );
    await createNotification(
      result.funded.engineer.user.id,
      "PROJECT_STARTED",
      "Project started",
      `Escrow is funded for "${result.funded.project.title}". Begin work when ready.`,
      `/messages?project=${result.funded.projectId}`,
    );
    await createNotification(
      result.funded.project.clientId,
      "PAYMENT_RECEIVED",
      "Payment successful",
      `Your payment for "${result.funded.project.title}" is secured in escrow.`,
      `/escrow?project=${result.funded.projectId}`,
    );
  }

  return { payment: result.funded, duplicate: !result.wasNewlyFunded };
}

async function resolveVerifiedPaymobTransaction(
  input: VerifyCheckoutReturnInput,
  payment: {
    id: number;
    amount: any;
    commission: any;
    gatewayInvoiceId: string | null;
  },
): Promise<PaymobTransactionObject | null> {
  const config = getPaymobConfig();
  const fromQuery = parseCheckoutReturnQuery(input.returnQuery);
  const transactionId = input.transactionId ?? fromQuery.transactionId;
  const orderId = input.orderId ?? fromQuery.orderId;
  const specialReference = input.specialReference ?? fromQuery.specialReference;
  const merchantOrderId = input.merchantOrderId ?? fromQuery.merchantOrderId;

  const candidates: PaymobTransactionObject[] = [];
  const seen = new Set<number>();

  const pushCandidate = (tx: PaymobTransactionObject | null) => {
    if (!tx || seen.has(tx.id)) return;
    seen.add(tx.id);
    candidates.push(tx);
  };

  const references = [
    specialReference,
    merchantOrderId,
  ].filter((value): value is string => Boolean(value?.trim()));

  const safePush = async (loader: () => Promise<PaymobTransactionObject | null>) => {
    try {
      pushCandidate(await loader());
    } catch {
      // Try other inquiry strategies.
    }
  };

  if (transactionId) {
    await safePush(() => fetchPaymobTransactionById(transactionId));
  }

  const orderIds = new Set<number>();
  if (orderId) orderIds.add(orderId);
  if (payment.gatewayInvoiceId) {
    const storedOrderId = Number(payment.gatewayInvoiceId);
    if (Number.isInteger(storedOrderId) && storedOrderId > 0) {
      orderIds.add(storedOrderId);
    }
  }
  for (const id of orderIds) {
    await safePush(() => inquirePaymobTransactionByOrderId(id));
  }

  for (const reference of references) {
    await safePush(() => inquirePaymobTransactionByMerchantOrderId(reference));
  }

  for (const transaction of candidates) {
    try {
      validatePaymobTransactionForPayment(
        transaction,
        payment,
        config.integrationIds,
      );
      return transaction;
    } catch {
      // Try next candidate
    }
  }

  return null;
}

export async function handlePaymobWebhook(
  body: unknown,
  hmac: string | undefined,
) {
  const config = getPaymobConfig();
  const parsed = paymobWebhookSchema.safeParse(body);
  if (!parsed.success) {
    return { handled: false };
  }

  const payload = parsed.data;
  const transaction = payload.obj;

  if (config.hmacSecret) {
    const valid = verifyPaymobTransactionHmac(
      transaction,
      hmac ?? "",
      config.hmacSecret,
    );
    if (!valid) {
      throw new ApiError(401, "Invalid webhook signature");
    }
  } else if (process.env.NODE_ENV === "production") {
    throw new ApiError(500, "Paymob HMAC secret is not configured");
  }

  if (
    transaction.pending ||
    transaction.is_refunded ||
    transaction.is_voided ||
    !transaction.success
  ) {
    return {
      handled: true,
      type: transaction.pending ? "pending" : "failed",
      transactionId: transaction.id,
    };
  }

  let payment = await db.payment.findFirst({
    where: {
      OR: [
        ...(transaction.order?.id
          ? [{ gatewayInvoiceId: String(transaction.order.id) }]
          : []),
      ],
    },
  });

  if (!payment) {
    const merchantOrderId =
      payload.merchant_order_id ?? transaction.order?.merchant_order_id;
    const ref = parsePaymobSpecialReference(merchantOrderId);
    if (ref?.paymentId) {
      payment = await db.payment.findUnique({ where: { id: ref.paymentId } });
    }
  }

  if (!payment) {
    throw new ApiError(404, "Payment record not found for this transaction");
  }

  const { payment: funded, duplicate } = await fundPaymentFromVerifiedTransaction(
    payment.id,
    transaction,
    "webhook",
  );

  return {
    handled: true,
    type: "paid",
    paymentId: funded.id,
    duplicate,
  };
}

export async function getPaymentByGatewayId(
  gatewayId: string,
  userId: number,
) {
  const ref = parsePaymobSpecialReference(gatewayId);
  const payment = await db.payment.findFirst({
    where: {
      OR: [
        { gatewayInvoiceId: gatewayId },
        { gatewayInvoiceKey: gatewayId },
        ...(ref?.paymentId ? [{ id: ref.paymentId }] : []),
      ],
    },
    include: {
      project: { select: { id: true, title: true, status: true, clientId: true } },
    },
  });

  if (!payment) return null;

  const isClient = payment.clientId === userId;
  const acceptedBid = await db.bid.findFirst({
    where: { projectId: payment.projectId, status: "ACCEPTED" },
    include: { engineer: { include: { user: { select: { id: true } } } } },
  });
  const isEngineer = acceptedBid?.engineer.user.id === userId;

  if (!isClient && !isEngineer) {
    throw new ApiError(403, "You do not have access to this payment");
  }

  return {
    id: payment.id,
    projectId: payment.projectId,
    projectTitle: payment.project.title,
    amount: payment.amount,
    commission: payment.commission,
    status: payment.status,
    gatewayInvoiceId: payment.gatewayInvoiceId,
    gatewayInvoiceKey: payment.gatewayInvoiceKey,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

export type EngineerPaymentDisplayStatus =
  | "awaiting_payment"
  | "in_progress"
  | "paid"
  | "refunded";

function mapEngineerPaymentStatus(
  paymentStatus: string,
  projectStatus: string,
): EngineerPaymentDisplayStatus {
  if (paymentStatus === "PENDING") return "awaiting_payment";
  if (paymentStatus === "REFUNDED") return "refunded";
  if (paymentStatus === "RELEASED") return "paid";
  if (paymentStatus === "FUNDED") return "in_progress";
  return "awaiting_payment";
}

export async function getEngineerBalance(engineerUserId: number) {
  const profile = await db.engineerProfile.findUnique({
    where: { userId: engineerUserId },
    select: { id: true },
  });
  if (!profile) {
    return {
      availableBalance: 0,
      pendingBalance: 0,
      securedBalance: 0,
      awaitingClientPayment: 0,
      transactions: [] as Array<{
        id: number;
        projectId: number;
        projectTitle: string;
        amount: number;
        netAmount: number;
        commission: number;
        status: EngineerPaymentDisplayStatus;
        createdAt: Date;
        updatedAt: Date;
      }>,
      walletHistory: [] as Array<{
        id: number;
        amount: number;
        type: "PROJECT_PAYMENT" | "RELEASED" | "WITHDRAWAL";
        status: "PENDING" | "AVAILABLE" | "COMPLETED" | "REJECTED";
        description: string | null;
        availableAt: Date | null;
        relatedPaymentId: number | null;
        relatedWithdrawalId: number | null;
        createdAt: Date;
      }>,
      withdrawalRequests: [] as Array<{
        id: number;
        amount: number;
        method: string;
        accountNumber: string;
        status: "PENDING" | "PROCESSING" | "COMPLETED" | "REJECTED";
        adminNotes: string | null;
        processedAt: Date | null;
        createdAt: Date;
      }>,
    };
  }

  const { wallet } = await db.$transaction(async (tx) =>
    settleMaturedWalletTransactions(tx, engineerUserId),
  );

  const payments = await db.payment.findMany({
    where: { engineerId: profile.id },
    include: {
      project: { select: { id: true, title: true, status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  let availableBalance = 0;
  let securedBalance = 0;
  let awaitingClientPayment = 0;

  const transactions = payments.map((payment) => {
    const netAmount = netEngineerAmount(payment.amount, payment.commission);
    const status = mapEngineerPaymentStatus(
      payment.status,
      payment.project.status,
    );

    if (status === "paid") availableBalance += netAmount;
    else if (status === "in_progress") securedBalance += netAmount;
    else if (status === "awaiting_payment") {
      awaitingClientPayment += netAmount;
    }

    return {
      id: payment.id,
      projectId: payment.projectId,
      projectTitle: payment.project.title,
      amount: payment.amount,
      netAmount,
      commission: payment.commission,
      status,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    };
  });

  const [walletHistory, withdrawalRequests] = await Promise.all([
    db.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    db.withdrawalRequest.findMany({
      where: { userId: engineerUserId },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  ]);

  const legacyReserved = await getLegacyReservedWithdrawalAmount(
    db,
    engineerUserId,
  );
  const heldInWithdrawals = await db.withdrawalRequest.aggregate({
    where: {
      userId: engineerUserId,
      status: { in: [...BALANCE_HELD_STATUSES] },
      balanceHeldAt: { not: null },
    },
    _sum: { amount: true },
  });
  const heldAmount = heldInWithdrawals._sum.amount ?? 0;
  const spendableBalance = Math.max(
    0,
    Math.round((wallet.availableBalance - legacyReserved) * 100) / 100,
  );

  return {
    availableBalance: wallet.availableBalance,
    spendableBalance,
    heldInWithdrawals: heldAmount,
    pendingBalance: wallet.pendingBalance,
    securedBalance,
    awaitingClientPayment,
    transactions,
    walletHistory,
    withdrawalRequests: withdrawalRequests.map(sanitizeWithdrawalForEngineer),
  };
}

/* OLD_WITHDRAWAL_START — Manual withdrawal list (commented out for auto-withdrawal via Paymob)
export async function listEngineerWithdrawalRequests(engineerUserId: number) {
  await db.$transaction(async (tx) =>
    settleMaturedWalletTransactions(tx, engineerUserId),
  );

  return db.withdrawalRequest.findMany({
    where: { userId: engineerUserId },
    orderBy: { createdAt: "desc" },
  });
}
OLD_WITHDRAWAL_END */

/* OLD_WITHDRAWAL_START — Manual withdrawal creation (commented out for auto-withdrawal via Paymob)
export async function createEngineerWithdrawalRequest(
  engineerUserId: number,
  input: CreateWithdrawalRequestInput,
) {
  const engineer = await db.user.findUnique({
    where: { id: engineerUserId },
    select: { id: true, name: true, email: true, role: true },
  });
  if (!engineer || engineer.role !== "ENGINEER") {
    throw new ApiError(403, "Only engineers can request withdrawals");
  }

  const amount = Math.round(input.amount * 100) / 100;
  if (amount <= 0) {
    throw new ApiError(400, "Withdrawal amount must be greater than zero");
  }

  const request = await db.$transaction(async (tx) => {
    const { wallet } = await settleMaturedWalletTransactions(tx, engineerUserId);

    const pendingRequests = await tx.withdrawalRequest.aggregate({
      where: {
        userId: engineerUserId,
        status: { in: ["PENDING", "PROCESSING"] },
      },
      _sum: { amount: true },
    });

    const reserved = pendingRequests._sum.amount ?? 0;
    const spendable = wallet.availableBalance - reserved;
    if (amount > spendable) {
      throw new ApiError(
        400,
        `Withdrawal exceeds available spendable balance (${formatEgp(spendable)})`,
      );
    }

    const created = await tx.withdrawalRequest.create({
      data: {
        userId: engineerUserId,
        amount,
        method: input.method,
        accountNumber: input.accountNumber,
        status: "PENDING",
      },
    });

    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount,
        type: "WITHDRAWAL",
        status: "PENDING",
        description: `Withdrawal requested via ${input.method}`,
        relatedWithdrawalId: created.id,
      },
    });

    return created;
  });

  await sendWithdrawalRequestEmailToAdmins({
    engineerName: engineer.name,
    engineerEmail: engineer.email,
    amount,
    method: input.method,
    accountNumber: input.accountNumber,
    requestDate: request.createdAt,
  });

  return request;
}
OLD_WITHDRAWAL_END */

export async function listEngineerWithdrawalRequests(engineerUserId: number) {
  await db.$transaction(async (tx) =>
    settleMaturedWalletTransactions(tx, engineerUserId),
  );

  const rows = await db.withdrawalRequest.findMany({
    where: { userId: engineerUserId },
    orderBy: { createdAt: "desc" },
  });
  return rows.map(sanitizeWithdrawalForEngineer);
}

export async function createWithdrawalRequest(
  engineerUserId: number,
  payoutMethod: "PAYMOB" | "IBAN",
  input: import("./payments.validation").AutoWithdrawalInput | import("./payments.validation").InternationalWithdrawalInput,
  idempotencyKey: string,
) {
  const { createPaymobPayout, createIbanPayout } = await import("../payouts/payout.service");
  switch (payoutMethod) {
    case "PAYMOB":
      return createPaymobPayout(engineerUserId, input as import("./payments.validation").AutoWithdrawalInput, { idempotencyKey });
    case "IBAN":
      return createIbanPayout(engineerUserId, input as import("./payments.validation").InternationalWithdrawalInput, { idempotencyKey });
    default:
      const ApiError = (await import("../../utils/ApiError")).default;
      throw new ApiError(400, `Unsupported payout method: ${payoutMethod}`);
  }
}

export async function listEngineerEscrow(engineerUserId: number) {
  const balance = await getEngineerBalance(engineerUserId);
  return balance.transactions.map((tx) => ({
    id: tx.id,
    projectId: tx.projectId,
    projectTitle: tx.projectTitle,
    amount: tx.netAmount,
    commission: tx.commission,
    status: mapEngineerEscrowLegacyStatus(tx.status),
    createdAt: tx.createdAt,
    updatedAt: tx.updatedAt,
  }));
}

function mapEngineerEscrowLegacyStatus(
  status: EngineerPaymentDisplayStatus,
): "Pending" | "In escrow" | "Released" | "Refunded" {
  switch (status) {
    case "awaiting_payment":
      return "Pending";
    case "in_progress":
      return "In escrow";
    case "paid":
      return "Released";
    case "refunded":
      return "Refunded";
    default:
      return "Pending";
  }
}

export async function listClientEscrow(clientId: number) {
  const payments = await db.payment.findMany({
    where: { clientId },
    include: {
      project: { select: { id: true, title: true, status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return payments.map((payment) => ({
    id: payment.id,
    projectId: payment.projectId,
    projectTitle: payment.project.title,
    projectStatus: payment.project.status,
    amount: payment.amount,
    commission: payment.commission,
    status: mapPaymentStatusToEscrow(payment.status),
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  }));
}

function mapPaymentStatusToEscrow(
  status: string,
): "Pending" | "In escrow" | "Released" | "Refunded" {
  switch (status) {
    case "PENDING":
      return "Pending";
    case "FUNDED":
      return "In escrow";
    case "RELEASED":
      return "Released";
    case "REFUNDED":
      return "Refunded";
    default:
      return "Pending";
  }
}

export async function releaseEscrowPayment(
  clientId: number,
  paymentId: number,
) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { project: { select: { title: true, status: true } } },
  });
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.clientId !== clientId) {
    throw new ApiError(403, "Only the client can release escrow funds");
  }
  if (payment.status !== "FUNDED") {
    throw new ApiError(400, "Escrow must be funded before release");
  }
  if (!isReviewableStatus(payment.project.status)) {
    throw new ApiError(
      400,
      "The engineer must submit work before you can release payment",
    );
  }

  const netAmount = netEngineerAmount(payment.amount, payment.commission);
  const projectTitle = payment.project?.title ?? "Project";
  const engineerProfile = await db.engineerProfile.findUnique({
    where: { id: payment.engineerId },
    select: { userId: true },
  });
  if (!engineerProfile) {
    throw new ApiError(404, "Engineer profile not found for this payment");
  }

  const updated = await db.$transaction(async (tx) => {
    const released = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "RELEASED" },
    });
    await tx.project.update({
      where: { id: payment.projectId },
      data: { status: "COMPLETED" },
    });
    await recordPaymentLedger(tx, paymentId, [
      {
        type: "RELEASED",
        amount: netAmount,
        note: "Escrow released to engineer after client approval",
      },
      {
        type: "PLATFORM_COMMISSION",
        amount: payment.commission,
        note: "Platform commission retained on release",
      },
    ]);

    const wallet = await ensureWallet(tx, engineerProfile.userId);
    await tx.wallet.update({
      where: { id: wallet.id },
      data: {
        pendingBalance: { increment: netAmount },
      },
    });
    await tx.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: netAmount,
        type: "RELEASED",
        status: "PENDING",
        description: `Payment released for \"${projectTitle}\". Available after 14-day hold.`,
        availableAt: walletHoldReleaseDate(),
        relatedPaymentId: paymentId,
      },
    });

    return released;
  });

  const { createNotification } = await import("../../utils/notifications");
  await createNotification(
    engineerProfile.userId,
    "WORK_APPROVED",
    "Work approved",
    `The client approved your work on "${projectTitle}". Earnings are now pending in your wallet.`,
    `/balance`,
  );
  await createNotification(
    engineerProfile.userId,
    "FUNDS_RELEASED",
    "Payment queued to wallet",
    `The client released payment for "${projectTitle}". Funds will become available after the 14-day holding period.`,
    `/balance`,
  );
  await createNotification(
    payment.clientId,
    "PROJECT_COMPLETED",
    "Project completed",
    `Payment for "${projectTitle}" has been released. You can leave a review.`,
    `/projects?id=${payment.projectId}`,
  );

  return updated;
}

export async function getEscrowPaymentById(paymentId: number, userId: number) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: {
      project: {
        select: { id: true, title: true, status: true, clientId: true },
      },
    },
  });
  if (!payment) throw new ApiError(404, "Payment not found");

  const isClient = payment.clientId === userId;
  const acceptedBid = await db.bid.findFirst({
    where: { projectId: payment.projectId, status: "ACCEPTED" },
    include: { engineer: { include: { user: { select: { id: true } } } } },
  });
  const isEngineer = acceptedBid?.engineer.user.id === userId;

  if (!isClient && !isEngineer) {
    throw new ApiError(403, "You do not have access to this payment");
  }

  return {
    id: payment.id,
    projectId: payment.projectId,
    projectTitle: payment.project.title,
    amount: payment.amount,
    commission: payment.commission,
    status: mapPaymentStatusToEscrow(payment.status),
    gatewayInvoiceId: payment.gatewayInvoiceId,
    gatewayInvoiceKey: payment.gatewayInvoiceKey,
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  };
}

export async function resolvePaymentForCheckoutReturn(
  clientId: number,
  input: VerifyCheckoutReturnInput,
) {
  const fromQuery = parseCheckoutReturnQuery(input.returnQuery);
  const projectId = input.projectId ?? fromQuery.projectId;
  const paymentId = input.paymentId ?? fromQuery.paymentId;
  const orderId = input.orderId ?? fromQuery.orderId;
  const transactionId = input.transactionId ?? fromQuery.transactionId;
  const specialReference = input.specialReference ?? fromQuery.specialReference;
  const merchantOrderId = input.merchantOrderId ?? fromQuery.merchantOrderId;

  const assertClientPayment = (payment: { clientId: number }) => {
    if (payment.clientId !== clientId) {
      throw new ApiError(403, "Only the client can verify this payment");
    }
  };

  if (paymentId) {
    const payment = await db.payment.findUnique({ where: { id: paymentId } });
    if (payment) {
      assertClientPayment(payment);
      return payment;
    }
  }

  if (transactionId) {
    try {
      const transaction = await fetchPaymobTransactionById(transactionId);
      if (transaction?.order?.merchant_order_id) {
        const parsed = parsePaymobSpecialReference(
          transaction.order.merchant_order_id,
        );
        if (parsed?.paymentId) {
          const payment = await db.payment.findUnique({
            where: { id: parsed.paymentId },
          });
          if (payment) {
            assertClientPayment(payment);
            return payment;
          }
        }
      }
      if (transaction?.order?.id) {
        const payment = await db.payment.findFirst({
          where: {
            clientId,
            gatewayInvoiceId: String(transaction.order.id),
          },
        });
        if (payment) {
          assertClientPayment(payment);
          return payment;
        }
      }
    } catch {
      // Inquiry may be unavailable; fall through to other lookup strategies.
    }
  }

  if (projectId) {
    const payment = await db.payment.findFirst({
      where: { projectId, clientId },
    });
    if (payment) return payment;
  }

  const referenceValues = [specialReference, merchantOrderId].filter(
    (value): value is string => Boolean(value?.trim()),
  );

  for (const reference of referenceValues) {
    const parsed = parsePaymobSpecialReference(reference);
    if (parsed?.paymentId) {
      const payment = await db.payment.findUnique({
        where: { id: parsed.paymentId },
      });
      if (payment) {
        assertClientPayment(payment);
        return payment;
      }
    }
  }

  const gatewayIds = collectGatewayIds({
    projectId,
    paymentId,
    orderId,
    transactionId,
    specialReference,
    merchantOrderId,
  });

  if (gatewayIds.length > 0) {
    const payment = await db.payment.findFirst({
      where: {
        clientId,
        OR: gatewayIds.flatMap((gatewayId) => [
          { gatewayInvoiceId: gatewayId },
          { gatewayInvoiceKey: gatewayId },
        ]),
      },
    });
    if (payment) {
      assertClientPayment(payment);
      return payment;
    }
  }

  throw new ApiError(404, "Could not determine which payment to verify.");
}

async function refreshPaymentRecord(paymentId: number) {
  return db.payment.findUniqueOrThrow({
    where: { id: paymentId },
    include: {
      project: { select: { id: true, title: true, status: true } },
    },
  });
}

/** Poll Paymob and the database — never marks paid without gateway confirmation. */
export async function pollPaymentConfirmation(
  clientId: number,
  paymentId: number,
  input: VerifyCheckoutReturnInput = {},
) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
  });
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.clientId !== clientId) {
    throw new ApiError(403, "Only the client can verify this payment");
  }

  if (payment.status === "FUNDED" || payment.status === "RELEASED") {
    return refreshPaymentRecord(paymentId);
  }
  if (payment.status === "REFUNDED") {
    throw new ApiError(400, "Cannot verify a refunded payment");
  }

  for (let attempt = 0; attempt < CHECKOUT_VERIFY_POLL_ATTEMPTS; attempt++) {
    const transaction = await resolveVerifiedPaymobTransaction(input, payment);
    if (transaction) {
      const { payment: funded } = await fundPaymentFromVerifiedTransaction(
        payment.id,
        transaction,
        "inquiry",
      );
      return funded;
    }

    const refreshed = await db.payment.findUnique({ where: { id: paymentId } });
    if (
      refreshed?.status === "FUNDED" ||
      refreshed?.status === "RELEASED"
    ) {
      return refreshPaymentRecord(paymentId);
    }

    if (attempt < CHECKOUT_VERIFY_POLL_ATTEMPTS - 1) {
      await sleep(CHECKOUT_VERIFY_POLL_INTERVAL_MS);
    }
  }

  return refreshPaymentRecord(paymentId);
}

export async function verifyCheckoutReturn(
  clientId: number,
  input: VerifyCheckoutReturnInput,
) {
  const payment = await resolvePaymentForCheckoutReturn(clientId, input);

  if (payment.status === "FUNDED" || payment.status === "RELEASED") {
    return payment;
  }

  return pollPaymentConfirmation(clientId, payment.id, input);
}

/** @deprecated Use pollPaymentConfirmation — never funds without Paymob proof. */
export async function verifyOrSimulatePaymentSuccess(
  clientId: number,
  paymentId: number,
) {
  return pollPaymentConfirmation(clientId, paymentId);
}

export async function refundEscrowPayment(clientId: number, paymentId: number) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
    include: { project: { select: { title: true } } },
  });
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.clientId !== clientId) {
    throw new ApiError(403, "Only the client can request a refund");
  }
  if (payment.status !== "FUNDED") {
    throw new ApiError(400, "Only funded escrow can be refunded");
  }

  // Cancel the project and mark payment refunded atomically
  const updated = await db.$transaction(async (tx) => {
    const refunded = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "REFUNDED" },
    });
    await tx.project.update({
      where: { id: payment.projectId },
      data: { status: "CANCELLED" },
    });
    return refunded;
  });

  // Notify the engineer so they're not left wondering
  const engineerProfile = await db.engineerProfile.findUnique({
    where: { id: payment.engineerId },
    select: { userId: true },
  });
  const { createNotification } = await import("../../utils/notifications");
  if (engineerProfile) {
    await createNotification(
      engineerProfile.userId,
      "ESCROW_REFUNDED",
      "Payment refunded",
      `The client was refunded for "${payment.project.title}". The project has been cancelled.`,
      `/balance`,
    );
  }

  return updated;
}
