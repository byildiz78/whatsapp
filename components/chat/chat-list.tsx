"use client";

import { Search, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type Chat } from "@/types/chat";
import { format, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";

interface ChatListProps {
  chats: Chat[];
  selectedChat: string | null;
  onSelectChat: (chatId: string) => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function ChatList({
  chats,
  selectedChat,
  onSelectChat,
  searchQuery,
  onSearchChange,
}: ChatListProps) {
  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Function to format timestamp like WhatsApp
  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      
      // Artık UTC+3 eklemeye gerek yok, zaten ISO formatında zaman dilimi bilgisi var
      
      if (isToday(date)) {
        // If today, show only time in 24-hour format
        return format(date, 'HH:mm');
      } else if (isYesterday(date)) {
        // If yesterday, show "Dün"
        return "Dün";
      } else {
        // If other day, show date in Turkish format
        return format(date, 'd MMM', { locale: tr });
      }
    } catch (error) {
      console.error("Error formatting date:", error);
      return "";
    }
  };

  // Son görülme zamanını veya son mesaj zamanını seç
  const getDisplayTime = (chat: Chat) => {
    // Eğer son görülme zamanı varsa ve bugün veya dün ise, onu göster
    if (chat.lastSeen) {
      try {
        const lastSeenDate = new Date(chat.lastSeen);
        return formatTimestamp(chat.lastSeen);
      } catch (error) {
        // Hata durumunda son mesaj zamanını göster
        return formatTimestamp(chat.timestamp);
      }
    }
    
    // Son görülme zamanı yoksa son mesaj zamanını göster
    return formatTimestamp(chat.timestamp);
  };

  return (
    <div className="w-[380px] border-r flex flex-col">
      <div className="p-4 bg-card border-b">
        <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
          Sohbetler
        </h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="Sohbet ara..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
      </div>
      <ScrollArea className="flex-1">
        {filteredChats.map((chat) => (
          <div key={chat.id}>
            <button
              className={`w-full p-4 text-left hover:bg-accent transition-colors ${
                selectedChat === chat.id ? "bg-accent" : ""
              }`}
              onClick={() => onSelectChat(chat.id)}
            >
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar>
                    <AvatarImage src={chat.avatar} alt={chat.name} />
                    <AvatarFallback>{chat.name[0]}</AvatarFallback>
                  </Avatar>
                  {chat.status === "online" && (
                    <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-background"></span>
                  )}
                  {chat.isBusiness && (
                    <span className="absolute top-0 right-0 w-4 h-4 bg-blue-500 rounded-full border-2 border-background flex items-center justify-center">
                      <Briefcase className="w-2 h-2 text-white" />
                    </span>
                  )}
                </div>
                <div className="flex-1 overflow-hidden">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{chat.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {getDisplayTime(chat)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground truncate">
                    {chat.status === "typing" ? (
                      <span className="text-primary">typing...</span>
                    ) : (
                      chat.lastMessage
                    )}
                  </p>
                </div>
                {chat.unreadCount > 0 && (
                  <span className="bg-primary text-primary-foreground rounded-full px-2 py-1 text-xs">
                    {chat.unreadCount}
                  </span>
                )}
              </div>
            </button>
            <Separator />
          </div>
        ))}
      </ScrollArea>
    </div>
  );
}