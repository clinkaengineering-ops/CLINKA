import { Suspense } from "react";
import { MessagingPage } from "@/features/messages/components/MessagingPage";

export default function Page() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500 p-8">Loading messages…</p>}>
      <MessagingPage />
    </Suspense>
  );
}
