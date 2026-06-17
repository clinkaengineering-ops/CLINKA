/** Navigate to Fawaterak-hosted checkout (IFrame plugin page). */
export function checkoutPath(projectId: number): string {
  return `/checkout?projectId=${projectId}`;
}
