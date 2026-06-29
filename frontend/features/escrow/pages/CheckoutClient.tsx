"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLink } from "@/components/BrandLogo";
import {
  fetchCheckoutSession,
  fetchEscrowPaymentById,
  fetchProjectPayment,
  verifyPayment,
} from "../api/payments.api";
import { formatMoney } from "../utils/formatMoney";
import { parseCheckoutReturn } from "../utils/parseCheckoutReturn";
import { useI18n } from "@/i18n";

type Status = "form" | "loading" | "ready" | "error";

export default function CheckoutClient() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const parsedReturn = parseCheckoutReturn(searchParams);

  if (parsedReturn.isReturn) {
    if (!parsedReturn.status && !parsedReturn.projectId && !parsedReturn.paymentId) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-slate-400 text-sm">{t("checkout.invalidProject")}</p>
        </div>
      );
    }

    return (
      <CheckoutReturnStatus
        projectId={parsedReturn.projectId}
        paymentId={parsedReturn.paymentId}
        status={parsedReturn.status ?? "success"}
      />
    );
  }

  const projectId = Number(searchParams.get("projectId"));

  if (!projectId || Number.isNaN(projectId)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-slate-400 text-sm">{t("checkout.invalidProject")}</p>
      </div>
    );
  }

  return <CheckoutForm projectId={projectId} />;
}

function CheckoutReturnStatus({
  projectId: initialProjectId,
  paymentId: initialPaymentId,
  status,
}: {
  projectId?: number;
  paymentId?: number;
  status: "success" | "fail" | "pending";
}) {
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<"success" | "error" | "pending">(
    status === "success" ? "pending" : status === "pending" ? "pending" : "error",
  );
  const [resolvedProjectId, setResolvedProjectId] = useState(initialProjectId);

  useEffect(() => {
    let alive = true;

    const setIfAlive = (next: {
      title: string;
      message: string;
      variant: "success" | "error" | "pending";
    }) => {
      if (!alive) return;
      setTitle(next.title);
      setMessage(next.message);
      setVariant(next.variant);
    };

    if (status === "fail") {
      setIfAlive({
        title: "Payment was not completed",
        message: "No charge was confirmed. You can retry payment from your project page.",
        variant: "error",
      });
      return () => {
        alive = false;
      };
    }

    if (status === "pending") {
      setIfAlive({
        title: "Payment is pending",
        message: "Your payment method is still confirming. Check back shortly in your project.",
        variant: "pending",
      });
      return () => {
        alive = false;
      };
    }

    setIfAlive({
      title: "Verifying payment",
      message: "Please wait while we confirm escrow funding.",
      variant: "pending",
    });

    void (async () => {
      try {
        let resolvedPaymentId = initialPaymentId;
        let projectId = initialProjectId;

        if (!projectId && resolvedPaymentId) {
          const payment = await fetchEscrowPaymentById(resolvedPaymentId);
          projectId = payment.projectId;
          if (alive) setResolvedProjectId(projectId);
        }

        if (!projectId) {
          throw new Error("Could not determine which project this payment belongs to.");
        }

        if (!resolvedPaymentId) {
          const payment = (await fetchProjectPayment(projectId)) as {
            id?: number;
            status?: string;
          } | null;

          if (payment?.status === "In escrow" || payment?.status === "Released") {
            setIfAlive({
              title: "Payment confirmed",
              message: "Escrow is already funded for this project.",
              variant: "success",
            });
            return;
          }

          resolvedPaymentId = payment?.id;
        }

        if (!resolvedPaymentId) {
          throw new Error("Could not determine which payment to verify.");
        }

        await verifyPayment(resolvedPaymentId);
        setIfAlive({
          title: "Payment successful",
          message: "Escrow is now funded and the engineer can start working.",
          variant: "success",
        });
      } catch (err) {
        const e = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        setIfAlive({
          title: "Payment verification failed",
          message:
            e?.response?.data?.message ??
            e?.message ??
            "We could not confirm your payment yet. Please contact support if this persists.",
          variant: "error",
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, [initialPaymentId, initialProjectId, status]);

  const badgeClass =
    variant === "success"
      ? "bg-emerald-100 text-emerald-700"
      : variant === "error"
        ? "bg-rose-100 text-rose-700"
        : "bg-amber-100 text-amber-700";

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-brand-teal via-[#145268] to-slate-950">
      <div className="w-full max-w-lg rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 bg-brand-teal text-white">
          <BrandLink logoClassName="h-8 w-auto max-w-[140px] brightness-0 invert" />
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeClass}`}>
            {variant === "success"
              ? "Confirmed"
              : variant === "error"
                ? "Needs action"
                : "Pending"}
          </span>
        </div>
        <div className="px-5 py-8 text-center">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">{title}</h2>
          <p className="text-sm text-slate-500 mt-2">{message}</p>
          <Link
            href={
              resolvedProjectId
                ? `/projects?id=${resolvedProjectId}`
                : "/projects"
            }
            className="inline-flex mt-5 px-4 py-2 rounded-lg bg-electric-500 text-white text-sm font-semibold hover:bg-electric-600"
          >
            Go to project
          </Link>
        </div>
      </div>
    </div>
  );
}

function CheckoutForm({ projectId }: { projectId: number }) {
  const { t } = useI18n();
  const router = useRouter();

  const [status, setStatus] = useState<Status>("form");
  const [errorMsg, setErrorMsg] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(0);
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [paymentId, setPaymentId] = useState<number | null>(null);

  const handleProceed = useCallback(async () => {
    if (!phone.trim() || !address.trim()) return;

    setStatus("loading");

    try {
      const session = await fetchCheckoutSession(
        projectId,
        phone.trim(),
        address.trim(),
      );

      setTitle(session.projectTitle);
      setAmount(session.amount);
      setPaymentId(session.paymentId);

      if (!session.checkoutUrl) {
        throw new Error("Missing checkout URL from server.");
      }

      window.location.href = session.checkoutUrl;
    } catch (err) {
      const e = err as {
        response?: { data?: { message?: string } };
        message?: string;
      };
      setErrorMsg(
        e?.response?.data?.message ?? e?.message ?? t("checkout.loadFailed"),
      );
      setStatus("error");
    }
  }, [projectId, phone, address, t]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-brand-teal via-[#145268] to-slate-950">
      <div className="w-full max-w-lg rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-700">
        <div className="flex items-center justify-between px-5 py-4 bg-brand-teal text-white">
          <BrandLink logoClassName="h-8 w-auto max-w-[140px] brightness-0 invert" />
          <div className="text-end">
            <p className="text-[10px] uppercase tracking-wider text-white/50">
              {t("checkout.secure")}
            </p>
            {amount > 0 && (
              <p className="text-lg font-bold">{formatMoney(amount)}</p>
            )}
          </div>
        </div>

        {title && (
          <p className="px-5 py-3 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
            {title}
          </p>
        )}

        {status === "form" && (
          <div className="flex flex-col gap-4 px-5 py-6">
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {t("checkout.contactDetails")}
            </p>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">{t("checkout.phone")}</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs text-slate-500">{t("checkout.address")}</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder={t("checkout.addressPh")}
                className="w-full rounded-lg border border-slate-200 dark:border-slate-700 px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-electric-500"
              />
            </div>
            <button
              type="button"
              onClick={handleProceed}
              disabled={!phone.trim() || !address.trim()}
              className="mt-1 w-full py-2.5 rounded-lg bg-electric-500 text-white text-sm font-semibold hover:bg-electric-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              {t("checkout.continue")}
            </button>
          </div>
        )}

        {status === "loading" && (
          <div className="flex flex-col items-center gap-3 py-16 px-6">
            <div className="h-10 w-10 rounded-full border-2 border-electric-500 border-t-transparent animate-spin" />
            <p className="text-sm text-slate-500">{t("checkout.loading")}</p>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 py-12 px-6 text-center">
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              {t("checkout.unavailable")}
            </p>
            <p className="text-sm text-slate-500">{errorMsg}</p>
            <button
              type="button"
              onClick={() => router.push("/projects")}
              className="mt-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 text-sm font-medium hover:bg-slate-50 dark:hover:bg-slate-800"
            >
              {t("side.findProjects")}
            </button>
          </div>
        )}



        <div className="px-5 py-3 text-center text-xs text-slate-400 border-t border-slate-100 dark:border-slate-800">
          {t("checkout.securedBy")}
        </div>
      </div>
    </div>
  );
}
