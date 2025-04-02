export interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  type?: 'text' | 'image' | 'file';
  fileUrl?: string;
  fileName?: string;
}

export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar: string;
  status: "online" | "offline" | "typing";
  lastSeen?: string;
  isBusiness?: boolean;
  isUser?: boolean;
  pushname?: string;
  shortName?: string;
  t?: number;
}