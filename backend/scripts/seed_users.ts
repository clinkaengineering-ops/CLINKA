import prisma from '../src/config/db';
import { Role, VerificationStatus, EngineerSpecialty, VerificationLevel } from '../src/generated/prisma/client';
import bcrypt from 'bcryptjs';

async function main() {
  const password = await bcrypt.hash('password123', 10);

  // 1. Create Admin
  const admin = await prisma.user.upsert({
    where: { email: 'admin@clinka.com' },
    update: {},
    create: {
      name: 'Admin User',
      email: 'admin@clinka.com',
      password: password,
      role: Role.ADMIN,
      isVerified: true,
    },
  });
  console.log('Admin created:', admin.email);

  // 2. Create Client
  const client = await prisma.user.upsert({
    where: { email: 'client@clinka.com' },
    update: {},
    create: {
      name: 'Client User',
      email: 'client@clinka.com',
      password: password,
      role: Role.CLIENT,
      isVerified: true,
    },
  });
  console.log('Client created:', client.email);

  // 3. Create Engineer (verified and accepted)
  const engineer = await prisma.user.upsert({
    where: { email: 'engineer@clinka.com' },
    update: {},
    create: {
      name: 'Engineer User',
      email: 'engineer@clinka.com',
      password: password,
      role: Role.ENGINEER,
      isVerified: true,
      profile: {
        create: {
          specialty: EngineerSpecialty.CIVIL,
          verificationStatus: VerificationStatus.APPROVED,
          verificationLevel: VerificationLevel.VERIFIED,
          bio: 'Experienced Civil Engineer',
          averageRating: 5,
          totalReviews: 1,
        },
      },
    },
  });
  console.log('Engineer created:', engineer.email);

  console.log('Seed completed successfully.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
