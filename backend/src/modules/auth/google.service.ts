import crypto from "crypto";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import db from "../../config/db";
import ApiError from "../../utils/ApiError";
import { getGoogleClientConfig, getGoogleRedirectUri } from "../../config/google";
import generateToken from "../../utils/generateToken";

const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";
const GOOGLE_USERINFO_URL = "https://oauth2.googleapis.com/oauth2/v2/userinfo";

type GoogleState = {
  nonce: string;
  next?: string;
  role?: "CLIENT" | "ENGINEER";
  redirectUri: string;
  clientOrigin?: string;
};

type GoogleProfile = {
  id: string;
  email: string;
  verified_email?: boolean;
  name?: string;
  picture?: string;
};

function normalizeOrigin(origin: string): string {
  return origin.replace(/\/$/, "");
}

function clientUrl(path: string, origin?: string): string {
  const base = normalizeOrigin(
    origin ?? process.env.CLIENT_URL ?? "http://localhost:3000",
  );
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}

export function resolveGoogleRedirectUri(apiOrigin?: string): string {
  const explicit = process.env.GOOGLE_REDIRECT_URI?.trim();
  if (explicit && !apiOrigin) return explicit;

  if (apiOrigin) {
    return `${normalizeOrigin(apiOrigin)}/api/auth/google/callback`;
  }

  return getGoogleRedirectUri();
}

function signState(payload: GoogleState): string {
  return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "10m" });
}

function verifyState(state: string): GoogleState {
  return jwt.verify(state, process.env.JWT_SECRET as string) as GoogleState;
}

export function getGoogleAuthRedirectUrl(options?: {
  next?: string;
  role?: "CLIENT" | "ENGINEER";
  apiOrigin?: string;
  clientOrigin?: string;
}): string {
  const config = getGoogleClientConfig();
  if (!config) {
    throw new ApiError(503, "Google sign-in is not configured");
  }

  const redirectUri = resolveGoogleRedirectUri(options?.apiOrigin);

  const state = signState({
    nonce: crypto.randomBytes(16).toString("hex"),
    next: options?.next,
    role: options?.role ?? "CLIENT",
    redirectUri,
    clientOrigin: options?.clientOrigin
      ? normalizeOrigin(options.clientOrigin)
      : undefined,
  });

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "online",
    prompt: "select_account",
    state,
  });

  return `${GOOGLE_AUTH_URL}?${params.toString()}`;
}

async function exchangeCodeForProfile(
  code: string,
  redirectUri: string,
): Promise<GoogleProfile> {
  const config = getGoogleClientConfig();
  if (!config) throw new ApiError(503, "Google sign-in is not configured");

  const tokenRes = await fetch(GOOGLE_TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: config.clientId,
      client_secret: config.clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.warn("Google token exchange failed:", errText);
    throw new ApiError(400, "Google sign-in failed. Please try again.");
  }

  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) {
    throw new ApiError(400, "Google did not return an access token");
  }

  const profileRes = await fetch(GOOGLE_USERINFO_URL, {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });

  if (!profileRes.ok) {
    throw new ApiError(400, "Could not load your Google profile");
  }

  const profile = (await profileRes.json()) as GoogleProfile;
  if (!profile.id || !profile.email) {
    throw new ApiError(400, "Google account is missing required profile data");
  }

  if (profile.verified_email === false) {
    throw new ApiError(400, "Please use a Google account with a verified email");
  }

  return profile;
}

async function randomPasswordHash(): Promise<string> {
  return bcrypt.hash(crypto.randomBytes(32).toString("hex"), 10);
}

async function findOrCreateGoogleUser(
  profile: GoogleProfile,
  role: "CLIENT" | "ENGINEER",
) {
  const email = profile.email.toLowerCase().trim();
  const name = profile.name?.trim() || email.split("@")[0];
  const avatarUrl = profile.picture ?? null;

  const byGoogle = await db.user.findUnique({ where: { googleId: profile.id } });
  if (byGoogle) {
    const updated = await db.user.update({
      where: { id: byGoogle.id },
      data: {
        isVerified: true,
        ...(avatarUrl && !byGoogle.avatarUrl ? { avatarUrl } : {}),
      },
    });
    const { password: _, ...safe } = updated;
    return safe;
  }

  const byEmail = await db.user.findUnique({ where: { email } });
  if (byEmail) {
    if (byEmail.googleId && byEmail.googleId !== profile.id) {
      throw new ApiError(
        400,
        "This email is linked to a different Google account. Sign in with email instead.",
      );
    }

    const updated = await db.user.update({
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
    const user = await db.user.create({
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

  const user = await db.user.create({
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

export async function handleGoogleCallback(
  code: string | undefined,
  stateParam: string | undefined,
  oauthError: string | undefined,
): Promise<{ redirectUrl: string; token?: string }> {
  if (oauthError) {
    return {
      redirectUrl: clientUrl(
        `/auth/callback?error=${encodeURIComponent(oauthError)}`,
      ),
    };
  }

  if (!code || !stateParam) {
    return {
      redirectUrl: clientUrl(
        `/auth/callback?error=${encodeURIComponent("Missing Google authorization")}`,
      ),
    };
  }

  try {
    const state = verifyState(stateParam);
    const profile = await exchangeCodeForProfile(code, state.redirectUri);
    const role = state.role === "ENGINEER" ? "ENGINEER" : "CLIENT";
    const user = await findOrCreateGoogleUser(profile, role);
    const token = generateToken(user.id, user.role);

    let nextPath = state.next?.trim() || "";
    if (!nextPath.startsWith("/") || nextPath.startsWith("//")) {
      nextPath = user.role === "ADMIN" ? "/admin" : "/dashboard";
    }
    if (role === "ENGINEER") {
      const full = await db.user.findUnique({
        where: { id: user.id },
        include: { profile: true },
      });
      if (full?.profile?.verificationStatus === "PENDING") {
        nextPath = "/settings";
      }
    }

    const redirectUrl = clientUrl(
      `/auth/callback?success=1&next=${encodeURIComponent(nextPath)}`,
      state.clientOrigin,
    );
    return { redirectUrl, token };
  } catch (error) {
    const message =
      error instanceof ApiError
        ? error.message
        : error instanceof Error
          ? error.message
          : "Google sign-in failed";
    return {
      redirectUrl: clientUrl(`/auth/callback?error=${encodeURIComponent(message)}`),
    };
  }
}
