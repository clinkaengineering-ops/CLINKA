import api from "@/lib/axios";
import type { ApiResponse } from "@/features/engineers/api/engineer.api";

const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>) =>
  promise.then((r) => r.data.data);

export interface SupportContact {
  email: string;
}

export const fetchSupportContact = (): Promise<SupportContact> =>
  unwrap(api.get<ApiResponse<SupportContact>>("/public/support-contact")).then(
    (d) => {
      if (!d) throw new Error("Failed to load support contact");
      return d;
    },
  );

export interface SubmitSupportTicketInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export const submitSupportTicket = (data: SubmitSupportTicketInput) =>
  unwrap(
    api.post<ApiResponse<{ id: number }>>("/public/support-tickets", data),
  );
