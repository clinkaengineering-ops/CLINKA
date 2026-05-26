import db from "../../config/db";
import { getFawaterkConfig } from "../../config/fawaterk";
import {
  DEV_PAYMENT_METHODS,
  useFawaterkDevFallback,
} from "../../config/fawaterk.dev";
import ApiError from "../../utils/ApiError";
import {
  getFawaterkPaymentMethods,
  initiateFawaterkPayment,
} from "./fawaterk.api";
import {
  verifyExpiredWebhookHash,
  verifyPaidWebhookHash,
} from "./fawaterk.webhook";
import { buildIframeHashKey } from "./fawaterk.hashkey";
import {
  expiredWebhookSchema,
  InitiateCheckoutInput,
  paidWebhookSchema,
} from "./payments.validation";

function parsePayLoad(
  raw: unknown,
): { projectId?: number; paymentId?: number } | null {
  if (raw == null) return null;
  let obj: unknown = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (typeof obj !== "object" || obj === null) return null;
  const o = obj as Record<string, unknown>;
  return {
    projectId: o.projectId != null ? Number(o.projectId) : undefined,
    paymentId: o.paymentId != null ? Number(o.paymentId) : undefined,
  };
}

let fawaterkFallbackLogged = false;

function logFawaterkFallbackOnce(message: string) {
  if (fawaterkFallbackLogged) return;
  fawaterkFallbackLogged = true;
  console.warn(
    `[payments] ${message} — using dev payment methods (Visa, Fawry, Meeza). ` +
      "Enable payment methods in your Fawaterak dashboard or contact Fawaterak support if the list stays empty.",
  );
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

function getRedirectionUrls() {
  const clientUrl = (process.env.CLIENT_URL ?? "http://localhost:3000").replace(
    /\/$/,
    "",
  );
  const apiUrl = (
    process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 5000}`
  ).replace(/\/$/, "");

  return {
    successUrl: `${clientUrl}/escrow?status=success`,
    failUrl: `${clientUrl}/escrow?status=fail`,
    pendingUrl: `${clientUrl}/escrow?status=pending`,
    webhookUrl: `${apiUrl}/api/payments/webhook_json`,
  };
}

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
  if (!process.env.FAWATERK_API_TOKEN?.trim()) {
    if (useFawaterkDevFallback()) {
      logFawaterkFallbackOnce("FAWATERK_API_TOKEN missing");
      return DEV_PAYMENT_METHODS;
    }
    throw new ApiError(
      503,
      "Payment gateway is not configured (FAWATERK_API_TOKEN)",
    );
  }

  try {
    const methods = await getFawaterkPaymentMethods();
    if (methods.length > 0) return methods;
    if (useFawaterkDevFallback()) {
      logFawaterkFallbackOnce(
        "Fawaterk API returned success but zero payment methods for this vendor",
      );
      return DEV_PAYMENT_METHODS;
    }
    return methods;
  } catch (error) {
    if (useFawaterkDevFallback()) {
      const detail =
        error instanceof ApiError ? error.message : "Fawaterk unavailable";
      logFawaterkFallbackOnce(`Fawaterk error: ${detail}`);
      return DEV_PAYMENT_METHODS;
    }
    throw error;
  }
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
  const engineerUserId = bid.engineer.user.id;
  const config = getFawaterkConfig();
  const amount = bid.price;
  const commission = Math.round(amount * config.commissionRate * 100) / 100;
  const { first_name, last_name } = splitCustomerName(project.client.name);

  const payment =
    project.payment ??
    (await db.payment.create({
      data: {
        projectId,
        clientId,
        engineerId: engineerUserId,
        amount,
        commission,
        status: "PENDING",
      },
    }));

  const redirectionUrls = getRedirectionUrls();
  const fawaterkData = await initiateFawaterkPayment({
    payment_method_id: input.paymentMethodId,
    cartTotal: String(amount),
    currency: config.currency,
    customer: {
      first_name,
      last_name,
      email: project.client.email,
      phone: input.phone ?? "01000000000",
      address: input.address ?? "N/A",
    },
    redirectionUrls,
    cartItems: [
      {
        name: project.title.slice(0, 100),
        price: String(amount),
        quantity: "1",
      },
    ],
    payLoad: {
      projectId,
      paymentId: payment.id,
    },
  });

  const updatedPayment = await db.payment.update({
    where: { id: payment.id },
    data: {
      gatewayInvoiceId: String(fawaterkData.invoice_id),
      gatewayInvoiceKey: fawaterkData.invoice_key,
      status: "PENDING",
    },
  });

  return {
    payment: updatedPayment,
    invoiceId: fawaterkData.invoice_id,
    invoiceKey: fawaterkData.invoice_key,
    paymentData: fawaterkData.payment_data,
  };
}

/** Prepare Fawaterak IFrame checkout — creates pending payment + plugin config */
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

  const iframe = buildIframeHashKey();
  if (!iframe) {
    throw new ApiError(
      503,
      "Payment gateway is not configured (FAWATERK_VENDOR_KEY / FAWATERK_PROVIDER_KEY missing)",
    );
  }

  const bid = await getAcceptedBidForProject(projectId);
  const engineerUserId = bid.engineer.user.id;
  const config = getFawaterkConfig();
  const amount = bid.price;
  const commission = Math.round(amount * config.commissionRate * 100) / 100;
  const { first_name, last_name } = splitCustomerName(project.client.name);

  const payment =
    project.payment ??
    (await db.payment.create({
      data: {
        projectId,
        clientId,
        engineerId: engineerUserId,
        amount,
        commission,
        status: "PENDING",
      },
    }));

  const redirectionUrls = getRedirectionUrls();

  return {
    hashKey: iframe.hashKey,
    envType: iframe.envType,
    currency: config.currency,
    projectId,
    projectTitle: project.title,
    paymentId: payment.id,
    amount,
    pluginRequest: {
      cartTotal: String(amount),
      currency: config.currency,
      customer: {
        first_name,
        last_name,
        email: project.client.email,
        phone: phone ?? "01000000000",
        address: address ?? "N/A",
      },
      redirectionUrls: {
        successUrl: redirectionUrls.successUrl,
        failUrl: redirectionUrls.failUrl,
        pendingUrl: redirectionUrls.pendingUrl,
      },
      cartItems: [
        {
          name: project.title.slice(0, 100),
          price: String(amount),
          quantity: "1",
        },
      ],
      payLoad: {
        projectId,
        paymentId: payment.id,
      },
    },
  };
}

export async function handleFawaterkWebhook(body: unknown) {
  const config = getFawaterkConfig();

  const paidParse = paidWebhookSchema.safeParse(body);
  if (paidParse.success && paidParse.data.invoice_status === "paid") {
    const payload = paidParse.data;

    const valid = verifyPaidWebhookHash(
      payload.invoice_id,
      payload.invoice_key,
      payload.payment_method,
      payload.hashKey,
      config.vendorKey,
    );
    if (!valid) {
      throw new ApiError(401, "Invalid webhook signature");
    }

    let payment = await db.payment.findFirst({
      where: {
        OR: [
          { gatewayInvoiceKey: payload.invoice_key },
          { gatewayInvoiceId: String(payload.invoice_id) },
        ],
      },
    });

    if (!payment) {
      const pl = parsePayLoad(payload.pay_load);
      if (pl?.paymentId) {
        payment = await db.payment.findUnique({ where: { id: pl.paymentId } });
      }
    }

    if (!payment) {
      throw new ApiError(404, "Payment record not found for this invoice");
    }

    const updated = await db.payment.update({
      where: { id: payment.id },
      data: {
        status: "FUNDED",
        gatewayInvoiceId: String(payload.invoice_id),
        gatewayInvoiceKey: payload.invoice_key,
      },
      include: { project: { select: { title: true } } },
    });

    const { createNotification } = await import("../../utils/notifications");
    await createNotification(
      updated.engineerId,
      "ESCROW_FUNDED",
      "Escrow funded",
      `The client funded escrow for "${updated.project.title}". You can start work.`,
      `/messages?project=${updated.projectId}`,
    );

    return { handled: true, type: "paid", paymentId: payment.id };
  }

  const expiredParse = expiredWebhookSchema.safeParse(body);
  if (expiredParse.success && expiredParse.data.status === "EXPIRED") {
    const payload = expiredParse.data;

    const valid = verifyExpiredWebhookHash(
      payload.referenceId,
      payload.paymentMethod,
      payload.hashKey,
      config.vendorKey,
    );
    if (!valid) {
      throw new ApiError(401, "Invalid webhook signature");
    }

    if (payload.transactionKey) {
      const payment = await db.payment.findFirst({
        where: { gatewayInvoiceKey: payload.transactionKey },
      });
      if (payment && payment.status === "PENDING") {
        await db.payment.update({
          where: { id: payment.id },
          data: {
            gatewayInvoiceId: null,
            gatewayInvoiceKey: null,
          },
        });
      }
    }

    return { handled: true, type: "expired" };
  }

  return { handled: false };
}

export async function listEngineerEscrow(engineerUserId: number) {
  const payments = await db.payment.findMany({
    where: { engineerId: engineerUserId },
    include: {
      project: { select: { id: true, title: true, status: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  return payments.map((payment) => ({
    id: payment.id,
    projectId: payment.projectId,
    projectTitle: payment.project.title,
    amount: payment.amount,
    commission: payment.commission,
    status: mapPaymentStatusToEscrow(payment.status),
    createdAt: payment.createdAt,
    updatedAt: payment.updatedAt,
  }));
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
  if (payment.project.status !== "AWAITING_APPROVAL") {
    throw new ApiError(
      400,
      "The engineer must mark the project as finished before you can release payment",
    );
  }

  const projectTitle = payment.project?.title ?? "Project";

  const updated = await db.$transaction(async (tx) => {
    const released = await tx.payment.update({
      where: { id: paymentId },
      data: { status: "RELEASED" },
    });
    await tx.project.update({
      where: { id: payment.projectId },
      data: { status: "COMPLETED" },
    });
    return released;
  });

  const { createNotification } = await import("../../utils/notifications");
  await createNotification(
    payment.engineerId,
    "FUNDS_RELEASED",
    "Funds released",
    `Escrow for "${projectTitle}" was released to you`,
    `/escrow`,
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

export async function refundEscrowPayment(clientId: number, paymentId: number) {
  const payment = await db.payment.findUnique({
    where: { id: paymentId },
  });
  if (!payment) throw new ApiError(404, "Payment not found");
  if (payment.clientId !== clientId) {
    throw new ApiError(403, "Only the client can request a refund");
  }
  if (payment.status !== "FUNDED") {
    throw new ApiError(400, "Only funded escrow can be refunded");
  }

  return db.payment.update({
    where: { id: paymentId },
    data: { status: "REFUNDED" },
  });
}
