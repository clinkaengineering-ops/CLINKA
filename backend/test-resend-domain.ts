import { Resend } from "resend";
import dotenv from "dotenv";

dotenv.config({ path: ".env" });

const apiKey = process.env.RESEND_API_KEY;
const resend = new Resend(apiKey);

async function test() {
  const from = "noreply@clinkaeng.com";
  const { data, error } = await resend.emails.send({
    from: `CLINKA <${from}>`,
    to: "test.user.1234@gmail.com",
    subject: "Test Domain",
    html: "<p>Test</p>",
  });

  if (error) {
    console.error("Error with domain clinkaeng.com:", error);
  } else {
    console.log("Success with domain clinkaeng.com:", data);
  }
}

test();
