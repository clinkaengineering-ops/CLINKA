import { paymobPayoutWebhookSchema } from './payout.validation';

describe('paymobPayoutWebhookSchema', () => {
  it('accepts a full webhook payload', () => {
    const result = paymobPayoutWebhookSchema.safeParse({
      transaction_id: '12345',
      client_reference: 'ref-001',
      amount: '500.00',
      disbursement_status: 'success',
      status: 'complete',
    });
    expect(result.success).toBe(true);
  });

  it('accepts numeric transaction_id and amount', () => {
    const result = paymobPayoutWebhookSchema.safeParse({
      transaction_id: 12345,
      amount: 500,
    });
    expect(result.success).toBe(true);
  });

  it('accepts an empty object (all fields optional)', () => {
    const result = paymobPayoutWebhookSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it('passes through unknown fields', () => {
    const result = paymobPayoutWebhookSchema.safeParse({
      unknown_field: 'value',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect((result.data as any).unknown_field).toBe('value');
    }
  });

  it('accepts status_description as string or object', () => {
    expect(paymobPayoutWebhookSchema.safeParse({ status_description: 'OK' }).success).toBe(true);
    expect(paymobPayoutWebhookSchema.safeParse({ status_description: { detail: 'fail' } }).success).toBe(true);
  });
});
