/** Navigate to Paymob Unified Checkout. */
export function checkoutPath(projectId: string): string {
  return `/checkout?projectId=${projectId}`;
}
