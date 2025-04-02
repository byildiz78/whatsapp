export interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar: string;
  status: "online" | "offline";
}

export interface Message {
  id: string;
  content: string;
  timestamp: string;
  sender: "me" | "them";
  isRead: boolean;
  type?: "text" | "image" | "video" | "document";
  mediaUrl?: string;
}
