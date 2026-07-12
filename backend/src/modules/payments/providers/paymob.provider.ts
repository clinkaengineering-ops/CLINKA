import { getPaymobConfig, buildPaymobCheckoutUrl } from "../../../config/paymob";
import { getClientUrl } from "../../../config/clientUrl";
import { createPaymobIntention } from "../paymob.api";
import type { PaymentProvider, PaymentIntentionResult, ProjectData } from "../payment-provider.interface";

function splitCustomerName(fullName: string): { first_name: string; last_name: string } {
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
  const apiUrl = (process.env.API_URL ?? `http://localhost:${process.env.PORT ?? 5000}`).replace(/\/$/, "");

  return {
    successUrl: `${clientUrl}/checkout?projectId=${projectId}&paymentId=${paymentId}&status=success`,
    failUrl: `${clientUrl}/checkout?projectId=${projectId}&paymentId=${paymentId}&status=fail`,
    pendingUrl: `${clientUrl}/checkout?projectId=${projectId}&paymentId=${paymentId}&status=pending`,
    webhookUrl: `${apiUrl}/api/payments/webhook/paymob`,
  };
}

function paymobPaymentReferenceBase(paymentId: number) {
  return `clinka-payment-${paymentId}`;
}

function paymobCheckoutSpecialReference(paymentId: number) {
  return `${paymobPaymentReferenceBase(paymentId)}-${Date.now()}`;
}

export class PaymobProvider implements PaymentProvider {
  async createPaymentIntention(
    amount: number,
    currency: string,
    project: ProjectData,
    paymentId: number,
    phone: string,
    address: string,
    paymentMethodIds?: number[]
  ): Promise<PaymentIntentionResult> {
    const config = getPaymobConfig();
    const { first_name, last_name } = splitCustomerName(project.client.name);
    const redirectionUrls = getRedirectionUrls(project.id, paymentId);
    
    // Convert to minor units (e.g., Cents/Piasters)
    const amountCents = Math.round(amount * 100);

    const intention = await createPaymobIntention({
      amountCents,
      currency: currency || config.currency,
      paymentMethods: paymentMethodIds?.length ? paymentMethodIds : config.integrationIds,
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
      specialReference: paymobCheckoutSpecialReference(paymentId),
      notificationUrl: redirectionUrls.webhookUrl,
      redirectionUrl: redirectionUrls.successUrl,
      extras: {
        projectId: project.id,
        paymentId: paymentId,
      },
    });

    return {
      intentionId: intention.clientSecret, // Used by some legacy logic or mapped directly
      clientSecret: intention.clientSecret,
      checkoutUrl: buildPaymobCheckoutUrl(config, intention.clientSecret),
    };
  }
}
