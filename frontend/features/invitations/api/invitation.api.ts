import api from "@/lib/axios";
import { Project } from "@/types";

export interface ProjectInvitation {
  id: number;
  projectId: number;
  engineerId: number;
  clientId: number;
  status: "PENDING" | "ACCEPTED" | "DECLINED" | "EXPIRED" | "CANCELLED";
  expiresAt: string;
  createdAt: string;
  updatedAt: string;
  project?: {
    id: number;
    title: string;
    budget: number;
    serviceType: string;
    status: string;
  };
  client?: {
    id: number;
    name: string;
    avatarUrl: string | null;
  };
  engineer?: {
    name: string;
    avatarUrl: string | null;
    profile?: {
      specialty: string | null;
      nationality: string | null;
    };
  };
}

export const fetchMyOpenProjects = async (): Promise<Project[]> => {
  const res = await api.get<{ data: Project[] }>("/projects/my/open");
  return res.data.data;
};

export const inviteEngineer = async (projectId: number, engineerId: number): Promise<ProjectInvitation> => {
  const res = await api.post<{ data: ProjectInvitation }>(`/projects/${projectId}/invite`, { engineerId });
  return res.data.data;
};

export const fetchMyInvitations = async (): Promise<ProjectInvitation[]> => {
  const res = await api.get<{ data: ProjectInvitation[] }>("/projects/invitations");
  return res.data.data;
};

export const respondToInvitation = async (id: number, action: "ACCEPT" | "DECLINE"): Promise<ProjectInvitation> => {
  const res = await api.patch<{ data: ProjectInvitation }>(`/projects/invitations/${id}/respond`, { action });
  return res.data.data;
};

export const markInvitationViewed = async (id: number): Promise<void> => {
  await api.patch(`/projects/invitations/${id}/view`);
};

export const fetchProjectInvitations = async (projectId: number): Promise<ProjectInvitation[]> => {
  const res = await api.get<{ data: ProjectInvitation[] }>(`/projects/${projectId}/invitations`);
  return res.data.data;
};

export const cancelInvitation = async (invitationId: number): Promise<ProjectInvitation> => {
  const res = await api.patch<{ data: ProjectInvitation }>(`/projects/invitations/${invitationId}/cancel`);
  return res.data.data;
};
