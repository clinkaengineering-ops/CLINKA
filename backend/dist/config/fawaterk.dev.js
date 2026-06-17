"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEV_PAYMENT_METHODS = void 0;
exports.useFawaterkDevFallback = useFawaterkDevFallback;
/** Static methods when Fawaterk is unavailable (invalid token, offline, local dev). */
exports.DEV_PAYMENT_METHODS = [
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
function useFawaterkDevFallback() {
    return (process.env.FAWATERK_DEV_FALLBACK === "true" ||
        process.env.NODE_ENV !== "production");
}
