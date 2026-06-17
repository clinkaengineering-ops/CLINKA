// Dashboard API — aggregates existing backend routes (no /client/* prefix).
import { fetchMyProjects } from "@/features/projects/api/project.api";
import { fetchEscrowPayments } from "@/features/escrow/api/payments.api";
import { fetchPendingReviews } from "@/features/reviews/api/reviews.api";
import { fetchConversations } from "@/features/messages/api/messages.api";
import { formatMoney } from "@/features/escrow/utils/formatMoney";
import type {
  DashboardStats,
  SpendOverview,
  ClientProject,
  Notification,
  Message,
} from "@/types";

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const [projects, escrow, pendingReviews] = await Promise.all([
    fetchMyProjects(),
    fetchEscrowPayments().catch(() => []),
    fetchPendingReviews().catch(() => []),
  ]);

  const activeProjects = projects.filter((p) => p.status === "IN_PROGRESS").length;
  const inEscrowTotal = escrow
    .filter((e) => e.status === "In escrow")
    .reduce((s, e) => s + e.amount, 0);
  const engineersHired = projects.filter(
    (p) => p.status === "IN_PROGRESS" || p.status === "COMPLETED",
  ).length;

  return {
    activeProjects,
    activeProjectsChange: `${projects.length} total`,
    inEscrow: formatMoney(inEscrowTotal),
    inEscrowChange: `${escrow.length} payments`,
    engineersHired,
    engineersHiredChange: `${pendingReviews.length} reviews pending`,
    avgDeliveryDays: 0,
    avgDeliveryChange: "—",
  };
};

export const fetchSpendOverview = async (
  _period: "1M" | "6M" | "12M" | "all" = "12M",
): Promise<SpendOverview> => {
  const escrow = await fetchEscrowPayments().catch(() => []);
  const total = escrow.reduce((s, e) => s + e.amount, 0);
  const series = escrow.slice(0, 6).map((e) => e.amount);
  while (series.length < 6) series.push(0);
  return {
    total: formatMoney(total),
    changePercent: 0,
    series,
  };
};

export const fetchActiveProjects = async (): Promise<ClientProject[]> => {
  const projects = await fetchMyProjects();
  return projects
    .filter((p) => p.status === "IN_PROGRESS" || p.status === "OPEN")
    .map((p) => {
      const accepted = p.bids?.find((b) => b.status === "ACCEPTED");
      return {
        id: String(p.id),
        title: p.title,
        discipline: p.serviceType,
        engineerName: accepted?.engineer.user.name ?? "—",
        progressPercent: p.status === "IN_PROGRESS" ? 50 : 10,
        dueDate: new Date(p.updatedAt).toLocaleDateString(),
        escrowAmount: accepted
          ? formatMoney(accepted.price)
          : formatMoney(p.budget),
      };
    });
};

const NOTIFICATIONS_READ_KEY = "clinka.notifications.read";

function getReadNotificationIds(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_READ_KEY);
    const ids = raw ? (JSON.parse(raw) as string[]) : [];
    return new Set(ids);
  } catch {
    return new Set();
  }
}

export const fetchNotifications = async (): Promise<Notification[]> => {
  const [pendingReviews, escrow] = await Promise.all([
    fetchPendingReviews().catch(() => []),
    fetchEscrowPayments().catch(() => []),
  ]);
  const readIds = getReadNotificationIds();
  const items: Notification[] = pendingReviews.map((p) => ({
    id: `review-${p.projectId}`,
    title: `Review pending: ${p.projectTitle}`,
    time: "Now",
    read: readIds.has(`review-${p.projectId}`),
  }));
  escrow
    .filter((e) => e.status === "Pending")
    .forEach((e) => {
      items.push({
        id: `escrow-${e.id}`,
        title: `Fund escrow: ${e.projectTitle}`,
        time: "Pending",
        read: readIds.has(`escrow-${e.id}`),
      });
    });
  return items;
};

export const markNotificationRead = async (id: string): Promise<void> => {
  if (typeof window === "undefined") return;
  const read = getReadNotificationIds();
  read.add(id);
  localStorage.setItem(NOTIFICATIONS_READ_KEY, JSON.stringify([...read]));
};

export const fetchMessages = async (limit = 4): Promise<Message[]> => {
  const convs = await fetchConversations().catch(() => []);
  return convs.slice(0, limit).map((c) => ({
    id: String(c.id),
    name: c.participantName,
    preview: c.lastMessage ?? c.projectTitle,
    time: new Date(c.lastMessageAt).toLocaleDateString(),
    online: false,
    unread: 0,
  }));
};

import { releaseEscrowPayment } from "@/features/escrow/api/payments.api";

export const releaseMilestone = (milestoneId: string): Promise<void> =>
  releaseEscrowPayment(Number(milestoneId)).then(() => undefined);

export const fetchEscrowItems = async () => {
  const { fetchEscrowPayments } = await import(
    "@/features/escrow/api/payments.api"
  );
  const { formatMoney: fmt } = await import(
    "@/features/escrow/utils/formatMoney"
  );
  const items = await fetchEscrowPayments();
  return items.map((p) => ({
    id: String(p.id),
    milestoneId: String(p.id),
    label: p.projectTitle,
    project: p.projectTitle,
    status:
      p.status === "In escrow"
        ? ("In escrow" as const)
        : p.status === "Released"
          ? ("Released" as const)
          : ("Pending" as const),
    amount: fmt(p.amount),
    dueIn: new Date(p.updatedAt).toLocaleDateString(),
  }));
};
