"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getGoogleAuthRedirectUrl = getGoogleAuthRedirectUrl;
exports.handleGoogleCallback = handleGoogleCallback;
const crypto_1 = __importDefault(require("crypto"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = __importDefault(require("../../config/db"));
const ApiError_1 = __importDefault(require("../../utils/ApiError"));
const google_1 = require("../../config/google");
const generateToken_1 = __importDefault(require("../../utils/generateToken"));
const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://www.googleapis.com/oauth2/v2/userinfo";
function clientUrl(path) {
    const base = (process.env.CLIENT_URL ?? "http://localhost:3000").replace(/\/$/, "");
    return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
function signState(payload) {
    return jsonwebtoken_1.default.sign(payload, process.env.JWT_SECRET, { expiresIn: "10m" });
}
function verifyState(state) {
    return jsonwebtoken_1.default.verify(state, process.env.JWT_SECRET);
}
function getGoogleAuthRedirectUrl(options) {
    const config = (0, google_1.getGoogleClientConfig)();
    if (!config) {
        throw new ApiError_1.default(503, "Google sign-in is not configured");
    }
    const state = signState({
        nonce: crypto_1.default.randomBytes(16).toString("hex"),
        next: options?.next,
        role: options?.role ?? "CLIENT",
    });
    const params = new URLSearchParams({
        client_id: config.clientId,
        redirect_uri: config.redirectUri,
        response_type: "code",
        scope: "openid email profile",
        access_type: "online",
        prompt: "select_account",
        state,
    });
    return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}
async function exchangeCodeForProfile(code) {
    const config = (0, google_1.getGoogleClientConfig)();
    if (!config)
        throw new ApiError_1.default(503, "Google sign-in is not configured");
    const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
            code,
            client_id: config.clientId,
            client_secret: config.clientSecret,
            redirect_uri: config.redirectUri,
            grant_type: "authorization_code",
        }),
    });
    if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.warn("Google token exchange failed:", errText);
        throw new ApiError_1.default(400, "Google sign-in failed. Please try again.");
    }
    const tokens = (await tokenRes.json());
    if (!tokens.access_token) {
        throw new ApiError_1.default(400, "Google did not return an access token");
    }
    const profileRes = await fetch(GOOGLE_USERINFO_URL, {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!profileRes.ok) {
        throw new ApiError_1.default(400, "Could not load your Google profile");
    }
    const profile = (await profileRes.json());
    if (!profile.id || !profile.email) {
        throw new ApiError_1.default(400, "Google account is missing required profile data");
    }
    if (profile.verified_email === false) {
        throw new ApiError_1.default(400, "Please use a Google account with a verified email");
    }
    return profile;
}
async function randomPasswordHash() {
    return bcryptjs_1.default.hash(crypto_1.default.randomBytes(32).toString("hex"), 10);
}
async function findOrCreateGoogleUser(profile, role) {
    const email = profile.email.toLowerCase().trim();
    const name = profile.name?.trim() || email.split("@")[0];
    const avatarUrl = profile.picture ?? null;
    const byGoogle = await db_1.default.user.findUnique({ where: { googleId: profile.id } });
    if (byGoogle) {
        const updated = await db_1.default.user.update({
            where: { id: byGoogle.id },
            data: {
                isVerified: true,
                ...(avatarUrl && !byGoogle.avatarUrl ? { avatarUrl } : {}),
            },
        });
        const { password: _, ...safe } = updated;
        return safe;
    }
    const byEmail = await db_1.default.user.findUnique({ where: { email } });
    if (byEmail) {
        if (byEmail.googleId && byEmail.googleId !== profile.id) {
            throw new ApiError_1.default(400, "This email is linked to a different Google account. Sign in with email instead.");
        }
        const updated = await db_1.default.user.update({
            where: { id: byEmail.id },
            data: {
                googleId: profile.id,
                isVerified: true,
                ...(avatarUrl && !byEmail.avatarUrl ? { avatarUrl } : {}),
            },
        });
        const { password: _, ...safe } = updated;
        return safe;
    }
    const password = await randomPasswordHash();
    if (role === "ENGINEER") {
        const user = await db_1.default.user.create({
            data: {
                name,
                email,
                password,
                googleId: profile.id,
                role: "ENGINEER",
                isVerified: true,
                avatarUrl,
                profile: {
                    create: {
                        specialty: "CIVIL",
                        verificationStatus: "PENDING",
                    },
                },
            },
            include: { profile: true },
        });
        const { password: _, ...safe } = user;
        return safe;
    }
    const user = await db_1.default.user.create({
        data: {
            name,
            email,
            password,
            googleId: profile.id,
            role: "CLIENT",
            isVerified: true,
            avatarUrl,
        },
    });
    const { password: _, ...safe } = user;
    return safe;
}
async function handleGoogleCallback(code, stateParam, oauthError) {
    if (oauthError) {
        return {
            redirectUrl: clientUrl(`/auth/callback?error=${encodeURIComponent(oauthError)}`),
        };
    }
    if (!code || !stateParam) {
        return {
            redirectUrl: clientUrl(`/auth/callback?error=${encodeURIComponent("Missing Google authorization")}`),
        };
    }
    try {
        const state = verifyState(stateParam);
        const profile = await exchangeCodeForProfile(code);
        const role = state.role === "ENGINEER" ? "ENGINEER" : "CLIENT";
        const user = await findOrCreateGoogleUser(profile, role);
        const token = (0, generateToken_1.default)(user.id, user.role);
        let nextPath = state.next?.trim() || "";
        if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
            nextPath = user.role === "ADMIN" ? "/admin" : "/dashboard";
        }
        if (role === "ENGINEER") {
            const full = await db_1.default.user.findUnique({
                where: { id: user.id },
                include: { profile: true },
            });
            if (full?.profile?.verificationStatus === "PENDING") {
                nextPath = "/settings";
            }
        }
        const redirectUrl = clientUrl(`/auth/callback?success=1&next=${encodeURIComponent(nextPath)}`);
        return { redirectUrl, token };
    }
    catch (error) {
        const message = error instanceof ApiError_1.default
            ? error.message
            : error instanceof Error
                ? error.message
                : "Google sign-in failed";
        return {
            redirectUrl: clientUrl(`/auth/callback?error=${encodeURIComponent(message)}`),
        };
    }
}
