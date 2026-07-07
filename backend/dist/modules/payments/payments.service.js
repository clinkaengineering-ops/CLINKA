"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listPaymentMethods = listPaymentMethods;
exports.getProjectPayment = getProjectPayment;
exports.initiateProjectCheckout = initiateProjectCheckout;
exports.prepareProjectCheckoutSession = prepareProjectCheckoutSession;
exports.handlePaymobWebhook = handlePaymobWebhook;
exports.getPaymentByGatewayId = getPaymentByGatewayId;
exports.getEngineerBalance = getEngineerBalance;
exports.listEngineerWithdrawalRequests = listEngineerWithdrawalRequests;
exports.createEngineerAutoWithdrawal = createEngineerAutoWithdrawal;
exports.listEngineerEscrow = listEngineerEscrow;
exports.listClientEscrow = listClientEscrow;
exports.releaseEscrowPayment = releaseEscrowPayment;
exports.getEscrowPaymentById = getEscrowPaymentById;
exports.resolvePaymentForCheckoutReturn = resolvePaymentForCheckoutReturn;
exports.pollPaymentConfirmation = pollPaymentConfirmation;
exports.verifyCheckoutReturn = verifyCheckoutReturn;
exports.verifyOrSimulatePaymentSuccess = verifyOrSimulatePaymentSuccess;
exports.refundEscrowPayment = refundEscrowPayment;
const db_1 = __importDefault(require("../../config/db"));
const clientUrl_1 = require("../../config/clientUrl");
const paymob_1 = require("../../config/paymob");
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const paymob_api_1 = require("./paymob.api");
const paymob_inquiry_1 = require("./paymob.inquiry");
const paymob_webhook_1 = require("./paymob.webhook");
const checkoutReturnQuery_1 = require("./checkoutReturnQuery");
const payout_service_1 = require("../payouts/payout.service");
const payments_validation_1 = require("./payments.validation");
const paymentLedger_1 = require("../../utils/paymentLedger");
const project_status_1 = require("../projects/project.status");
const wallet_1 = require("../../utils/wallet");
function toNumber(value) {
    return typeof value === "number" ? value : Number(value.toString());
}
function amountToCents(amount) {
    return Math.round(amount * 100);
}
function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
const CHECKOUT_VERIFY_POLL_ATTEMPTS = 6;
const CHECKOUT_VERIFY_POLL_INTERVAL_MS = 1500;
function paymobPaymentReferenceBase(paymentId) {
    return `clinka-payment-${paymentId}`;
}
function paymobCheckoutSpecialReference(paymentId) {
    // Unique per checkout attempt — Paymob rejects duplicate merchant references.
    return `${paymobPaymentReferenceBase(paymentId)}-${Date.now()}`;
}
async function createProjectPaymobIntention(project, payment, totalCharged, phone, address, paymentMethodIds) {
    const config = (0, paymob_1.getPaymobConfig)();
    const { first_name, last_name } = splitCustomerName(project.client.name);
    const redirectionUrls = getRedirectionUrls(project.id, payment.id);
    const amountCents = amountToCents(totalCharged);
    const intention = await (0, paymob_api_1.createPaymobIntention)({
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
        checkoutUrl: (0, paymob_1.buildPaymobCheckoutUrl)(config, intention.clientSecret),
    };
}
function splitCustomerName(fullName) {
    const parts = fullName.trim().split(/\s+/);
    if (parts.length === 1) {
        return { first_name: parts[0], last_name: parts[0] };
    }
    return {
        first_name: parts[0],
        last_name: parts.slice(1).join(" "),
    };
}
function getRedirectionUrls(projectId, paymentId) {
    const clientUrl = (0, clientUrl_1.getClientUrl)();
    const apiUrl = (process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 5000}`).replace(/\/$/, "");
    return {
        successUrl: `${clientUrl}/checkout?projectId=${projectId}&paymentId=${paymentId}&status=success`,
        failUrl: `${clientUrl}/checkout?projectId=${projectId}&paymentId=${paymentId}&status=fail`,
        pendingUrl: `${clientUrl}/checkout?projectId=${projectId}&paymentId=${paymentId}&status=pending`,
        webhookUrl: `${apiUrl}/api/payments/webhook/paymob`,
    };
}
function formatEgp(amount) {
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
async function getAcceptedBidForProject(projectId) {
    const bid = await db_1.default.bid.findFirst({
        where: { projectId, status: "ACCEPTED" },
        include: {
            engineer: { include: { user: { select: { id: true } } } },
        },
    });
    if (!bid) {
        throw new ApiError_1.default(400, "No accepted bid found for this project");
    }
    return bid;
}
async function listPaymentMethods() {
    if (!process.env.PAYMOB_SECRET_KEY?.trim()) {
        throw new ApiError_1.default(503, "Payment gateway is not configured (PAYMOB_SECRET_KEY)");
    }
    return (0, paymob_api_1.listConfiguredPaymobMethods)();
}
async function getProjectPayment(projectId, userId) {
    const project = await db_1.default.project.findUnique({
        where: { id: projectId },
        include: { payment: true },
    });
    if (!project)
        throw new ApiError_1.default(404, "Project not found");
    const isClient = project.clientId === userId;
    const acceptedBid = await db_1.default.bid.findFirst({
        where: { projectId, status: "ACCEPTED" },
        include: { engineer: { include: { user: { select: { id: true } } } } },
    });
    const isEngineer = acceptedBid?.engineer.user.id === userId;
    if (!isClient && !isEngineer) {
        throw new ApiError_1.default(403, "You do not have access to this payment");
    }
    return project.payment;
}
async function initiateProjectCheckout(clientId, projectId, input) {
    const project = await db_1.default.project.findUnique({
        where: { id: projectId },
        include: { payment: true, client: true },
    });
    if (!project)
        throw new ApiError_1.default(404, "Project not found");
    if (project.clientId !== clientId) {
        throw new ApiError_1.default(403, "Only the project owner can fund escrow");
    }
    if (project.status !== "IN_PROGRESS") {
        throw new ApiError_1.default(400, "Escrow payment is only available for in-progress projects");
    }
    if (project.payment?.status === "FUNDED") {
        throw new ApiError_1.default(400, "Escrow is already funded for this project");
    }
    if (project.payment?.status === "RELEASED") {
        throw new ApiError_1.default(400, "Payment has already been released");
    }
    const bid = await getAcceptedBidForProject(projectId);
    // bid.engineerId is the EngineerProfile.id — correct foreign key for Payment.engineerId
    const engineerProfileId = bid.engineerId;
    const config = (0, paymob_1.getPaymobConfig)();
    const amount = toNumber(bid.price);
    const commission = Math.round(amount * config.commissionRate * 100) / 100;
    // Client is charged amount + commission so the platform fee is actually collected
    const totalCharged = Math.round((amount + commission) * 100) / 100;
    const payment = project.payment ??
        (await db_1.default.payment.create({
            data: {
                projectId,
                clientId,
                engineerId: engineerProfileId,
                amount,
                commission,
                status: "PENDING",
            },
        }));
    const { intention, checkoutUrl } = await createProjectPaymobIntention(project, payment, totalCharged, input.phone ?? "01000000000", input.address ?? "N/A", input.paymentMethodId ? [input.paymentMethodId] : undefined);
    const updatedPayment = await db_1.default.payment.update({
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
async function prepareProjectCheckoutSession(clientId, projectId, phone, address) {
    const project = await db_1.default.project.findUnique({
        where: { id: projectId },
        include: { payment: true, client: true },
    });
    if (!project)
        throw new ApiError_1.default(404, "Project not found");
    if (project.clientId !== clientId) {
        throw new ApiError_1.default(403, "Only the project owner can fund escrow");
    }
    if (project.status !== "IN_PROGRESS") {
        throw new ApiError_1.default(400, "Escrow payment is only available for in-progress projects");
    }
    if (project.payment?.status === "FUNDED") {
        throw new ApiError_1.default(400, "Escrow is already funded for this project");
    }
    if (project.payment?.status === "RELEASED") {
        throw new ApiError_1.default(400, "Payment has already been released");
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
    const payment = project.payment ??
        (await db_1.default.payment.create({
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
        throw new ApiError_1.default(503, "Payment gateway is not configured (PAYMOB_SECRET_KEY)");
    }
    const config = (0, paymob_1.getPaymobConfig)();
    const { intention, checkoutUrl } = await createProjectPaymobIntention(project, payment, totalCharged, phone ?? "01000000000", address ?? "N/A");
    await db_1.default.payment.update({
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
async function isGatewayTransactionAlreadyFunded(transactionId, excludePaymentId) {
    const existing = await db_1.default.payment.findFirst({
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
async function fundPaymentFromVerifiedTransaction(paymentId, transaction, source) {
    const payment = await db_1.default.payment.findUnique({
        where: { id: paymentId },
        include: {
            project: { select: { id: true, title: true, clientId: true, status: true } },
            engineer: { include: { user: { select: { id: true } } } },
        },
    });
    if (!payment)
        throw new ApiError_1.default(404, "Payment not found");
    if (payment.status === "FUNDED" || payment.status === "RELEASED") {
        return { payment, duplicate: true };
    }
    if (payment.status === "REFUNDED") {
        throw new ApiError_1.default(400, "Cannot fund a refunded payment");
    }
    const config = (0, paymob_1.getPaymobConfig)();
    (0, paymob_inquiry_1.validatePaymobTransactionForPayment)(transaction, payment, config.integrationIds);
    if (await isGatewayTransactionAlreadyFunded(transaction.id, paymentId)) {
        throw new ApiError_1.default(409, "This Paymob transaction was already applied to a payment");
    }
    const netAmount = (0, paymentLedger_1.netEngineerAmount)(payment.amount, payment.commission);
    const ledgerNote = source === "webhook"
        ? "Client escrow payment received via Paymob"
        : "Client escrow payment confirmed via Paymob inquiry";
    const result = await db_1.default.$transaction(async (tx) => {
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
            await (0, paymentLedger_1.recordPaymentLedger)(tx, funded.id, [
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
        const { createNotification } = await Promise.resolve().then(() => __importStar(require("../../utils/notifications")));
        await createNotification(result.funded.engineer.user.id, "ESCROW_FUNDED", "Payment received", `The client paid for "${result.funded.project.title}". You can start working.`, `/messages?project=${result.funded.projectId}`);
        await createNotification(result.funded.engineer.user.id, "PROJECT_STARTED", "Project started", `Escrow is funded for "${result.funded.project.title}". Begin work when ready.`, `/messages?project=${result.funded.projectId}`);
        await createNotification(result.funded.project.clientId, "PAYMENT_RECEIVED", "Payment successful", `Your payment for "${result.funded.project.title}" is secured in escrow.`, `/escrow?project=${result.funded.projectId}`);
    }
    return { payment: result.funded, duplicate: !result.wasNewlyFunded };
}
async function resolveVerifiedPaymobTransaction(input, payment) {
    const config = (0, paymob_1.getPaymobConfig)();
    const fromQuery = (0, checkoutReturnQuery_1.parseCheckoutReturnQuery)(input.returnQuery);
    const transactionId = input.transactionId ?? fromQuery.transactionId;
    const orderId = input.orderId ?? fromQuery.orderId;
    const specialReference = input.specialReference ?? fromQuery.specialReference;
    const merchantOrderId = input.merchantOrderId ?? fromQuery.merchantOrderId;
    const candidates = [];
    const seen = new Set();
    const pushCandidate = (tx) => {
        if (!tx || seen.has(tx.id))
            return;
        seen.add(tx.id);
        candidates.push(tx);
    };
    const references = [
        specialReference,
        merchantOrderId,
    ].filter((value) => Boolean(value?.trim()));
    const safePush = async (loader) => {
        try {
            pushCandidate(await loader());
        }
        catch {
            // Try other inquiry strategies.
        }
    };
    if (transactionId) {
        await safePush(() => (0, paymob_inquiry_1.fetchPaymobTransactionById)(transactionId));
    }
    const orderIds = new Set();
    if (orderId)
        orderIds.add(orderId);
    if (payment.gatewayInvoiceId) {
        const storedOrderId = Number(payment.gatewayInvoiceId);
        if (Number.isInteger(storedOrderId) && storedOrderId > 0) {
            orderIds.add(storedOrderId);
        }
    }
    for (const id of orderIds) {
        await safePush(() => (0, paymob_inquiry_1.inquirePaymobTransactionByOrderId)(id));
    }
    for (const reference of references) {
        await safePush(() => (0, paymob_inquiry_1.inquirePaymobTransactionByMerchantOrderId)(reference));
    }
    for (const transaction of candidates) {
        try {
            (0, paymob_inquiry_1.validatePaymobTransactionForPayment)(transaction, payment, config.integrationIds);
            return transaction;
        }
        catch {
            // Try next candidate
        }
    }
    return null;
}
async function handlePaymobWebhook(body, hmac) {
    const config = (0, paymob_1.getPaymobConfig)();
    const parsed = payments_validation_1.paymobWebhookSchema.safeParse(body);
    if (!parsed.success) {
        return { handled: false };
    }
    const payload = parsed.data;
    const transaction = payload.obj;
    if (config.hmacSecret) {
        const valid = (0, paymob_webhook_1.verifyPaymobTransactionHmac)(transaction, hmac ?? "", config.hmacSecret);
        if (!valid) {
            throw new ApiError_1.default(401, "Invalid webhook signature");
        }
    }
    else if (process.env.NODE_ENV === "production") {
        throw new ApiError_1.default(500, "Paymob HMAC secret is not configured");
    }
    if (transaction.pending ||
        transaction.is_refunded ||
        transaction.is_voided ||
        !transaction.success) {
        return {
            handled: true,
            type: transaction.pending ? "pending" : "failed",
            transactionId: transaction.id,
        };
    }
    let payment = await db_1.default.payment.findFirst({
        where: {
            OR: [
                ...(transaction.order?.id
                    ? [{ gatewayInvoiceId: String(transaction.order.id) }]
                    : []),
            ],
        },
    });
    if (!payment) {
        const merchantOrderId = payload.merchant_order_id ?? transaction.order?.merchant_order_id;
        const ref = (0, paymob_webhook_1.parsePaymobSpecialReference)(merchantOrderId);
        if (ref?.paymentId) {
            payment = await db_1.default.payment.findUnique({ where: { id: ref.paymentId } });
        }
    }
    if (!payment) {
        throw new ApiError_1.default(404, "Payment record not found for this transaction");
    }
    const { payment: funded, duplicate } = await fundPaymentFromVerifiedTransaction(payment.id, transaction, "webhook");
    return {
        handled: true,
        type: "paid",
        paymentId: funded.id,
        duplicate,
    };
}
async function getPaymentByGatewayId(gatewayId, userId) {
    const ref = (0, paymob_webhook_1.parsePaymobSpecialReference)(gatewayId);
    const payment = await db_1.default.payment.findFirst({
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
    if (!payment)
        return null;
    const isClient = payment.clientId === userId;
    const acceptedBid = await db_1.default.bid.findFirst({
        where: { projectId: payment.projectId, status: "ACCEPTED" },
        include: { engineer: { include: { user: { select: { id: true } } } } },
    });
    const isEngineer = acceptedBid?.engineer.user.id === userId;
    if (!isClient && !isEngineer) {
        throw new ApiError_1.default(403, "You do not have access to this payment");
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
function mapEngineerPaymentStatus(paymentStatus, projectStatus) {
    if (paymentStatus === "PENDING")
        return "awaiting_payment";
    if (paymentStatus === "REFUNDED")
        return "refunded";
    if (paymentStatus === "RELEASED")
        return "paid";
    if (paymentStatus === "FUNDED")
        return "in_progress";
    return "awaiting_payment";
}
async function getEngineerBalance(engineerUserId) {
    const profile = await db_1.default.engineerProfile.findUnique({
        where: { userId: engineerUserId },
        select: { id: true },
    });
    if (!profile) {
        return {
            availableBalance: 0,
            pendingBalance: 0,
            securedBalance: 0,
            awaitingClientPayment: 0,
            transactions: [],
            walletHistory: [],
            withdrawalRequests: [],
        };
    }
    const { wallet } = await db_1.default.$transaction(async (tx) => (0, wallet_1.settleMaturedWalletTransactions)(tx, engineerUserId));
    const payments = await db_1.default.payment.findMany({
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
        const netAmount = (0, paymentLedger_1.netEngineerAmount)(payment.amount, payment.commission);
        const status = mapEngineerPaymentStatus(payment.status, payment.project.status);
        if (status === "paid")
            availableBalance += netAmount;
        else if (status === "in_progress")
            securedBalance += netAmount;
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
        db_1.default.walletTransaction.findMany({
            where: { walletId: wallet.id },
            orderBy: { createdAt: "desc" },
            take: 100,
        }),
        db_1.default.withdrawalRequest.findMany({
            where: { userId: engineerUserId },
            orderBy: { createdAt: "desc" },
            take: 100,
        }),
    ]);
    const legacyReserved = await (0, payout_service_1.getLegacyReservedWithdrawalAmount)(db_1.default, engineerUserId);
    const heldInWithdrawals = await db_1.default.withdrawalRequest.aggregate({
        where: {
            userId: engineerUserId,
            status: { in: ["PENDING", "SUBMITTED", "PROCESSING"] },
            balanceHeldAt: { not: null },
        },
        _sum: { amount: true },
    });
    const heldAmount = heldInWithdrawals._sum.amount ?? 0;
    const spendableBalance = Math.max(0, Math.round((wallet.availableBalance - legacyReserved) * 100) / 100);
    return {
        availableBalance: wallet.availableBalance,
        spendableBalance,
        heldInWithdrawals: heldAmount,
        pendingBalance: wallet.pendingBalance,
        securedBalance,
        awaitingClientPayment,
        transactions,
        walletHistory,
        withdrawalRequests,
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
async function listEngineerWithdrawalRequests(engineerUserId) {
    await db_1.default.$transaction(async (tx) => (0, wallet_1.settleMaturedWalletTransactions)(tx, engineerUserId));
    return db_1.default.withdrawalRequest.findMany({
        where: { userId: engineerUserId },
        orderBy: { createdAt: "desc" },
    });
}
async function createEngineerAutoWithdrawal(engineerUserId, input, options) {
    return (0, payout_service_1.createEngineerPayout)(engineerUserId, input, options);
}
async function listEngineerEscrow(engineerUserId) {
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
function mapEngineerEscrowLegacyStatus(status) {
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
async function listClientEscrow(clientId) {
    const payments = await db_1.default.payment.findMany({
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
function mapPaymentStatusToEscrow(status) {
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
async function releaseEscrowPayment(clientId, paymentId) {
    const payment = await db_1.default.payment.findUnique({
        where: { id: paymentId },
        include: { project: { select: { title: true, status: true } } },
    });
    if (!payment)
        throw new ApiError_1.default(404, "Payment not found");
    if (payment.clientId !== clientId) {
        throw new ApiError_1.default(403, "Only the client can release escrow funds");
    }
    if (payment.status !== "FUNDED") {
        throw new ApiError_1.default(400, "Escrow must be funded before release");
    }
    if (!(0, project_status_1.isReviewableStatus)(payment.project.status)) {
        throw new ApiError_1.default(400, "The engineer must submit work before you can release payment");
    }
    const netAmount = (0, paymentLedger_1.netEngineerAmount)(payment.amount, payment.commission);
    const projectTitle = payment.project?.title ?? "Project";
    const engineerProfile = await db_1.default.engineerProfile.findUnique({
        where: { id: payment.engineerId },
        select: { userId: true },
    });
    if (!engineerProfile) {
        throw new ApiError_1.default(404, "Engineer profile not found for this payment");
    }
    const updated = await db_1.default.$transaction(async (tx) => {
        const released = await tx.payment.update({
            where: { id: paymentId },
            data: { status: "RELEASED" },
        });
        await tx.project.update({
            where: { id: payment.projectId },
            data: { status: "COMPLETED" },
        });
        await (0, paymentLedger_1.recordPaymentLedger)(tx, paymentId, [
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
        const wallet = await (0, wallet_1.ensureWallet)(tx, engineerProfile.userId);
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
                availableAt: (0, wallet_1.walletHoldReleaseDate)(),
                relatedPaymentId: paymentId,
            },
        });
        return released;
    });
    const { createNotification } = await Promise.resolve().then(() => __importStar(require("../../utils/notifications")));
    await createNotification(engineerProfile.userId, "WORK_APPROVED", "Work approved", `The client approved your work on "${projectTitle}". Earnings are now pending in your wallet.`, `/balance`);
    await createNotification(engineerProfile.userId, "FUNDS_RELEASED", "Payment queued to wallet", `The client released payment for "${projectTitle}". Funds will become available after the 14-day holding period.`, `/balance`);
    await createNotification(payment.clientId, "PROJECT_COMPLETED", "Project completed", `Payment for "${projectTitle}" has been released. You can leave a review.`, `/projects?id=${payment.projectId}`);
    return updated;
}
async function getEscrowPaymentById(paymentId, userId) {
    const payment = await db_1.default.payment.findUnique({
        where: { id: paymentId },
        include: {
            project: {
                select: { id: true, title: true, status: true, clientId: true },
            },
        },
    });
    if (!payment)
        throw new ApiError_1.default(404, "Payment not found");
    const isClient = payment.clientId === userId;
    const acceptedBid = await db_1.default.bid.findFirst({
        where: { projectId: payment.projectId, status: "ACCEPTED" },
        include: { engineer: { include: { user: { select: { id: true } } } } },
    });
    const isEngineer = acceptedBid?.engineer.user.id === userId;
    if (!isClient && !isEngineer) {
        throw new ApiError_1.default(403, "You do not have access to this payment");
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
async function resolvePaymentForCheckoutReturn(clientId, input) {
    const fromQuery = (0, checkoutReturnQuery_1.parseCheckoutReturnQuery)(input.returnQuery);
    const projectId = input.projectId ?? fromQuery.projectId;
    const paymentId = input.paymentId ?? fromQuery.paymentId;
    const orderId = input.orderId ?? fromQuery.orderId;
    const transactionId = input.transactionId ?? fromQuery.transactionId;
    const specialReference = input.specialReference ?? fromQuery.specialReference;
    const merchantOrderId = input.merchantOrderId ?? fromQuery.merchantOrderId;
    const assertClientPayment = (payment) => {
        if (payment.clientId !== clientId) {
            throw new ApiError_1.default(403, "Only the client can verify this payment");
        }
    };
    if (paymentId) {
        const payment = await db_1.default.payment.findUnique({ where: { id: paymentId } });
        if (payment) {
            assertClientPayment(payment);
            return payment;
        }
    }
    if (transactionId) {
        try {
            const transaction = await (0, paymob_inquiry_1.fetchPaymobTransactionById)(transactionId);
            if (transaction?.order?.merchant_order_id) {
                const parsed = (0, paymob_webhook_1.parsePaymobSpecialReference)(transaction.order.merchant_order_id);
                if (parsed?.paymentId) {
                    const payment = await db_1.default.payment.findUnique({
                        where: { id: parsed.paymentId },
                    });
                    if (payment) {
                        assertClientPayment(payment);
                        return payment;
                    }
                }
            }
            if (transaction?.order?.id) {
                const payment = await db_1.default.payment.findFirst({
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
        }
        catch {
            // Inquiry may be unavailable; fall through to other lookup strategies.
        }
    }
    if (projectId) {
        const payment = await db_1.default.payment.findFirst({
            where: { projectId, clientId },
        });
        if (payment)
            return payment;
    }
    const referenceValues = [specialReference, merchantOrderId].filter((value) => Boolean(value?.trim()));
    for (const reference of referenceValues) {
        const parsed = (0, paymob_webhook_1.parsePaymobSpecialReference)(reference);
        if (parsed?.paymentId) {
            const payment = await db_1.default.payment.findUnique({
                where: { id: parsed.paymentId },
            });
            if (payment) {
                assertClientPayment(payment);
                return payment;
            }
        }
    }
    const gatewayIds = (0, checkoutReturnQuery_1.collectGatewayIds)({
        projectId,
        paymentId,
        orderId,
        transactionId,
        specialReference,
        merchantOrderId,
    });
    if (gatewayIds.length > 0) {
        const payment = await db_1.default.payment.findFirst({
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
    throw new ApiError_1.default(404, "Could not determine which payment to verify.");
}
async function refreshPaymentRecord(paymentId) {
    return db_1.default.payment.findUniqueOrThrow({
        where: { id: paymentId },
        include: {
            project: { select: { id: true, title: true, status: true } },
        },
    });
}
/** Poll Paymob and the database — never marks paid without gateway confirmation. */
async function pollPaymentConfirmation(clientId, paymentId, input = {}) {
    const payment = await db_1.default.payment.findUnique({
        where: { id: paymentId },
    });
    if (!payment)
        throw new ApiError_1.default(404, "Payment not found");
    if (payment.clientId !== clientId) {
        throw new ApiError_1.default(403, "Only the client can verify this payment");
    }
    if (payment.status === "FUNDED" || payment.status === "RELEASED") {
        return refreshPaymentRecord(paymentId);
    }
    if (payment.status === "REFUNDED") {
        throw new ApiError_1.default(400, "Cannot verify a refunded payment");
    }
    for (let attempt = 0; attempt < CHECKOUT_VERIFY_POLL_ATTEMPTS; attempt++) {
        const transaction = await resolveVerifiedPaymobTransaction(input, payment);
        if (transaction) {
            const { payment: funded } = await fundPaymentFromVerifiedTransaction(payment.id, transaction, "inquiry");
            return funded;
        }
        const refreshed = await db_1.default.payment.findUnique({ where: { id: paymentId } });
        if (refreshed?.status === "FUNDED" ||
            refreshed?.status === "RELEASED") {
            return refreshPaymentRecord(paymentId);
        }
        if (attempt < CHECKOUT_VERIFY_POLL_ATTEMPTS - 1) {
            await sleep(CHECKOUT_VERIFY_POLL_INTERVAL_MS);
        }
    }
    return refreshPaymentRecord(paymentId);
}
async function verifyCheckoutReturn(clientId, input) {
    const payment = await resolvePaymentForCheckoutReturn(clientId, input);
    if (payment.status === "FUNDED" || payment.status === "RELEASED") {
        return payment;
    }
    return pollPaymentConfirmation(clientId, payment.id, input);
}
/** @deprecated Use pollPaymentConfirmation — never funds without Paymob proof. */
async function verifyOrSimulatePaymentSuccess(clientId, paymentId) {
    return pollPaymentConfirmation(clientId, paymentId);
}
async function refundEscrowPayment(clientId, paymentId) {
    const payment = await db_1.default.payment.findUnique({
        where: { id: paymentId },
        include: { project: { select: { title: true } } },
    });
    if (!payment)
        throw new ApiError_1.default(404, "Payment not found");
    if (payment.clientId !== clientId) {
        throw new ApiError_1.default(403, "Only the client can request a refund");
    }
    if (payment.status !== "FUNDED") {
        throw new ApiError_1.default(400, "Only funded escrow can be refunded");
    }
    // Cancel the project and mark payment refunded atomically
    const updated = await db_1.default.$transaction(async (tx) => {
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
    const engineerProfile = await db_1.default.engineerProfile.findUnique({
        where: { id: payment.engineerId },
        select: { userId: true },
    });
    const { createNotification } = await Promise.resolve().then(() => __importStar(require("../../utils/notifications")));
    if (engineerProfile) {
        await createNotification(engineerProfile.userId, "ESCROW_REFUNDED", "Payment refunded", `The client was refunded for "${payment.project.title}". The project has been cancelled.`, `/balance`);
    }
    return updated;
}
