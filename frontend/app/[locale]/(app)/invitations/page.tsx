import InvitationsPage from "@/features/invitations/pages/InvitationsPage";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "My Invitations | CLINKA",
  description: "View and respond to project invitations",
};

export default function Page() {
  return <InvitationsPage />;
}
