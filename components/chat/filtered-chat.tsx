"use client";

import { useState, useEffect } from "react";
import { useSessionStore } from "@/lib/session";
import { ChatHeader } from "@/components/chat/chat-header";
import { MessageList } from "@/components/chat/message-list";
import { MessageInput } from "@/components/chat/message-input";
import QRAuth from "@/components/auth/qr-auth";
import { Chat, Message } from "@/app/types/chat";
import { Button } from "@/components/ui/button";
import { MessageCircle } from "lucide-react";

const formatDate = (date: Date) => {
  return date.toLocaleTimeString('tr-TR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function FilteredChat({ phone }: { phone: string }) {
  const { isAuthenticated, setAuthenticated, setSessionId, updateLastActive } = useSessionStore();
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [authStatus, setAuthStatus] = useState<'pending' | 'authenticated' | 'error' | 'initializing'>('pending');
  const [isInitializing, setIsInitializing] = useState(true);
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [chats, setChats] = useState<Chat[]>([]);
  const [messages, setMessages] = useState<Record<string, Message[]>>({});
  const [isLoading, setIsLoading] = useState(false);

  const fetchChats = async () => {
    try {
      const response = await fetch('/api/venom/chats');
      if (!response.ok) {
        throw new Error('Failed to fetch chats');
      }
      const data = await response.json();
      const filteredData = data.filter((chat: Chat) => chat.id.includes(phone));
      setChats(filteredData);
      if (filteredData.length > 0 && !selectedChat) {
        setSelectedChat(filteredData[0].id);
      }
    } catch (error) {
      console.error('Error fetching chats:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch chats');
    }
  };

  const startNewChat = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/venom/start-chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ phone })
      });

      if (!response.ok) {
        throw new Error('Failed to start new chat');
      }

      const newChat = await response.json();
      setChats([newChat]);
      setSelectedChat(newChat.id);
      setError(null);
    } catch (error) {
      console.error('Error starting new chat:', error);
      setError(error instanceof Error ? error.message : 'Failed to start new chat');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMessages = async (chatId: string) => {
    try {
      const response = await fetch(`/api/venom/messages?chatId=${chatId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages');
      }
      const data = await response.json();
      setMessages(prev => ({
        ...prev,
        [chatId]: data
      }));
    } catch (error) {
      console.error('Error fetching messages:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch messages');
    }
  };

  const handleSendMessage = async (message: string, file: File | null) => {
    if (!selectedChat) return;
    
    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('chatId', selectedChat);
      formData.append('message', message);
      if (file) {
        formData.append('file', file);
      }

      const response = await fetch('/api/venom/send', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      await fetchMessages(selectedChat);
    } catch (error) {
      console.error('Error sending message:', error);
      setError(error instanceof Error ? error.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

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

  if (!isAuthenticated) {
    return <QRAuth 
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
    />;
  }

  const selectedChatData = chats.find(chat => chat.id === selectedChat);

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      {selectedChatData && selectedChat ? (
        <>
          <ChatHeader chat={selectedChatData} />
          <MessageList messages={messages[selectedChat] || []} />
          <MessageInput 
            onSendMessage={handleSendMessage}
            isLoading={isLoading}
          />
        </>
      ) : (
        <div className="flex flex-col items-center justify-center h-full space-y-4">
          <p className="text-gray-600">Bu numara ile henüz bir sohbet başlatılmamış.</p>
          <Button 
            onClick={startNewChat} 
            disabled={isLoading}
            className="flex items-center space-x-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Yeni Sohbet Başlat</span>
          </Button>
        </div>
      )}
      {error && (
        <div className="text-red-500 p-4">
          {error}
        </div>
      )}
    </div>
  );
}
