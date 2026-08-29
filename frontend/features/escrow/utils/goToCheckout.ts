/** Navigate to Paymob Unified Checkout. */
export function checkoutPath(projectId: number): string {
  return `/checkout?projectId=${projectId}`;
}
