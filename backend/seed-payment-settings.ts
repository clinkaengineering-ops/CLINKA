import prisma from './src/config/db';

async function main() {
  console.log('Seeding fake manual payment settings...');

  const settingsData = {
    bankTransfer: { enabled: true },
    instapay: { enabled: true },
    mobileWallet: { enabled: true },
    bankAccounts: [
      {
        id: "acc-bank-1",
        country: "EG",
        bankName: "Commercial International Bank (CIB)",
        accountHolder: "CLINKA LLC",
        accountNumber: "100023456789",
        iban: "EG12000300000000100023456789",
        swift: "CIBEEGCA",
        currency: "EGP",
        enabled: true
      },
      {
        id: "acc-bank-2",
        country: "SA",
        bankName: "Al Rajhi Bank",
        accountHolder: "CLINKA Company",
        accountNumber: "200034567890",
        iban: "SA1200000000200034567890",
        swift: "RJHI SARI",
        currency: "SAR",
        enabled: true
      }
    ],
    instapayAccounts: [
      {
        id: "acc-insta-1",
        account: "clinka@instapay",
        accountHolder: "CLINKA LLC",
        enabled: true
      }
    ],
    walletAccounts: [
      {
        id: "acc-wallet-1",
        provider: "Vodafone Cash",
        number: "01001234567",
        accountHolder: "CLINKA Payments",
        enabled: true
      }
    ],
    processingNotice: "Payments are manually verified during business hours (9 AM to 5 PM GMT). Please allow up to 24 hours for the verification to be completed. Make sure to upload a clear screenshot of the transaction receipt."
  };

  // Find or create PlatformSettings
  let platformSettings = await prisma.platformSettings.findFirst();

  if (!platformSettings) {
    platformSettings = await prisma.platformSettings.create({
      data: {
        manualPaymentSettings: settingsData
      }
    });
  } else {
    platformSettings = await prisma.platformSettings.update({
      where: { id: platformSettings.id },
      data: {
        manualPaymentSettings: settingsData
      }
    });
  }

  console.log('Successfully updated manualPaymentSettings!');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
