"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendBrandedEmail = sendBrandedEmail;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const mailer_1 = __importDefault(require("../config/mailer"));
const emailTemplate_1 = require("./emailTemplate");
let logoBuffer = null;
function resolveLogoPath() {
    const candidates = [
        process.env.EMAIL_LOGO_PATH,
        path_1.default.resolve(process.cwd(), "assets/email-logo.png"),
        path_1.default.resolve(__dirname, "../../assets/email-logo.png"),
    ].filter((value) => Boolean(value));
    for (const candidate of candidates) {
        if (fs_1.default.existsSync(candidate))
            return candidate;
    }
    return null;
}
async function getLogoAttachment() {
    if (!logoBuffer) {
        const logoPath = resolveLogoPath();
        if (!logoPath) {
            return null;
        }
        logoBuffer = fs_1.default.readFileSync(logoPath);
    }
    return {
        filename: "clinka-logo.png",
        content: logoBuffer,
        cid: emailTemplate_1.EMAIL_LOGO_CID,
    };
}
async function sendBrandedEmail(options) {
    const replyTo = process.env.SUPPORT_EMAIL?.trim() || process.env.EMAIL_USER?.trim();
    const logoAttachment = await getLogoAttachment();
    const html = logoAttachment
        ? options.html.split((0, emailTemplate_1.getLogoUrl)()).join(`cid:${emailTemplate_1.EMAIL_LOGO_CID}`)
        : options.html;
    await mailer_1.default.sendMail({
        from: (0, emailTemplate_1.getEmailFrom)(),
        to: options.to,
        replyTo: replyTo || undefined,
        subject: options.subject,
        html,
        text: options.text,
        attachments: logoAttachment ? [logoAttachment] : undefined,
        headers: {
            "X-Auto-Response-Suppress": "All",
            "X-Entity-Ref-ID": `clinka-${Date.now()}`,
        },
    });
}
