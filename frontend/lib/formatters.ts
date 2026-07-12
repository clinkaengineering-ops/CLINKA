import { formatMoney } from "@/features/escrow/utils/formatMoney";

export function formatCurrency(amount: number): string {
  return formatMoney(amount);
}

export function formatDate(iso: string | Date): string {
  const date = typeof iso === 'string' ? new Date(iso) : iso;
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
}
