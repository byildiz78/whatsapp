"use client";

import { Phone, Video, MoreVertical, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { type Chat } from "@/types/chat";
import { format, formatDistanceToNow, isToday, isYesterday } from "date-fns";
import { tr } from "date-fns/locale";

interface ChatHeaderProps {
  chat: Chat;
}

export function ChatHeader({ chat }: ChatHeaderProps) {
  // Fonksiyon: Son görülme zamanını formatla
  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return "En son görüldü";
    
    try {
      const date = new Date(lastSeen);
      
      // Bugün ise
      if (isToday(date)) {
        return `En son bugün görüldü ${format(date, 'HH:mm')}`;
      } 
      // Dün ise
      else if (isYesterday(date)) {
        return `En son dün görüldü ${format(date, 'HH:mm')}`;
      } 
      // Son 7 gün içinde ise
      else if (Date.now() - date.getTime() < 7 * 24 * 60 * 60 * 1000) {
        return `En son ${format(date, 'EEEE', { locale: tr })} at ${format(date, 'HH:mm')}`;
      } 
      // Daha eski ise
      else {
        return `En son ${format(date, 'dd MMM yyyy', { locale: tr })} at ${format(date, 'HH:mm')}`;
      }
    } catch (error) {
      console.error("Error formatting last seen date:", error);
      return "En son görüldü";
    }
  };

  return (
    <div className="p-4 bg-card border-b flex items-center justify-between">
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
        <div>
          <div className="flex items-center gap-1">
            <h2 className="font-semibold">{chat.name}</h2>
            {chat.pushname && chat.pushname !== chat.name && (
              <span className="text-xs text-muted-foreground">({chat.pushname})</span>
            )}
          </div>
          <p className="text-sm text-muted-foreground">
            {chat.status === "online"
              ? "Online"
              : chat.status === "typing"
              ? "typing..."
              : formatLastSeen(chat.lastSeen)}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon">
          <Phone className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <Video className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon">
          <MoreVertical className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}