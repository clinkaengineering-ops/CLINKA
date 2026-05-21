import type { FawaterkPaymentMethod } from "../modules/payments/fawaterk.api";

/** Static methods when Fawaterk is unavailable (invalid token, offline, local dev). */
export const DEV_PAYMENT_METHODS: FawaterkPaymentMethod[] = [
  {
    paymentId: 2,
    name_en: "Visa-Mastercard",
    name_ar: "فيزا - ماستر كارد",
    redirect: "true",
    logo: "https://app.fawaterak.xyz/clients/payment_options/mastercard-visa.png",
  },
  {
    paymentId: 3,
    name_en: "Fawry",
    name_ar: "فوري",
    redirect: "false",
    logo: "https://app.fawaterak.xyz/clients/payment_options/fawry.png",
  },
  {
    paymentId: 4,
    name_en: "Meeza",
    name_ar: "ميزا",
    redirect: "false",
    logo: "https://app.fawaterak.xyz/clients/payment_options/MeezaDigitalSmall.png",
  },
];

export function useFawaterkDevFallback(): boolean {
  return (
    process.env.FAWATERK_DEV_FALLBACK === "true" ||
    process.env.NODE_ENV !== "production"
  );
}
