export type Role = "CLIENT" | "ENGINEER" | "ADMIN";

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  isVerified: boolean;
  createdAt: string;
}