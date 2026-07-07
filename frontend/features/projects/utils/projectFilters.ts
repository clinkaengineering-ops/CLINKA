export function matchesBudget(budget: number, range: string) {
  if (!range) return true;
  const [min, max] = range.split("-").map(Number);
  if (Number.isNaN(min) || Number.isNaN(max)) return true;
  return budget >= min && budget <= max;
}

/** Filters by how long ago the project was posted (listing age). */
export function matchesPostedTimeline(createdAt: string, timeline: string) {
  if (!timeline) return true;

  const ageDays =
    (Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24);

  switch (timeline) {
    case "under4w":
      return ageDays <= 28;
    case "1to3m":
      return ageDays > 28 && ageDays <= 90;
    case "3plus":
      return ageDays > 90;
    default:
      return true;
  }
}
