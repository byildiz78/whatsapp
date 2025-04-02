import { NextRequest, NextResponse } from "next/server";
import { create } from "venom-bot";
import { getClient } from "@/app/utils/whatsapp";
import { writeFile } from 'fs/promises';
import { join } from 'path';
import os from 'os';
import { isMediaCached, saveMediaToCache, getMediaFromCache } from "@/app/utils/media-cache";

interface Message {
  id: string;
  content: string;
  mediaUrl?: string;
  type: "text" | "image" | "video" | "document";
  timestamp: string;
  sender: "me" | "them";
  isRead: boolean;
}

// Venom'un mesaj tipi
interface VenomMessage {
  id: string | { id: string };
  body?: string;
  type: string;
  mimetype?: string;
  timestamp: number;
  fromMe: boolean;
  ack: number;
  mediaData?: any;
  mediaKey?: string;
  directPath?: string;
  size?: number;
  t?: number;
  notifyName?: string;
  from?: string;
  to?: string;
  self?: string;
  isNewMsg?: boolean;
  star?: boolean;
  recvFresh?: boolean;
  isFromTemplate?: boolean;
  broadcast?: boolean;
  mentionedJidList?: string[];
  isVcardOverMmsDocument?: boolean;
  isForwarded?: boolean;
  labels?: string[];
  ephemeralStartTimestamp?: number;
  ephemeralOutOfSync?: boolean;
  bizPrivacyStatus?: number;
  [key: string]: any;
}

// Venom'un API yanıt tipi
interface VenomResponse {
  id?: { id: string } | string;
  type?: string;
  t?: number;
  notifyName?: string;
  from?: string;
  to?: string;
  self?: string;
  ack?: number;
  isNewMsg?: boolean;
  star?: boolean;
  kicNotified?: boolean;
  recvFresh?: boolean;
  isFromTemplate?: boolean;
  pollInvalidated?: boolean;
  broadcast?: boolean;
  mentionedJidList?: any[];
  isVcardOverMmsDocument?: boolean;
  isForwarded?: boolean;
  hasReaction?: boolean;
  ephemeralOutOfSync?: boolean;
  productHeaderImageRejected?: boolean;
  lastPlaybackProgress?: number;
  isDynamicReplyButtonsMsg?: boolean;
  isMdHistoryMsg?: boolean;
  requiresDirectConnection?: boolean;
  pttForwardedFeaturesEnabled?: boolean;
  isEphemeral?: boolean;
  isStatusV3?: boolean;
  links?: any[];
  [key: string]: any;
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: NextRequest) {
  try {
    const client = getClient();
    if (!client) {
      return NextResponse.json(
        { error: "WhatsApp client not initialized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const chatId = searchParams.get("chatId");

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    // İki aşamalı tip dönüşümü
    const rawMessages = await client.getAllMessagesInChat(chatId, true, true) as unknown;
    const messages = rawMessages as VenomMessage[];
    
    // İşlenmiş mesaj ID'lerini takip et
    const processedIds = new Set<string>();
    
    const formattedMessages = await Promise.all(messages.map(async (msg) => {
      const msgId = msg.id as { id: string } | string | undefined;
      const id = typeof msgId === 'object' && msgId && 'id' in msgId && typeof msgId.id === 'string' ? 
        msgId.id : 
        String(msgId || 'unknown');

      // Eğer bu mesaj zaten işlendiyse, tekrar işleme
      if (processedIds.has(id)) {
        console.log("[WhatsApp API] Skipping duplicate message:", id);
        return null;
      }
      processedIds.add(id);

      let content = msg.body || "";
      let mediaUrl: string | undefined;
      let type: Message["type"] = "text";

      // Medya içeren mesajları işle
      if (msg.type === 'image' || msg.type === 'video' || msg.type === 'document') {
        try {
          // Önce cache'i kontrol et
          const cachedMedia = await getMediaFromCache(id);
          
          if (cachedMedia) {
            console.log("[WhatsApp API] Using cached media for message:", id);
            mediaUrl = `data:${cachedMedia.mimeType};base64,${cachedMedia.data.toString('base64')}`;
            content = '[Media]';
            type = msg.type;
          } else {
            console.log("[WhatsApp API] Downloading media for message:", id);
            
            // Medya URL'sini yenile
            const messageId = typeof msg.id === 'object' ? msg.id.id : msg.id;
            const mediaMessage = await client.getMessageById(messageId);
            
            if (!mediaMessage) {
              throw new Error('Failed to refresh media URL');
            }
            
            // Venom'un decryptFile fonksiyonunu kullan
            const buffer = await client.decryptFile(mediaMessage);

            if (buffer) {
              const mimeType = msg.mimetype || (
                msg.type === 'image' ? 'image/jpeg' :
                msg.type === 'video' ? 'video/mp4' :
                'application/octet-stream'
              );
              
              // Cache'e kaydet
              await saveMediaToCache(id, buffer, mimeType);
              
              content = '[Media]';
              mediaUrl = `data:${mimeType};base64,${buffer.toString('base64')}`;
              type = msg.type;
              
              console.log("[WhatsApp API] Media downloaded and cached successfully", {
                size: buffer.length,
                type: msg.type,
                mimeType
              });
            } else {
              console.error("[WhatsApp API] No media data received");
              content = '[Media Unavailable]';
            }
          }
        } catch (error) {
          console.error("[WhatsApp API] Error handling media:", {
            error,
            messageId: msg.id,
            type: msg.type
          });
          content = '[Media Error]';
        }
      }

      return {
        id,
        content,
        mediaUrl,
        type,
        timestamp: new Date(msg.timestamp * 1000).toISOString(),
        sender: msg.fromMe ? "me" : "them",
        isRead: msg.ack > 0
      };
    }));

    // İşlenmiş mesajları filtrele
    const filteredMessages = formattedMessages
      .filter((msg): msg is NonNullable<typeof msg> => msg !== null)
      .map((msg): Message => ({
        id: msg.id,
        content: msg.content,
        mediaUrl: msg.mediaUrl,
        type: msg.type as Message["type"],
        timestamp: msg.timestamp,
        sender: msg.sender as Message["sender"],
        isRead: msg.isRead
      }));

    return NextResponse.json(filteredMessages);
  } catch (error) {
    console.error("[WhatsApp API] Error getting messages:", error);
    return NextResponse.json(
      { error: "Failed to get messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const client = getClient();
    if (!client) {
      return NextResponse.json(
        { error: "WhatsApp client not initialized" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const chatId = formData.get("chatId") as string;
    const message = formData.get("message") as string;
    const file = formData.get("file") as File | null;

    if (!chatId) {
      return NextResponse.json(
        { error: "Chat ID is required" },
        { status: 400 }
      );
    }

    let result: VenomResponse;
    if (file) {
      try {
        // Geçici dosya yolu oluştur
        const tempDir = os.tmpdir();
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = join(tempDir, fileName);

        // Dosyayı geçici klasöre kaydet
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        console.log('[WhatsApp API] Sending file:', { 
          name: file.name, 
          type: file.type, 
          size: file.size,
          path: filePath
        });

        // Dosya tipine göre uygun metodu kullan
        if (file.type.startsWith('image/')) {
          const sendResult = await client.sendImage(
            chatId,
            filePath,
            file.name,
            message || ''
          ) as unknown;
          result = sendResult as VenomResponse;
        } else {
          const sendResult = await client.sendFile(
            chatId,
            filePath,
            file.name,
            message || ''
          ) as unknown;
          result = sendResult as VenomResponse;
        }

        // Geçici dosyayı temizlemeye çalış (ama hata durumunda devam et)
        try {
          await writeFile(filePath, '');
        } catch (cleanupError) {
          console.warn('[WhatsApp API] Failed to cleanup temp file:', cleanupError);
        }
      } catch (error) {
        console.error('[WhatsApp API] Error sending file:', error);
        return NextResponse.json(
          { error: "Failed to send file" },
          { status: 500 }
        );
      }
    } else if (message) {
      const sendResult = await client.sendText(chatId, message) as unknown;
      result = sendResult as VenomResponse;
    } else {
      return NextResponse.json(
        { error: "Message or file is required" },
        { status: 400 }
      );
    }

    const messageId = result.id && typeof result.id === 'object' && 'id' in result.id && typeof result.id.id === 'string' ? 
      result.id.id : 
      String(result.id || 'unknown');
    
    return NextResponse.json({
      success: true,
      messageId
    });
  } catch (error) {
    console.error("[WhatsApp API] Error sending message:", error);
    return NextResponse.json(
      { error: "Failed to send message" },
      { status: 500 }
    );
  }
}
