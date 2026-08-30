import api from "@/lib/axios";
import type { ApiResponse } from "@/features/engineers/api/engineer.api";

const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>) =>
  promise.then((r) => r.data.data);

export interface FinanceOverview {
  totalPayments: number;
  totalMoneyReceived: number;
  pendingManualPayments: number;
  pendingWithdrawals: number;
  totalPlatformCommissions: number;
  totalEngineerEarnings: number;
  failedTransactions: number;
}

export interface UnifiedTransaction {
  id: string;
  date: string;
  type: string;
  reference: string | null;
  user: string;
  amount: number | string;
  currency: string;
  status: string;
  note?: string;
}

export async function fetchFinanceOverview() {
  const { data } = await api.get<ApiResponse<FinanceOverview>>("/admin/finance/overview");
  return data.data;
}

export async function fetchUnifiedTransactions(page = 1, limit = 50) {
  const { data } = await api.get<ApiResponse<UnifiedTransaction[]>>("/admin/finance/transactions", {
    params: { page, limit }
  });
  return data.data;
}

export async function fetchManualPaymentSettings() {
  const { data } = await api.get<ApiResponse<any>>("/admin/finance/settings");
  return data.data;
}

export async function updateManualPaymentSettings(manualPaymentSettings: any) {
  const { data } = await api.patch<ApiResponse<any>>("/admin/finance/settings", {
    manualPaymentSettings
  });
  return data.data;
}

export async function fetchAdminManualPayments(
  page = 1,
  limit = 20,
  status?: string,
  method?: string,
  search?: string,
  currency?: string,
  country?: string,
) {
  const { data } = await api.get("/payments/admin/manual-payments", {
    params: { page, limit, status, method, search, currency, country }
  });
  return data;
}

export async function fetchAdminManualPaymentDetails(submissionId: number) {
  const { data } = await api.get(`/payments/admin/manual-payments/${submissionId}`);
  return data;
}

export async function verifyAdminManualPayment(submissionId: number, adminNote?: string) {
  const { data } = await api.post(`/payments/admin/manual-payments/${submissionId}/verify`, { adminNote });
  return data;
}

export async function rejectAdminManualPayment(submissionId: number, reason?: string) {
  const { data } = await api.post(`/payments/admin/manual-payments/${submissionId}/reject`, { reason });
  return data;
}
