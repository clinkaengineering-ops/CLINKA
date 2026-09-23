import db from './src/config/db';
import { sendBrandedEmail } from './src/utils/sendEmail';
import { buildEmailHtml } from './src/utils/emailTemplate';

async function run() {
  const pendingEngineers = await db.user.findMany({
    where: {
      role: 'ENGINEER',
      profile: {
        verificationStatus: 'PENDING'
      }
    },
    include: {
      profile: true
    }
  });

  const toApprove = pendingEngineers.filter((u: any) => u.id !== '122d7312-c37f-40cc-be11-334dd578d4ab');

  console.log(`Found ${toApprove.length} engineers to approve.`);

  for (const user of toApprove) {
    if (!user.profile) continue;

    // 1. Update status
    await db.engineerProfile.update({
      where: { id: user.profile.id },
      data: { verificationStatus: 'APPROVED' }
    });

    console.log(`Updated ${user.email} to APPROVED.`);

    // 2. Send email
    const subject = "Welcome to Clinka! Your Engineer Account is Approved 🎉";
    const text = `Hi ${user.name},\n\nWe are thrilled to let you know that your Clinka engineer account has been approved!\n\nTo ensure you appear in search results and can start receiving project requests, please log in and add your portfolio to your profile as soon as possible. Profiles without portfolios may face visibility restrictions.\n\nBest regards,\nThe Clinka Team`;
    
    const html = buildEmailHtml({
      title: "Your Account is Approved! 🎉",
      preheader: "Your Clinka engineer account has been approved.",
      contentHtml: `
        <p style="margin:0 0 16px;color:#0f172a;">Hi <strong>${user.name}</strong>,</p>
        <p style="margin:0 0 16px;color:#0f172a;">
          We are thrilled to let you know that your Clinka engineer account has been <strong>approved</strong>!
        </p>
        <p style="margin:0 0 16px;color:#0f172a;">
          To ensure you appear in search results and can start receiving project requests, please log in and <strong>add your portfolio to your profile</strong> as soon as possible. 
        </p>
        <p style="margin:0 0 16px;color:#64748b;font-size:14px;">
          <em>Note: Profiles without a complete portfolio may face visibility restrictions or temporary suspension to maintain platform quality.</em>
        </p>
        <p style="margin:0;color:#0f172a;">
          We're excited to see what you build!
        </p>
      `,
      cta: {
        label: "Go to Dashboard",
        href: "https://clinkaeng.com/dashboard" // Using the main domain
      }
    });

    try {
      await sendBrandedEmail({
        to: user.email,
        subject,
        text,
        html
      });
      console.log(`Sent approval email to ${user.email}`);
    } catch (err) {
      console.error(`Failed to send email to ${user.email}`, err);
    }
  }

  console.log("Done updating and emailing.");
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
