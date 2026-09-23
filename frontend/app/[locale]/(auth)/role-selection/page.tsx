import { Metadata } from "next";
import { RoleSelectionForm } from "@/features/auth/components/RoleSelectionForm";

export const metadata: Metadata = {
  title: "Select Role | CLINKA",
  description: "Select your role to complete registration.",
};

export default function RoleSelectionPage() {
  return <RoleSelectionForm />;
}
