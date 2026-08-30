import prisma from './src/config/db';

async function main() {
  const dummyImage = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";
  
  await prisma.manualPaymentSubmission.updateMany({
    data: {
      proofUrl: dummyImage,
    }
  });

  console.log('Fixed proofUrl images to base64 dummy');
}

main().finally(() => prisma.$disconnect());
