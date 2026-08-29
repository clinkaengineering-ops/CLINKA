import { Resend } from "resend";
import ApiError from "../utils/ApiError";

type MailAddress = string | string[];

type MailAttachment = {
  filename?: string;
  content?: unknown;
  path?: string;
  cid?: string;
};

type MailHeaders = Record<string, string>;

type MailOptions = {
  from: string;
  to: MailAddress;
  subject: string;
  html?: string;
  text?: string;
  replyTo?: string;
  attachments?: MailAttachment[];
  headers?: MailHeaders;
};

const apiKey = process.env.RESEND_API_KEY;

// In production we want a hard failure if email is misconfigured.
if (process.env.NODE_ENV === "production" && !apiKey?.trim()) {
  throw new ApiError(
    500,
    "RESEND_API_KEY is required for transactional email in production",
  );
}

const resend = apiKey ? new Resend(apiKey) : null;

type SendMailResult = {
  /** Nodemailer compatibility fields used by the app */
  messageId: string | null;
  accepted: string[];
};

const transporter = {
  // Nodemailer-compatible check used by some code paths.
  async verify() {
    if (process.env.NODE_ENV === "production" && !apiKey?.trim()) {
      throw new ApiError(
        500,
        "RESEND_API_KEY is required for transactional email in production",
      );
    }
    return true;
  },

  // Nodemailer-compatible subset used across the app.
  async sendMail(options: MailOptions): Promise<SendMailResult> {
    if (!resend) {
      // In non-production environments, fail softly so local dev/tests can run
      // even when RESEND_API_KEY is missing.
      console.warn(
        "RESEND_API_KEY is not set — skipping email send to",
        options.to,
      );
      const accepted = Array.isArray(options.to) ? options.to : [options.to];
      return { messageId: null, accepted };
    }

    const to = Array.isArray(options.to) ? options.to : [options.to];

    // Resend typings are strict (html/text/template unions). We always send HTML when present
    // (it's what this app uses), and fall back to text-only otherwise.
    const payload: Record<string, unknown> = {
      from: options.from,
      to,
      subject: options.subject,
      replyTo: options.replyTo,
      headers: options.headers,
      attachments: options.attachments?.map((attachment) => ({
        filename: attachment.filename,
        content: attachment.content as Buffer | string | undefined,
        path: attachment.path,
        cid: attachment.cid,
      })),
    };

    if (options.html?.trim()) {
      payload.html = options.html;
    } else if (options.text?.trim()) {
      payload.text = options.text;
    } else {
      payload.text = "";
    }

    try {
      const { data, error } = await resend.emails.send(payload as any);

      if (error) {
        console.error("Email send failed (Resend API Error)", {
          sender: options.from,
          recipient: to,
          subject: options.subject,
          errorBody: error,
        });
        throw new ApiError(
          502,
          typeof error.message === "string"
            ? error.message
            : "Failed to send email via Resend",
        );
      }

      return { messageId: data?.id ?? null, accepted: to };
    } catch (err) {
      console.error("Email send failed (Exception)", {
        sender: options.from,
        recipient: to,
        subject: options.subject,
        error: err instanceof Error ? err.message : err,
      });
      throw err;
    }
  },
};

export default transporter;