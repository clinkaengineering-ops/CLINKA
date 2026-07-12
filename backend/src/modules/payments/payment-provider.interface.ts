export interface PaymentIntentionResult {
  intentionId: string;
  clientSecret: string;
  checkoutUrl: string;
}

export interface ProjectData {
  id: number;
  title: string;
  client: { name: string; email: string };
}

export interface PaymentProvider {
  /**
   * Creates a payment intention (e.g. Paymob Intention, Stripe PaymentIntent).
   * @param amount The converted amount in the target currency (e.g., EGP amount).
   * @param currency The target currency code (e.g., "EGP").
   * @param project The project details for billing data.
   * @param paymentId The internal CLINKA payment ID.
   * @param phone The client's phone number.
   * @param address The client's address.
   * @param paymentMethodIds Optional array of payment method integration IDs.
   */
  createPaymentIntention(
    amount: number,
    currency: string,
    project: ProjectData,
    paymentId: number,
    phone: string,
    address: string,
    paymentMethodIds?: number[]
  ): Promise<PaymentIntentionResult>;
}
