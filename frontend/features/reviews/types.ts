export interface ReviewClient {
  id: number;
  name: string;
}

export interface ReviewProject {
  id: number;
  title: string;
}

export interface Review {
  id: number;
  projectId: number;
  clientId: number;
  engineerId: number;
  rating: number;
  comment: string | null;
  createdAt: string;
  client?: ReviewClient;
  project?: ReviewProject;
}

export interface PendingReviewProject {
  projectId: number;
  projectTitle: string;
  amount: number;
  engineerUserId: number;
  engineerName: string;
  projectStatus: string;
  paymentReleasedAt?: string;
}

export interface ReviewEligibility {
  canReview: boolean;
  hasReview: boolean;
  review: Review | null;
}

export interface CreateReviewPayload {
  rating: number;
  comment?: string;
}
