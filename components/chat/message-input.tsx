"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Paperclip, Send } from "lucide-react";
import { cn } from "@/lib/utils";

interface MessageInputProps {
  onSendMessage: (message: string, file: File | null) => Promise<void>;
  isLoading: boolean;
}

export function MessageInput({ onSendMessage, isLoading }: MessageInputProps) {
  const [message, setMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() && !selectedFile) return;

    await onSendMessage(message, selectedFile);
    setMessage("");
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Dosya boyutu kontrolü (örn: 10MB)
      if (file.size > 10 * 1024 * 1024) {
        console.error('File is too large. Maximum size is 10MB');
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
        return;
      }
      setSelectedFile(file);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2 items-end">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept="image/*,video/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
      />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => fileInputRef.current?.click()}
        disabled={isLoading}
        className={cn(
          "flex-shrink-0",
          selectedFile && "text-primary"
        )}
      >
        <Paperclip className="h-5 w-5" />
      </Button>
      <div className="flex-1 flex flex-col gap-2">
        {selectedFile && (
          <div className="text-xs text-muted-foreground">
            Selected: {selectedFile.name}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedFile(null);
                if (fileInputRef.current) {
                  fileInputRef.current.value = "";
                }
              }}
              className="ml-2 h-4 px-1"
            >
              ✕
            </Button>
          </div>
        )}
        <Textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message"
          disabled={isLoading}
          className="min-h-[2.5rem] max-h-32 resize-none"
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e);
            }
          }}
        />
      </div>
      <Button
        type="submit"
        variant="ghost"
        size="icon"
        disabled={isLoading || (!message.trim() && !selectedFile)}
        className="flex-shrink-0"
      >
        <Send className="h-5 w-5" />
      </Button>
    </form>
  );
}