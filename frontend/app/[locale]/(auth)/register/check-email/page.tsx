import { Suspense } from "react";
import { CheckEmailForm } from "@/features/auth/components/CheckEmailForm";
import { LoadingFallback } from "@/components/LoadingFallback";
import { Card } from "@/components/UI";

export default function CheckEmailPage() {
  return (
    <Suspense
      fallback={
        <Card className="p-6 sm:p-8 text-center">
          <LoadingFallback />
        </Card>
      }
    >
      <CheckEmailForm />
    </Suspense>
  );
}
