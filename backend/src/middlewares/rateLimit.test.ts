import assert from "node:assert/strict";
import { describe, it, afterEach } from "node:test";
import type { Request, RequestHandler, Response } from "express";
import type { Router } from "express";
import ApiError from "../utils/ApiError";
import { adminRateLimit } from "./adminRateLimit";
import { payoutRateLimit } from "./payoutRateLimit";
import {
  T1_LOGIN_MAX,
  T1_OTP_MAX,
  T1_REGISTER_MAX,
  T2_MAX,
  T3_MAX,
  T4_MAX,
  T5_MAX,
  loginRateLimiter,
  otpRateLimiter,
  t1RegisterIpLimiter,
  t2AccountRateLimit,
  t2IpRateLimiter,
  t3IpRateLimiter,
  t4AccountRateLimit,
  t5PublicListingLimiter,
  manualSubmitRateLimiter,
  isRateLimitDisabled,
} from "./rateLimit";
import authRouter from "../modules/auth/auth.routes";
import adminRouter from "../modules/admin/admin.routes";
import adminFinanceRouter from "../modules/admin/admin.finance.routes";
import disputesRouter from "../modules/disputes/disputes.routes";
import paymentsRouter from "../modules/payments/payments.routes";
import manualPaymentRouter from "../modules/payments/manual-payment.routes";
import projectRouter from "../modules/projects/project.routes";
import messagesRouter from "../modules/messages/messages.routes";
import userRouter from "../modules/users/user.routes";
import notificationsRouter from "../modules/notifications/notifications.routes";

type Case = {
  name: string;
  router: Router;
  method: string;
  path: string;
  limiter: RequestHandler;
  max: number;
  alsoWired?: RequestHandler[];
};

function routeHandlers(router: Router, method: string, path: string): RequestHandler[] {
  const stack = (router as unknown as { stack: Array<{
    handle: RequestHandler;
    route?: { path: string; methods: Record<string, boolean>; stack: Array<{ handle: RequestHandler }> };
  }> }).stack;

  const handlers: RequestHandler[] = [];
  const methodLower = method.toLowerCase();

  for (const layer of stack) {
    if (!layer.route) {
      handlers.push(layer.handle);
      continue;
    }
    if (layer.route.path === path && layer.route.methods[methodLower]) {
      for (const hop of layer.route.stack) {
        handlers.push(hop.handle);
      }
    }
  }
  return handlers;
}

async function dispatch(handler: RequestHandler, req: Partial<Request> & { user?: { userId: number; role: string } }) {
  const headers: Record<string, string> = {};
  let status = 200;
  let body: unknown;
  const res = {
    setHeader(key: string, value: string) {
      headers[key.toLowerCase()] = String(value);
      return res;
    },
    getHeader(key: string) {
      return headers[key.toLowerCase()];
    },
    status(code: number) {
      status = code;
      return res;
    },
    json(payload: unknown) {
      body = payload;
      return res;
    },
  } as unknown as Response;

  const request = {
    ip: "127.0.0.1",
    method: "POST",
    url: "/",
    originalUrl: "/",
    body: {},
    headers: {},
    socket: { remoteAddress: "127.0.0.1" },
    get(name: string) {
      return name.toLowerCase() === "user-agent" ? "rate-limit-test" : undefined;
    },
    ...req,
  } as Request;

  return new Promise<{
    status: number;
    headers: Record<string, string>;
    body: unknown;
    error: unknown;
    nextCalled: boolean;
  }>((resolve) => {
    let settled = false;
    const finish = (error: unknown, nextCalled: boolean) => {
      if (settled) return;
      settled = true;
      resolve({ status, headers, body, error, nextCalled });
    };
    const origJson = res.json.bind(res);
    (res as unknown as { json: (payload: unknown) => Response }).json = (payload: unknown) => {
      origJson(payload);
      finish(undefined, false);
      return res;
    };
    handler(request, res, (err?: unknown) => finish(err, true));
  });
}

function is429(result: { status: number; error: unknown }): boolean {
  if (result.status === 429) return true;
  return result.error instanceof ApiError && result.error.statusCode === 429;
}

async function exceedLimit(limiter: RequestHandler, max: number, base: Partial<Request> & { user?: { userId: number; role: string } }) {
  for (let i = 0; i < max; i += 1) {
    const allowed = await dispatch(limiter, base);
    assert.equal(is429(allowed), false, `request ${i + 1} of ${max} should be under the limit`);
    if (allowed.nextCalled && allowed.error) {
      throw allowed.error;
    }
  }
  const blocked = await dispatch(limiter, base);
  assert.equal(is429(blocked), true, "expected 429 after exceeding the limit");
  assert.ok(blocked.headers["retry-after"], "expected Retry-After header");
  return blocked;
}

const t1t2Cases: Case[] = [
  { name: "POST /api/auth/login", router: authRouter, method: "post", path: "/login", limiter: loginRateLimiter, max: T1_LOGIN_MAX, alsoWired: [loginRateLimiter] },
  { name: "POST /api/auth/forgot-password", router: authRouter, method: "post", path: "/forgot-password", limiter: otpRateLimiter, max: T1_OTP_MAX },
  { name: "POST /api/auth/resend-verification", router: authRouter, method: "post", path: "/resend-verification", limiter: otpRateLimiter, max: T1_OTP_MAX },
  { name: "POST /api/auth/verify-otp", router: authRouter, method: "post", path: "/verify-otp", limiter: otpRateLimiter, max: T1_OTP_MAX },
  { name: "POST /api/auth/register/client", router: authRouter, method: "post", path: "/register/client", limiter: t1RegisterIpLimiter, max: T1_REGISTER_MAX },
  { name: "POST /api/auth/register/engineer", router: authRouter, method: "post", path: "/register/engineer", limiter: t1RegisterIpLimiter, max: T1_REGISTER_MAX },
  { name: "POST /api/auth/register/engineer/resume", router: authRouter, method: "post", path: "/register/engineer/resume", limiter: t1RegisterIpLimiter, max: T1_REGISTER_MAX },
  { name: "POST /api/auth/apply-engineer", router: authRouter, method: "post", path: "/apply-engineer", limiter: t1RegisterIpLimiter, max: T1_REGISTER_MAX },
  { name: "POST /api/auth/register/engineer/google-complete", router: authRouter, method: "post", path: "/register/engineer/google-complete", limiter: t1RegisterIpLimiter, max: T1_REGISTER_MAX },
  { name: "POST /api/auth/reset-password", router: authRouter, method: "post", path: "/reset-password", limiter: t1RegisterIpLimiter, max: T1_REGISTER_MAX },
  { name: "POST /api/auth/request-email-change", router: authRouter, method: "post", path: "/request-email-change", limiter: otpRateLimiter, max: T1_OTP_MAX },
  { name: "POST /api/auth/confirm-email-change", router: authRouter, method: "post", path: "/confirm-email-change", limiter: otpRateLimiter, max: T1_OTP_MAX },
  { name: "POST /api/auth/google/complete-registration", router: authRouter, method: "post", path: "/google/complete-registration", limiter: t1RegisterIpLimiter, max: T1_REGISTER_MAX },

  { name: "POST /api/disputes/open", router: disputesRouter, method: "post", path: "/open", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [t2AccountRateLimit] },
  { name: "POST /api/disputes/escalate", router: disputesRouter, method: "post", path: "/escalate", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [t2AccountRateLimit] },
  { name: "POST /api/disputes/resolve", router: disputesRouter, method: "post", path: "/resolve", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [adminRateLimit, t2AccountRateLimit] },
  { name: "POST /api/disputes/manual-freeze", router: disputesRouter, method: "post", path: "/manual-freeze", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [adminRateLimit, t2AccountRateLimit] },

  { name: "POST /api/payments/:paymentId/release", router: paymentsRouter, method: "post", path: "/:paymentId/release", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [adminRateLimit, t2AccountRateLimit] },
  { name: "POST /api/payments/:paymentId/refund", router: paymentsRouter, method: "post", path: "/:paymentId/refund", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [adminRateLimit, t2AccountRateLimit] },
  { name: "POST /api/payments/projects/:projectId/checkout", router: paymentsRouter, method: "post", path: "/projects/:projectId/checkout", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [t2AccountRateLimit] },
  { name: "POST /api/payments/engineer/withdrawals", router: paymentsRouter, method: "post", path: "/engineer/withdrawals", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [payoutRateLimit, t2AccountRateLimit] },

  { name: "POST /api/payments/projects/:projectId/manual-submit", router: manualPaymentRouter, method: "post", path: "/projects/:projectId/manual-submit", limiter: manualSubmitRateLimiter, max: T2_MAX, alsoWired: [t2AccountRateLimit] },
  { name: "POST /api/payments/admin/manual-payments/:submissionId/verify", router: manualPaymentRouter, method: "post", path: "/admin/manual-payments/:submissionId/verify", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [adminRateLimit, t2AccountRateLimit] },
  { name: "POST /api/payments/admin/manual-payments/:submissionId/reject", router: manualPaymentRouter, method: "post", path: "/admin/manual-payments/:submissionId/reject", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [adminRateLimit, t2AccountRateLimit] },

  { name: "PATCH /api/admin/finance/settings", router: adminFinanceRouter, method: "patch", path: "/settings", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [adminRateLimit, t2AccountRateLimit] },
  { name: "PATCH /api/admin/payments/:paymentId/override", router: adminRouter, method: "patch", path: "/payments/:paymentId/override", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [adminRateLimit, t2AccountRateLimit] },
  { name: "PATCH /api/admin/withdrawals/:withdrawalId", router: adminRouter, method: "patch", path: "/withdrawals/:withdrawalId", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [t2AccountRateLimit] },
  { name: "POST /api/admin/withdrawals/:withdrawalId/cancel", router: adminRouter, method: "post", path: "/withdrawals/:withdrawalId/cancel", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [t2AccountRateLimit] },
  { name: "POST /api/admin/withdrawals/:withdrawalId/resolve", router: adminRouter, method: "post", path: "/withdrawals/:withdrawalId/resolve", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [t2AccountRateLimit] },
  { name: "POST /api/admin/withdrawals/:withdrawalId/reveal-bank-details", router: adminRouter, method: "post", path: "/withdrawals/:withdrawalId/reveal-bank-details", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [t2AccountRateLimit] },
  { name: "POST /api/admin/withdrawals/:withdrawalId/reject", router: adminRouter, method: "post", path: "/withdrawals/:withdrawalId/reject", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [t2AccountRateLimit] },
  { name: "POST /api/admin/withdrawals/:withdrawalId/record-completion", router: adminRouter, method: "post", path: "/withdrawals/:withdrawalId/record-completion", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [t2AccountRateLimit] },
  { name: "POST /api/admin/payouts/reconcile", router: adminRouter, method: "post", path: "/payouts/reconcile", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [t2AccountRateLimit] },

  { name: "POST /api/projects/:id/approve", router: projectRouter, method: "post", path: "/:id/approve", limiter: t2IpRateLimiter, max: T2_MAX, alsoWired: [t2AccountRateLimit] },
];

describe("rate limit T1/T2 endpoints", () => {
  let caseIndex = 0;
  for (const spec of t1t2Cases) {
    it(`${spec.name} is wired and returns 429 after exceeding the limit`, async () => {
      const handlers = routeHandlers(spec.router, spec.method, spec.path);
      assert.ok(
        handlers.includes(spec.limiter),
        `${spec.name}: limiter not found on ${spec.method.toUpperCase()} ${spec.path} (got ${handlers.length} handlers)`,
      );
      for (const extra of spec.alsoWired ?? []) {
        assert.ok(handlers.includes(extra), `${spec.name}: missing additional limiter`);
      }

      caseIndex += 1;
      const ip = `10.${Math.floor(caseIndex / 250)}.${caseIndex % 250}.20`;
      await exceedLimit(spec.limiter, spec.max, { ip, socket: { remoteAddress: ip } as Request["socket"] });
    });
  }
});

describe("rate limit fail-closed skip-if-no-userId", () => {
  it("adminRateLimit rejects requests with no userId instead of skipping", async () => {
    const result = await dispatch(adminRateLimit, { ip: "10.9.9.1" });
    assert.equal(result.nextCalled, true);
    assert.ok(result.error instanceof ApiError);
    assert.equal((result.error as ApiError).statusCode, 401);
  });

  it("payoutRateLimit rejects requests with no userId instead of skipping", async () => {
    const result = await dispatch(payoutRateLimit, { ip: "10.9.9.2" });
    assert.equal(result.nextCalled, true);
    assert.ok(result.error instanceof ApiError);
    assert.equal((result.error as ApiError).statusCode, 401);
  });

  it("t2AccountRateLimit rejects requests with no userId instead of skipping", async () => {
    const result = await dispatch(t2AccountRateLimit, { ip: "10.9.9.3" });
    assert.equal(result.nextCalled, true);
    assert.ok(result.error instanceof ApiError);
    assert.equal((result.error as ApiError).statusCode, 401);
  });
});

describe("rate limit other tiers", () => {
  it("T3 POST /api/messages/conversations/:id is wired and returns 429 after exceeding the limit", async () => {
    const handlers = routeHandlers(messagesRouter, "post", "/conversations/:id");
    assert.ok(handlers.includes(t3IpRateLimiter));
    await exceedLimit(t3IpRateLimiter, T3_MAX, { ip: "10.8.0.1", socket: { remoteAddress: "10.8.0.1" } as Request["socket"] });
  });

  it("T3 under-limit traffic is unaffected", async () => {
    const result = await dispatch(t3IpRateLimiter, {
      ip: "10.8.0.2",
      socket: { remoteAddress: "10.8.0.2" } as Request["socket"],
    });
    assert.equal(is429(result), false);
    assert.equal(result.nextCalled, true);
    assert.equal(result.error, undefined);
  });

  it("T4 GET /api/notifications/ is wired and returns 429 after exceeding the limit", async () => {
    const handlers = routeHandlers(notificationsRouter, "get", "/");
    assert.ok(handlers.includes(t4AccountRateLimit));
    await exceedLimit(t4AccountRateLimit, T4_MAX, {
      ip: "10.8.0.3",
      user: { userId: 88001, role: "CLIENT" },
    });
  });

  it("T4 under-limit traffic is unaffected", async () => {
    const result = await dispatch(t4AccountRateLimit, {
      ip: "10.8.0.4",
      user: { userId: 88002, role: "CLIENT" },
    });
    assert.equal(is429(result), false);
    assert.equal(result.nextCalled, true);
  });

  it("T5 GET /api/users/engineers is wired and returns 429 after exceeding the limit", async () => {
    const handlers = routeHandlers(userRouter, "get", "/engineers");
    assert.ok(handlers.includes(t5PublicListingLimiter));
    await exceedLimit(t5PublicListingLimiter, T5_MAX, {
      ip: "10.8.0.5",
      socket: { remoteAddress: "10.8.0.5" } as Request["socket"],
    });
  });

  it("T5 under-limit traffic is unaffected", async () => {
    const result = await dispatch(t5PublicListingLimiter, {
      ip: "10.8.0.6",
      socket: { remoteAddress: "10.8.0.6" } as Request["socket"],
    });
    assert.equal(is429(result), false);
    assert.equal(result.nextCalled, true);
  });

  it("T1 under-limit login is unaffected", async () => {
    const result = await dispatch(loginRateLimiter, {
      ip: "10.8.0.7",
      socket: { remoteAddress: "10.8.0.7" } as Request["socket"],
    });
    assert.equal(is429(result), false);
    assert.equal(result.nextCalled, true);
  });

  it("T2 under-limit account traffic is unaffected", async () => {
    const result = await dispatch(t2AccountRateLimit, {
      user: { userId: 88003, role: "CLIENT" },
    });
    assert.equal(is429(result), false);
    assert.equal(result.nextCalled, true);
  });

  it("adminRateLimit sets Retry-After when the per-admin cap is exceeded", async () => {
    const user = { userId: 99001, role: "ADMIN" };
    for (let i = 0; i < 30; i += 1) {
      const allowed = await dispatch(adminRateLimit, { user });
      assert.equal(is429(allowed), false);
    }
    const blocked = await dispatch(adminRateLimit, { user });
    assert.equal(is429(blocked), true);
    assert.ok(blocked.headers["retry-after"]);
  });
});

describe("isRateLimitDisabled", () => {
  const originalEnv = { ...process.env };

  afterEach(() => {
    process.env = { ...originalEnv };
  });

  it("returns true when non-production and RATE_LIMIT_DISABLED is true", () => {
    process.env.NODE_ENV = "development";
    process.env.RATE_LIMIT_DISABLED = "true";
    assert.equal(isRateLimitDisabled(), true);
  });

  it("returns false when production and RATE_LIMIT_DISABLED is true", () => {
    process.env.NODE_ENV = "production";
    process.env.RATE_LIMIT_DISABLED = "true";
    assert.equal(isRateLimitDisabled(), false);
  });
});
