"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { BrandLink } from "@/components/BrandLogo";
import { Button, Field, Input, Spinner } from "@/components/UI";
import { IconCheck, IconClose } from "@/components/Icons";
import { fetchCheckoutSession, verifyCheckoutReturn } from "../api/payments.api";
import { formatMoney } from "../utils/formatMoney";
import { parseCheckoutReturn } from "../utils/parseCheckoutReturn";
import {
  clearCheckoutReturnStorage,
  readCheckoutReturnStorage,
  writeCheckoutReturnStorage,
} from "../utils/checkoutReturnStorage";
import { submitManualPayment } from "../api/payments.api";
import { ManualPaymentModal } from "../components/ManualPaymentModal";
import { useI18n } from "@/i18n";
import { useAuthHydration } from "@/hooks/useAuthHydration";
import { cn } from "@/utils/cn";

type Status = "form" | "loading" | "error";
type ReturnStatus = "success" | "fail" | "pending" | "verifying";

function isFundedStatus(status?: string) {
  return status === "FUNDED" || status === "RELEASED";
}

function resolveReturnStatus(
  parsed: ReturnType<typeof parseCheckoutReturn>,
): ReturnStatus {
  if (parsed.status === "fail") return "fail";
  if (parsed.status === "pending") return "pending";
  if (parsed.status === "success") return "verifying";
  // Paymob return without explicit status — verify with backend, never assume success
  return "verifying";
}

export default function CheckoutClient() {
  const { t } = useI18n();
  const searchParams = useSearchParams();
  const parsedReturn = parseCheckoutReturn(searchParams);
  const [storedReturn] = useState(() => readCheckoutReturnStorage());

  // Only treat as a return flow when Paymob actually redirected back
  // (parsedReturn.isReturn) OR when there's stored return data AND no
  // explicit projectId-only entry (which indicates a fresh checkout).
  const projectIdOnly =
    !parsedReturn.isReturn &&
    searchParams.has("projectId") &&
    !searchParams.has("status") &&
    !searchParams.has("success") &&
    !searchParams.has("pending");

  if (parsedReturn.isReturn || (storedReturn && !projectIdOnly)) {
    if (
      !parsedReturn.status &&
      !parsedReturn.paymentId &&
      !parsedReturn.orderId &&
      !parsedReturn.transactionId &&
      !parsedReturn.specialReference &&
      !parsedReturn.merchantOrderId &&
      !storedReturn
    ) {
      return (
        <CheckoutShell>
          <p className="text-slate-400 text-sm text-center animate-fade-in">
            {t("checkout.invalidProject")}
          </p>
        </CheckoutShell>
      );
    }

    return (
      <CheckoutReturnStatus
        projectId={parsedReturn.projectId ?? storedReturn?.projectId}
        paymentId={parsedReturn.paymentId ?? storedReturn?.paymentId}
        orderId={parsedReturn.orderId}
        transactionId={parsedReturn.transactionId}
        specialReference={parsedReturn.specialReference}
        merchantOrderId={parsedReturn.merchantOrderId}
        status={resolveReturnStatus(parsedReturn)}
      />
    );
  }

  const projectId = Number(searchParams.get("projectId"));

  if (!projectId || Number.isNaN(projectId)) {
    return (
      <CheckoutShell>
        <p className="text-slate-400 text-sm text-center animate-fade-in">
          {t("checkout.invalidProject")}
        </p>
      </CheckoutShell>
    );
  }

  // Fresh checkout entry — clear any stale return data from a previous attempt
  if (storedReturn) {
    clearCheckoutReturnStorage();
  }

  return <CheckoutForm projectId={projectId} />;
}

function CheckoutShell({
  children,
  badge,
  amount,
}: {
  children: React.ReactNode;
  badge?: React.ReactNode;
  amount?: number;
}) {
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 sm:p-8 bg-gradient-to-br from-brand-teal via-[#145268] to-slate-950">
      <div className="w-full max-w-lg rounded-2xl overflow-hidden bg-white dark:bg-slate-900 shadow-2xl border border-slate-200/80 dark:border-slate-700 animate-scale-in">
        <div className="flex items-center justify-between px-4 sm:px-5 py-4 bg-brand-teal text-white">
          <BrandLink logoClassName="h-9 sm:h-10 w-auto max-w-[160px] sm:max-w-[180px] brightness-0 invert" />
          <div className="text-end">
            {badge ?? (
              <p className="text-[10px] uppercase tracking-wider text-white/50">
                {t("checkout.secure")}
              </p>
            )}
            {amount != null && amount > 0 ? (
              <p className="text-base sm:text-lg font-bold">{formatMoney(amount)}</p>
            ) : null}
          </div>
        </div>
        {children}
      </div>
    </div>
  );
}

function StatusIcon({ variant }: { variant: "success" | "error" | "pending" }) {
  if (variant === "success") {
    return (
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 animate-scale-in">
        <IconCheck width={28} height={28} />
      </div>
    );
  }
  if (variant === "error") {
    return (
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 dark:text-rose-400 animate-scale-in">
        <IconClose width={28} height={28} />
      </div>
    );
  }
  return (
    <div className="mx-auto flex h-14 w-14 items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

function CheckoutReturnStatus({
  projectId: initialProjectId,
  paymentId: initialPaymentId,
  orderId,
  transactionId,
  specialReference,
  merchantOrderId,
  status,
}: {
  projectId?: number;
  paymentId?: number;
  orderId?: number;
  transactionId?: number;
  specialReference?: string;
  merchantOrderId?: string;
  status: ReturnStatus;
}) {
  const { t } = useI18n();
  const { authResolved, user } = useAuthHydration();
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [variant, setVariant] = useState<"success" | "error" | "pending">(
    status === "fail" ? "error" : "pending",
  );
  const [resolvedProjectId, setResolvedProjectId] = useState(initialProjectId);
  const [verifying, setVerifying] = useState(status === "verifying");

  useEffect(() => {
    let alive = true;

    const setIfAlive = (next: {
      title: string;
      message: string;
      variant: "success" | "error" | "pending";
      verifying?: boolean;
    }) => {
      if (!alive) return;
      setTitle(next.title);
      setMessage(next.message);
      setVariant(next.variant);
      if (next.verifying !== undefined) setVerifying(next.verifying);
    };

    if (status === "fail") {
      setIfAlive({
        title: t("checkout.return.failed"),
        message: t("checkout.return.failedMessage"),
        variant: "error",
        verifying: false,
      });
      return () => {
        alive = false;
      };
    }

    if (status === "pending") {
      setIfAlive({
        title: t("checkout.return.pending"),
        message: t("checkout.return.pendingMessage"),
        variant: "pending",
        verifying: false,
      });
      return () => {
        alive = false;
      };
    }

    if (!authResolved) {
      return () => {
        alive = false;
      };
    }

    if (!user) {
      setIfAlive({
        title: t("checkout.return.verifyFailed"),
        message: t("checkout.return.signInRequired"),
        variant: "error",
        verifying: false,
      });
      return () => {
        alive = false;
      };
    }

    setIfAlive({
      title: t("checkout.return.verifying"),
      message: t("checkout.return.verifyingMessage"),
      variant: "pending",
      verifying: true,
    });

    void (async () => {
      try {
        const stored = readCheckoutReturnStorage();
        const payment = await verifyCheckoutReturn({
          projectId: initialProjectId ?? stored?.projectId,
          paymentId: initialPaymentId ?? stored?.paymentId,
          orderId,
          transactionId,
          specialReference,
          merchantOrderId,
          returnQuery:
            typeof window !== "undefined" ? window.location.search : undefined,
        });

        if (alive && payment.projectId) {
          setResolvedProjectId(payment.projectId);
        }

        if (isFundedStatus(payment.status)) {
          clearCheckoutReturnStorage();
          setIfAlive({
            title: t("checkout.return.success"),
            message: t("checkout.return.successMessage"),
            variant: "success",
            verifying: false,
          });
          return;
        }

        setIfAlive({
          title: t("checkout.return.stillPending"),
          message: t("checkout.return.stillPendingMessage"),
          variant: "pending",
          verifying: false,
        });
      } catch (err) {
        const e = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        setIfAlive({
          title: t("checkout.return.verifyFailed"),
          message:
            e?.response?.data?.message ??
            e?.message ??
            t("checkout.return.verifyFailedMessage"),
          variant: "error",
          verifying: false,
        });
      }
    })();

    return () => {
      alive = false;
    };
  }, [
    authResolved,
    initialPaymentId,
    initialProjectId,
    merchantOrderId,
    orderId,
    specialReference,
    status,
    t,
    transactionId,
    user,
  ]);

  const retryHref =
    resolvedProjectId != null
      ? `/checkout?projectId=${resolvedProjectId}`
      : initialProjectId != null
        ? `/checkout?projectId=${initialProjectId}`
        : null;

  const badgeLabel =
    variant === "success"
      ? t("checkout.return.confirmed")
      : variant === "error"
        ? t("checkout.return.needsAction")
        : t("checkout.return.pendingBadge");

  const badgeClass =
    variant === "success"
      ? "bg-emerald-500/20 text-emerald-100 border border-emerald-400/30"
      : variant === "error"
        ? "bg-rose-500/20 text-rose-100 border border-rose-400/30"
        : "bg-amber-500/20 text-amber-100 border border-amber-400/30";

  return (
    <CheckoutShell
      badge={
        <span
          className={cn(
            "text-xs font-semibold px-2.5 py-1 rounded-full",
            badgeClass,
          )}
        >
          {badgeLabel}
        </span>
      }
    >
      <div className="px-4 sm:px-5 py-8 sm:py-10 text-center animate-fade-up">
        <StatusIcon variant={verifying ? "pending" : variant} />
        <h2 className="mt-5 text-lg sm:text-xl font-semibold text-slate-900 dark:text-white">
          {title}
        </h2>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-sm mx-auto leading-relaxed">
          {message}
        </p>
        <div className="mt-6 flex flex-col sm:flex-row flex-wrap justify-center gap-3">
          {(variant === "error" || (variant === "pending" && !verifying)) && retryHref ? (
            <Link
              href={retryHref}
              onClick={() => clearCheckoutReturnStorage()}
              className="inline-flex items-center justify-center min-h-11 w-full sm:w-auto px-6 rounded-lg bg-brand-teal hover:bg-electric-400 text-white text-sm font-semibold transition-smooth motion-safe:active:scale-[0.98]"
            >
              {t("checkout.return.tryAgain")}
            </Link>
          ) : null}
          <Link
            href={
              resolvedProjectId
                ? `/projects?id=${resolvedProjectId}`
                : "/projects"
            }
            onClick={() => clearCheckoutReturnStorage()}
            className={cn(
              "inline-flex items-center justify-center min-h-11 w-full sm:w-auto px-6 rounded-lg text-sm font-semibold transition-smooth motion-safe:active:scale-[0.98]",
              (variant === "error" || (variant === "pending" && !verifying)) && retryHref
                ? "border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                : "bg-brand-teal hover:bg-electric-400 text-white",
            )}
          >
            {t("checkout.return.goToProject")}
          </Link>
        </div>
      </div>
    </CheckoutShell>
  );
}

function CheckoutForm({ projectId }: { projectId: number }) {
  const { t } = useI18n();
  const router = useRouter();

  const [status, setStatus] = useState<Status>("loading");
  const [errorMsg, setErrorMsg] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState(0);
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [submittingManual, setSubmittingManual] = useState(false);

  useEffect(() => {
    let alive = true;

    const proceed = async () => {
      try {
        const session = await fetchCheckoutSession(
          projectId,
          "01000000000",
          "N/A",
        );

        if (!alive) return;

        setTitle(session.projectTitle);
        setAmount(session.amountUsd);

        if (session.paymentId) {
          writeCheckoutReturnStorage({
            projectId,
            paymentId: session.paymentId,
          });
        }

        if (!session.checkoutUrl) {
          // Manual payment flow!
          setStatus("form");
          setManualModalOpen(true);
          return;
        }

        window.location.href = session.checkoutUrl;
      } catch (err) {
        if (!alive) return;
        const e = err as {
          response?: { data?: { message?: string } };
          message?: string;
        };
        setErrorMsg(
          e?.response?.data?.message ?? e?.message ?? t("checkout.loadFailed"),
        );
        setStatus("error");
      }
    };

    proceed();

    return () => {
      alive = false;
    };
  }, [projectId, t]);

  const handleManualSubmit = async (formData: FormData) => {
    setSubmittingManual(true);
    try {
      await submitManualPayment(projectId, formData);
      setManualModalOpen(false);
      // Wait for the modal to close visually before redirecting
      setTimeout(() => {
        router.push(`/projects?id=${projectId}`);
      }, 500);
    } catch (err) {
      throw err; // Handled by modal
    } finally {
      setSubmittingManual(false);
    }
  };

  return (
    <>
      <CheckoutShell amount={amount > 0 ? amount : undefined}>
        {title ? (
          <p className="px-4 sm:px-5 py-3 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 animate-fade-in">
            {title}
          </p>
        ) : null}

        {status === "loading" && (
          <div className="flex flex-col items-center gap-4 py-16 px-6 animate-fade-in">
            <Spinner size="lg" />
            <p className="text-sm text-slate-500">{t("checkout.loading")}</p>
          </div>
        )}

        {status === "form" && (
          <div className="flex flex-col items-center gap-4 py-12 px-6 animate-fade-in text-center">
            <p className="text-base font-medium text-slate-700 dark:text-slate-300">
              You have chosen manual payment.
            </p>
            <Button onClick={() => setManualModalOpen(true)}>
              View Instructions
            </Button>
          </div>
        )}

        {status === "error" && (
          <div className="flex flex-col items-center gap-3 py-12 px-6 text-center animate-fade-up">
            <StatusIcon variant="error" />
            <p className="text-base font-semibold text-slate-900 dark:text-white">
              {t("checkout.unavailable")}
            </p>
            <p className="text-sm text-slate-500">{errorMsg}</p>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/projects")}
              className="mt-2 min-h-11"
            >
              {t("side.findProjects")}
            </Button>
          </div>
        )}
      </CheckoutShell>

      <ManualPaymentModal
        open={manualModalOpen}
        onClose={() => setManualModalOpen(false)}
        projectTitle={title}
        amount={amount}
        loading={submittingManual}
        onConfirm={handleManualSubmit}
      />
    </>
  );
}
