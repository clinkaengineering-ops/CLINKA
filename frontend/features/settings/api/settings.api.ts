import { getMe, updateMe } from "@/features/engineers/api/engineer.api";
import api from "@/lib/axios";
import type { ApiResponse } from "@/features/engineers/api/engineer.api";
import type { Me } from "@/types";

const unwrap = <T>(promise: Promise<{ data: ApiResponse<T> }>) =>
  promise.then((r) => r.data.data as T);

export const fetchAccount = () => getMe();

export const updateAccount = (payload: {
  name?: string;
  bio?: string;
}): Promise<Me> => updateMe(payload);

export const changePassword = (payload: {
  oldPassword: string;
  newPassword: string;
}) =>
  unwrap(
    api.post<ApiResponse<null>>("/auth/change-password", payload),
  );

export const requestEmailChange = (newEmail: string) =>
  unwrap(
    api.post<ApiResponse<null>>("/auth/request-email-change", { newEmail }),
  );

export const confirmEmailChange = (otp: string): Promise<Me> =>
  unwrap(api.post<ApiResponse<Me>>("/auth/confirm-email-change", { otp }));
