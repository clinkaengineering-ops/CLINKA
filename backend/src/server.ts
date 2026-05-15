import dotenv from "dotenv";
dotenv.config();
import app from "./app"
import db from "./config/db";
import transporter from "./config/mailer";


const PORT = Number(process.env.PORT) || 5000;

app.listen(PORT, async () => {
  console.log(`🚀 Server is running on port ${PORT}`);

  await db.$connect()
  console.log("✅ Database connected successfully");

  try {
    await transporter.verify();
    console.log("✅ SMTP transporter is ready");
  } catch (error) {
    console.error(
      "❌ SMTP transporter failed:",
      error instanceof Error ? error.message : error,
    );
  }
});