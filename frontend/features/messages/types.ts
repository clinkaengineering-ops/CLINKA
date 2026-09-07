export interface ConversationListItem {
  id: number;
  projectId: string | null;
  projectTitle: string;
  projectStatus: string;
  participantId: string;
  participantName: string;
  lastMessage: string | null;
  lastMessageAt: string;
}

export interface MessageSender {
  id: string;
  name: string;
  role: string;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: string;
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
  projectId: string | null;
  clientId: string;
  engineerId: string;
  createdAt: string;
  project: { id: string; title: string; status: string } | null;
  client: { id: string; name: string };
  engineer: { id: string; name: string };
}
