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

/** Resend free/default limit is 10 req/sec — stay under it with headroom. */
const MIN_SEND_INTERVAL_MS = 120;
const MAX_SEND_ATTEMPTS = 4;

let lastSendAt = 0;
let sendQueue: Promise<unknown> = Promise.resolve();

function sleep(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

function isRateLimitError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const e = err as {
    statusCode?: number;
    status?: number;
    name?: string;
    message?: string;
  };
  if (e.statusCode === 429 || e.status === 429) return true;
  if (e.name === "rate_limit_exceeded") return true;
  if (typeof e.message === "string" && /rate limit|too many requests/i.test(e.message)) {
    return true;
  }
  return false;
}

/**
 * Serialize outbound Resend calls and space them so concurrent notification
 * blasts (e.g. NEW_PROJECT_POSTED) do not hit the 10 req/sec API cap.
 */
function enqueueSend<T>(fn: () => Promise<T>): Promise<T> {
  const run = async () => {
    const wait = Math.max(0, lastSendAt + MIN_SEND_INTERVAL_MS - Date.now());
    if (wait > 0) await sleep(wait);
    lastSendAt = Date.now();
    return fn();
  };

  const result = sendQueue.then(run, run) as Promise<T>;
  sendQueue = result.then(
    () => undefined,
    () => undefined,
  );
  return result;
}

async function sendViaResend(
  options: MailOptions,
  to: string[],
): Promise<SendMailResult> {
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

  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_SEND_ATTEMPTS; attempt++) {
    try {
      const { data, error } = await resend!.emails.send(payload as any);

      if (error) {
        if (isRateLimitError(error) && attempt < MAX_SEND_ATTEMPTS) {
          const backoff = attempt * 500;
          console.warn(
            `Resend rate limited — retrying in ${backoff}ms (attempt ${attempt}/${MAX_SEND_ATTEMPTS})`,
            { recipient: to, subject: options.subject },
          );
          await sleep(backoff);
          continue;
        }

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
      lastError = err;
      if (isRateLimitError(err) && attempt < MAX_SEND_ATTEMPTS) {
        const backoff = attempt * 500;
        console.warn(
          `Resend rate limited — retrying in ${backoff}ms (attempt ${attempt}/${MAX_SEND_ATTEMPTS})`,
          { recipient: to, subject: options.subject },
        );
        await sleep(backoff);
        continue;
      }

      console.error("Email send failed (Exception)", {
        sender: options.from,
        recipient: to,
        subject: options.subject,
        error: err instanceof Error ? err.message : err,
      });
      throw err;
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new ApiError(502, "Failed to send email via Resend");
}

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
    return enqueueSend(() => sendViaResend(options, to));
  },
};

export default transporter;