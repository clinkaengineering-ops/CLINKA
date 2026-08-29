export interface ConversationListItem {
  id: number;
  projectId: number | null;
  projectTitle: string;
  projectStatus: string;
  participantId: number;
  participantName: string;
  lastMessage: string | null;
  lastMessageAt: string;
}

export interface MessageSender {
  id: number;
  name: string;
  role: string;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  attachmentUrl?: string | null;
  attachmentName?: string | null;
  attachmentMime?: string | null;
  createdAt: string;
  sender: MessageSender;
}

export interface MessagesPage {
  messages: ChatMessage[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ConversationDetail {
  id: number;
  projectId: number | null;
  clientId: number;
  engineerId: number;
  createdAt: string;
  project: { id: number; title: string; status: string } | null;
  client: { id: number; name: string };
  engineer: { id: number; name: string };
}
