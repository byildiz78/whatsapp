"use client";

import { useEffect, useState } from "react";
import { MessageSquare, Send, Loader2, RefreshCcw, Search, Phone, Video, MoreVertical, Paperclip, Smile, Image, Mic } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Message {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

interface Chat {
  id: string;
  name: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  avatar: string;
  status: "online" | "offline" | "typing";
  lastSeen?: string;
}

export default function Home() {
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState("");
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'pending' | 'authenticated' | 'error'>('pending');
  const [isInitializing, setIsInitializing] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

  const initializeWhatsApp = async () => {
    try {
      setIsInitializing(true);
      setAuthStatus('pending');
      const response = await fetch('/api/venom/auth', { method: 'POST' });
      const data = await response.json();
      
      if (data.error) {
        setAuthStatus('error');
        return;
      }
      
      checkAuthStatus();
    } catch (error) {
      console.error('Failed to initialize WhatsApp:', error);
      setAuthStatus('error');
    }
  };

  const checkAuthStatus = async () => {
    try {
      const response = await fetch('/api/venom/auth');
      const data = await response.json();
      
      setQrCode(data.qrCode);
      setAuthStatus(data.status);
      setAttempts(data.attempts);
      
      if (data.status === 'pending' && data.qrCode) {
        setTimeout(checkAuthStatus, 1000);
      } else if (data.status === 'authenticated') {
        setIsInitializing(false);
      }
    } catch (error) {
      console.error('Failed to check auth status:', error);
      setAuthStatus('error');
    }
  };

  useEffect(() => {
    initializeWhatsApp();
  }, []);

  const chats: Chat[] = [
    {
      id: "1",
      name: "John Doe",
      lastMessage: "Hey, how are you?",
      timestamp: "10:30 AM",
      unreadCount: 2,
      avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop",
      status: "online"
    },
    {
      id: "2",
      name: "Jane Smith",
      lastMessage: "Can we meet tomorrow?",
      timestamp: "Yesterday",
      unreadCount: 0,
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&h=400&fit=crop",
      status: "typing"
    },
    {
      id: "3",
      name: "Alice Johnson",
      lastMessage: "Thanks for your help!",
      timestamp: "2:15 PM",
      unreadCount: 1,
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400&h=400&fit=crop",
      status: "offline",
      lastSeen: "2 hours ago"
    }
  ];

  const messages: { [key: string]: Message[] } = {
    "1": [
      {
        id: "1",
        sender: "John Doe",
        content: "Hey, how are you?",
        timestamp: "10:30 AM",
        isRead: true,
      },
      {
        id: "2",
        sender: "You",
        content: "I'm good, thanks! How about you?",
        timestamp: "10:31 AM",
        isRead: true,
      },
    ],
    "2": [
      {
        id: "1",
        sender: "Jane Smith",
        content: "Can we meet tomorrow?",
        timestamp: "Yesterday",
        isRead: false,
      },
    ],
    "3": [
      {
        id: "1",
        sender: "Alice Johnson",
        content: "Thanks for your help!",
        timestamp: "2:15 PM",
        isRead: false,
      },
    ],
  };

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedChat) return;
    console.log("Sending message:", messageInput, "to chat:", selectedChat);
    setMessageInput("");
  };

  const filteredChats = chats.filter(chat => 
    chat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    chat.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center space-y-4 p-8 max-w-md w-full">
          <h1 className="text-2xl font-bold mb-8">WhatsApp Bağlantısı</h1>
          
          {authStatus === 'error' ? (
            <Alert variant="destructive" className="mb-4">
              <AlertTitle>Bağlantı Hatası</AlertTitle>
              <AlertDescription className="mt-2">
                WhatsApp bağlantısı sırasında bir hata oluştu.
                {attempts >= 3 && (
                  <div className="mt-2">
                    Maksimum deneme sayısına ulaşıldı. Lütfen sayfayı yenileyip tekrar deneyin.
                  </div>
                )}
                <Button 
                  onClick={initializeWhatsApp} 
                  variant="outline" 
                  className="mt-4 w-full"
                >
                  <RefreshCcw className="w-4 h-4 mr-2" />
                  Tekrar Dene
                </Button>
              </AlertDescription>
            </Alert>
          ) : qrCode ? (
            <>
              <p className="text-muted-foreground mb-4">
                WhatsApp Web'e bağlanmak için QR kodu telefonunuzdan tarayın:
              </p>
              <div className="bg-white p-4 rounded-lg shadow-lg inline-block">
                <img
                  src={qrCode}
                  alt="WhatsApp QR Code"
                  className="w-64 h-64"
                />
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                1. WhatsApp'ı telefonunuzda açın
                <br />
                2. Ayarlar veya Üç Nokta menüsüne tıklayın
                <br />
                3. "Bağlı Cihazlar" seçeneğini seçin
                <br />
                4. "Cihaz Bağla"ya tıklayın
                <br />
                5. Bu QR kodu tarayın
              </p>
            </>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 animate-spin" />
              <p>WhatsApp başlatılıyor...</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      {/* Sidebar */}
      <div className="w-[380px] border-r flex flex-col">
        <div className="p-4 bg-card border-b">
          <h1 className="text-2xl font-bold flex items-center gap-2 mb-4">
            <MessageSquare className="w-6 h-6" />
            Messages
          </h1>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search chats..."
              className="pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
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
                onClick={() => setSelectedChat(chat.id)}
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
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold">{chat.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {chat.timestamp}
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

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {selectedChat ? (
          <>
            {/* Chat Header */}
            <div className="p-4 bg-card border-b flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage
                    src={chats.find((c) => c.id === selectedChat)?.avatar}
                    alt={chats.find((c) => c.id === selectedChat)?.name}
                  />
                  <AvatarFallback>
                    {chats.find((c) => c.id === selectedChat)?.name[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="font-semibold">
                    {chats.find((c) => c.id === selectedChat)?.name}
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {chats.find((c) => c.id === selectedChat)?.status === "online"
                      ? "Online"
                      : chats.find((c) => c.id === selectedChat)?.status === "typing"
                      ? "typing..."
                      : "Last seen " + chats.find((c) => c.id === selectedChat)?.lastSeen}
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

            {/* Messages */}
            <ScrollArea className="flex-1 p-4 bg-secondary/20">
              <div className="space-y-4">
                {messages[selectedChat]?.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === "You" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`max-w-[70%] rounded-lg p-3 ${
                        message.sender === "You"
                          ? "bg-primary text-primary-foreground"
                          : "bg-card"
                      }`}
                    >
                      <p>{message.content}</p>
                      <div className="text-xs mt-1 opacity-70 flex items-center gap-1 justify-end">
                        {message.timestamp}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            {/* Message Input */}
            <div className="p-4 border-t bg-card">
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon">
                  <Smile className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Paperclip className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="icon">
                  <Image className="w-4 h-4" />
                </Button>
                <Input
                  placeholder="Type a message..."
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") handleSendMessage();
                  }}
                  className="flex-1"
                />
                {messageInput.trim() ? (
                  <Button onClick={handleSendMessage}>
                    <Send className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="icon">
                    <Mic className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
}