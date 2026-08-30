import prisma from './src/config/db';
async function main() { 
  const docs = await prisma.manualPaymentSubmission.findMany(); 
  docs.forEach(d => console.log(d.id, d.proofUrl?.substring(0, 50))); 
} 
main().finally(() => prisma.$disconnect());
