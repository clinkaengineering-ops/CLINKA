import { internationalWithdrawalSchema } from './src/modules/payments/payments.validation';
import { ZodError } from 'zod';

try {
  internationalWithdrawalSchema.parse({
    amount: 21,
    iban: 'DE89370400440532013000',
    accountHolderName: 'Account Holder Nam',
    bankName: 'Barcly',
    swiftBic: '8',
    country: 'Germany',
    bankAddress: 'hamburg'
  });
} catch (e) {
  if (e instanceof ZodError) {
    console.log("Zod Error Message:");
    console.log(e.message);
  }
}
