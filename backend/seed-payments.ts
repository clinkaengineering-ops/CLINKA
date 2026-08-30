import prisma from './src/config/db';

async function main() {
  console.log('Seeding fake manual payments...');

  // Find a client
  const client = await prisma.user.findFirst({ where: { role: 'CLIENT' } });
  // Find an engineer
  const engineer = await prisma.user.findFirst({ where: { role: 'ENGINEER' } });

  if (!client || !engineer) {
    console.log('Need at least one client and one engineer in the DB to seed payments.');
    return;
  }

  // Find or create a project
  let project = await prisma.project.findFirst({
    where: { clientId: client.id }
  });

  if (!project) {
    project = await prisma.project.create({
      data: {
        title: 'Test Project for Payments',
        description: 'A project to test the manual payment flow.',
        budget: 500,
        serviceType: 'DESIGN',
        clientId: client.id,
        status: 'OPEN',
      }
    });
    console.log('Created project', project.id);
  }

  // Create a payment record if it doesn't exist
  let payment = await prisma.payment.findUnique({ where: { projectId: project.id } });
  if (!payment) {
    payment = await prisma.payment.create({
      data: {
        projectId: project.id,
        clientId: client.id,
        engineerId: engineer.id,
        amountUsd: 500,
        commission: 40, // 8% fee
        status: 'PENDING',
      }
    });
    console.log('Created payment', payment.id);
  }

  // Delete existing manual payment submissions for this payment to avoid duplicates
  await prisma.manualPaymentSubmission.deleteMany({
    where: { paymentId: payment.id }
  });

  // Create fake manual payment submissions
  await prisma.manualPaymentSubmission.createMany({
    data: [
      {
        paymentId: payment.id,
        paymentMethod: 'bank_transfer',
        amount: 500,
        currency: 'USD',
        transactionReference: 'REF-BANK-' + Math.floor(Math.random() * 1000000),
        status: 'PENDING',
        proofUrl: 'https://placehold.co/600x400/png?text=Bank+Transfer+Receipt',
        proofOriginalName: 'bank_transfer_receipt.png',
        proofMimeType: 'image/png',
        proofFileSize: 1024 * 150, // 150kb
        
        // Snapshot data
        receivingMethod: 'bank_transfer',
        receivingCountry: 'US',
        receivingBankName: 'Chase Bank',
        receivingAccountName: 'CLINKA Inc.',
        receivingAccountNumber: '123456789',
        receivingSwift: 'CHASUS33',
        
        note: 'Sent via wire transfer yesterday.',
      },
      {
        paymentId: payment.id,
        paymentMethod: 'instapay',
        amount: 25000,
        currency: 'EGP',
        transactionReference: 'REF-INSTA-' + Math.floor(Math.random() * 1000000),
        status: 'VERIFIED',
        proofUrl: 'https://placehold.co/600x400/png?text=InstaPay+Screenshot',
        proofOriginalName: 'instapay.png',
        proofMimeType: 'image/png',
        proofFileSize: 1024 * 300,
        
        receivingMethod: 'instapay',
        receivingInstapayAccount: 'clinka@instapay',
        receivingAccountName: 'CLINKA',
        
        verifiedAt: new Date(),
        verifiedBy: client.id, // using client id just as a fallback valid user ID for testing
        adminNote: 'Verified amount in bank statement.',
      },
      {
        paymentId: payment.id,
        paymentMethod: 'ewallet',
        amount: 500,
        currency: 'USD',
        transactionReference: 'REF-WALLET-' + Math.floor(Math.random() * 1000000),
        status: 'REJECTED',
        proofUrl: 'https://placehold.co/600x400/png?text=Wallet+Screenshot',
        proofOriginalName: 'wallet.png',
        proofMimeType: 'image/png',
        proofFileSize: 1024 * 200,
        
        receivingMethod: 'ewallet',
        receivingWalletProvider: 'Vodafone Cash',
        receivingWalletNumber: '01000000000',
        receivingAccountName: 'CLINKA',
        
        verifiedAt: new Date(),
        verifiedBy: client.id,
        adminNote: 'Transaction reference not found in our records. Please verify and submit again.',
      }
    ]
  });

  console.log('Successfully inserted 3 fake manual payment submissions (PENDING, VERIFIED, REJECTED).');
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
