"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  fetchEscrowPayments,
  initiateCheckout,
  refundEscrowPayment,
  releaseEscrowPayment,
  verifyPayment,
} from "../api/payments.api";
import { fetchMyProjects } from "@/features/projects/api/project.api";
import type {
  CheckoutResult,
  EscrowContractRow,
  EscrowPaymentItem,
  InitiateCheckoutPayload,
} from "../types";

function axiosMessage(err: unknown): string {
  const e = err as {
    response?: { data?: { message?: string } };
    message?: string;
  };
  return e?.response?.data?.message ?? e?.message ?? "Request failed";
}

function toContractRows(
  payments: EscrowPaymentItem[],
  activeProjects: {
    id: number;
    title: string;
    status: string;
    budget: number;
    bids?: { price: number; status: string }[];
  }[],
): EscrowContractRow[] {
  const projectStatusById = new Map(
    activeProjects.map((p) => [p.id, p.status]),
  );
  const byProject = new Map(payments.map((p) => [p.projectId, p]));

  const rows: EscrowContractRow[] = payments.map((p) => ({
    paymentId: p.id,
    projectId: p.projectId,
    projectTitle: p.projectTitle,
    projectStatus: p.projectStatus ?? projectStatusById.get(p.projectId),
    amount: p.amount,
    commission: p.commission,
    status: p.status,
    updatedAt: p.updatedAt,
  }));

  for (const project of activeProjects) {
    if (byProject.has(project.id)) continue;
    const accepted = project.bids?.find((b) => b.status === "ACCEPTED");
    if (!accepted) continue;
    rows.push({
      paymentId: null,
      projectId: project.id,
      projectTitle: project.title,
      projectStatus: project.status,
      amount: accepted.price ?? project.budget,
      commission: 0,
      status: "Pending",
      updatedAt: new Date().toISOString(),
    });
  }

  return rows.sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
  );
}

export function useEscrow() {
  const searchParams = useSearchParams();
  const [payments, setPayments] = useState<EscrowPaymentItem[]>([]);
  const [contracts, setContracts] = useState<EscrowContractRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [banner, setBanner] = useState<{
    type: "success" | "fail" | "pending" | "info";
    message: string;
  } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [escrow, projects] = await Promise.all([
        fetchEscrowPayments(),
        fetchMyProjects(),
      ]);
      const inProgress = projects.filter((p) =>
        ["IN_PROGRESS", "SUBMITTED_FOR_REVIEW", "AWAITING_APPROVAL", "REVISION_REQUESTED"].includes(p.status),
      );
      setPayments(escrow);
      setContracts(toContractRows(escrow, inProgress));
    } catch (err) {
      setError(axiosMessage(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    const status = searchParams.get("status");
    if (!status) return;
    if (status === "success") {
      setBanner({
        type: "success",
        message: "Payment completed. Verifying escrow...",
      });
      // Auto-verify any pending payments for local/sync support
      fetchEscrowPayments().then(async (escrows) => {
        const pending = escrows.filter(e => e.status === "Pending");
        if (pending.length > 0) {
          try {
            await Promise.all(pending.map(p => verifyPayment(p.id)));
            setBanner({
              type: "success",
              message: "Payment successfully verified and escrow funded.",
            });
          } catch (err) {
            console.error("Verification failed", err);
          }
        } else {
          setBanner({
            type: "success",
            message: "Payment completed. Escrow updated.",
          });
        }
        load();
      }).catch(load);
    } else if (status === "fail") {
      setBanner({ type: "fail", message: "Payment was not completed." });
    } else if (status === "pending") {
      setBanner({
        type: "pending",
        message: "Payment is pending confirmation (e.g. Fawry).",
      });
    }
  }, [searchParams, load]);

  const stats = useMemo(() => {
    const inEscrow = contracts
      .filter((c) => c.status === "In escrow")
      .reduce((s, c) => s + c.amount, 0);
    const released = contracts
      .filter((c) => c.status === "Released")
      .reduce((s, c) => s + c.amount, 0);
    const pending = contracts
      .filter((c) => c.status === "Pending")
      .reduce((s, c) => s + c.amount, 0);
    const refunded = contracts.filter((c) => c.status === "Refunded").length;
    return { inEscrow, released, pending, refunded };
  }, [contracts]);

  const fundProject = useCallback(
    async (
      projectId: number,
      payload: InitiateCheckoutPayload,
    ): Promise<CheckoutResult> => {
      setActionLoading(true);
      try {
        const result = await initiateCheckout(projectId, payload);
        await load();
        return result;
      } catch (err) {
        throw new Error(axiosMessage(err));
      } finally {
        setActionLoading(false);
      }
    },
    [load],
  );

  const releasePayment = useCallback(
    async (paymentId: number) => {
      setActionLoading(true);
      try {
        await releaseEscrowPayment(paymentId);
        await load();
        setBanner({
          type: "success",
          message: "Payment sent to the engineer.",
        });
      } catch (err) {
        throw new Error(axiosMessage(err));
      } finally {
        setActionLoading(false);
      }
    },
    [load],
  );

  const refundPayment = useCallback(
    async (paymentId: number) => {
      setActionLoading(true);
      try {
        await refundEscrowPayment(paymentId);
        await load();
        setBanner({
          type: "info",
          message: "Escrow marked as refunded.",
        });
      } catch (err) {
        throw new Error(axiosMessage(err));
      } finally {
        setActionLoading(false);
      }
    },
    [load],
  );

  const dismissBanner = useCallback(() => setBanner(null), []);

  return {
    payments,
    contracts,
    stats,
    loading,
    error,
    actionLoading,
    banner,
    dismissBanner,
    refetch: load,
    fundProject,
    releasePayment,
    refundPayment,
  };
}
