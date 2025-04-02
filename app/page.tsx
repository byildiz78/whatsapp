"use client";

import { useState, useEffect } from "react";
import { useSessionStore } from "@/lib/session";
import { ChatList } from "@/components/chat/chat-list";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import QRAuth from "@/components/auth/qr-auth";
import { Chat, Message } from "@/app/types/chat";

const formatDate = (date: Date) => {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function Home() {
  const { isAuthenticated, setAuthenticated, setSessionId, updateLastActive } = useSessionStore();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'pending' | 'authenticated' | 'error' | 'initializing'>('pending');
  const [isInitializing, setIsInitializing] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/venom/chats');
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      const data = await response.json();
      setChats(data);
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch chats');
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/venom/messages?chatId=${chatId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(prev => ({ ...prev, [chatId]: data }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch messages');
    }
  };

  const initializeWhatsApp = async () => {
    try {
      console.log('[WhatsApp] Initializing WhatsApp...');
      setIsInitializing(true);
      setAuthStatus('pending');
      
      const response = await fetch('/api/venom/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[WhatsApp] Failed to initialize WhatsApp:', errorData);
        setError(errorData.error || 'Failed to initialize WhatsApp');
        setAuthStatus('error');
        setAuthenticated(false);
        return;
      }

      const data = await response.json();
      console.log('[WhatsApp] Initialization response:', data);
      
      if (data.error) {
        setError(data.error);
        setAuthStatus('error');
        setAuthenticated(false);
      } else {
        setSessionId(data.sessionId);
        setAuthenticated(true);
        updateLastActive();
        setAttempts(data.attempts || 0);
        setAuthStatus(data.status || 'pending');
        setError(null);
      }
    } catch (error) {
      console.error('[WhatsApp] Error initializing WhatsApp:', error);
      setError(error instanceof Error ? error.message : 'Failed to initialize WhatsApp');
      setAuthStatus('error');
      setAuthenticated(false);
    }
  };

  const checkAuthStatus = async () => {
    try {
      console.log('[WhatsApp] Checking auth status...');
      const response = await fetch('/api/venom/auth');
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('[WhatsApp] Failed to check auth status:', errorData);
        setError(errorData.error || 'Failed to check auth status');
        setAuthStatus('error');
        return;
      }

      const data = await response.json();
      console.log('[WhatsApp] Auth status response:', data);
      
      if (data.error) {
        setError(data.error);
        setAuthStatus('error');
      } else {
        setQrCode(data.qrCode || null);
        setAttempts(data.attempts || 0);
        setAuthStatus(data.status || 'pending');
        setError(null);

        if (data.status === 'authenticated') {
          await fetchChats();
        }
      }
    } catch (error) {
      console.error('[WhatsApp] Error checking auth status:', error);
      setError(error instanceof Error ? error.message : 'Failed to check auth status');
      setAuthStatus('error');
    }
  };

  const pollChats = async () => {
    if (!isAuthenticated) return;
    
    try {
      const response = await fetch('/api/venom/chats');
      if (!response.ok) return;
      
      const data = await response.json();
      setChats(data);
      
      // Eğer seçili chat varsa, mesajlarını da güncelle
      if (selectedChat) {
        await pollMessages(selectedChat);
      }
    } catch (error) {
      console.error('Error polling chats:', error);
    }
  };

  const pollMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/venom/messages?chatId=${chatId}`);
      if (!response.ok) return;
      
      const data = await response.json();
      setMessages(prev => {
        const currentMessages = prev[chatId] || [];
        const newMessages = data.filter(
          (msg: Message) => !currentMessages.some(
            (curr: Message) => curr.id === msg.id
          )
        );
        
        if (newMessages.length > 0) {
          console.log('[WhatsApp] New messages received:', newMessages.length);
          return {
            ...prev,
            [chatId]: [...currentMessages, ...newMessages]
          };
        }
        
        return prev;
      });
    } catch (error) {
      console.error('Error polling messages:', error);
    }
  };

  useEffect(() => {
    console.log('[WhatsApp] Initial load, initializing WhatsApp...');
    initializeWhatsApp();
  }, []);

  useEffect(() => {
    if (authStatus === 'pending') {
      console.log('[WhatsApp] Auth status is pending, setting up polling...');
      const interval = setInterval(checkAuthStatus, 2000);
      return () => clearInterval(interval);
    }
  }, [authStatus]);

  useEffect(() => {
    if (isAuthenticated) {
      const interval = setInterval(() => {
        setLastUpdate(Date.now());
      }, 5000); // Her 5 saniyede bir güncelle
      
      return () => clearInterval(interval);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      pollChats();
    }
  }, [lastUpdate, isAuthenticated]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchChats();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    if (selectedChat) {
      fetchMessages(selectedChat);
    }
  }, [selectedChat]);

  const handleSendMessage = async (message: string, file: File | null) => {
    if (!selectedChat) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append("chatId", selectedChat);
      formData.append("message", message);
      if (file) {
        formData.append("file", file);
      }

      const response = await fetch('/api/venom/messages', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const newMessage: Message = {
        id: Date.now().toString(),
        content: message,
        timestamp: new Date().toISOString(),
        sender: "me",
        isRead: false,
        type: file ? 
          file.type.startsWith("image/") ? "image" :
          file.type.startsWith("video/") ? "video" :
          file.type === "application/pdf" ? "document" :
          "text" : "text",
        mediaUrl: file ? URL.createObjectURL(file) : undefined
      };

      setMessages((prev) => ({
        ...prev,
        [selectedChat]: [...(prev[selectedChat] || []), newMessage],
      }));

      // Sohbeti güncelle
      const selectedChatData = chats.find((chat) => chat.id === selectedChat);
      if (selectedChatData) {
        const updatedChat: Chat = {
          ...selectedChatData,
          lastMessage: file ? "[Media]" : message,
          timestamp: new Date().toISOString(),
        };

        setChats((prev) =>
          prev.map((chat) =>
            chat.id === selectedChat ? updatedChat : chat
          )
        );
      }

      // Mesajları yenile
      await fetchMessages(selectedChat);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <QRAuth 
        qrCode={qrCode}
        setQrCode={setQrCode}
        authStatus={authStatus}
        setAuthStatus={setAuthStatus}
        isInitializing={isInitializing}
        setIsInitializing={setIsInitializing}
        attempts={attempts}
        setAttempts={setAttempts}
        onAuthSuccess={(sessionId: string) => {
          setAuthenticated(true);
          setSessionId(sessionId);
        }}
      />
    );
  }

  const selectedChatData = chats.find((chat) => chat.id === selectedChat);

  return (
    <div className="flex h-screen bg-background">
      <ChatList
        chats={chats}
        selectedChat={selectedChat}
        onSelectChat={setSelectedChat}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />
      <div className="flex-1 flex flex-col">
        {selectedChat && selectedChatData ? (
          <>
            <ChatHeader chat={selectedChatData} />
            <MessageList messages={messages[selectedChat] || []} />
            <MessageInput onSendMessage={handleSendMessage} isLoading={isLoading} />
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