import { NextResponse } from "next/server";
import { getClient } from "@/app/utils/whatsapp";
import { type Chat as VenomChat, type Message as VenomMessage } from "venom-bot";
import { type Chat } from "@/types/chat";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Define a type for the possible status response
interface StatusResponse {
  id?: string;
  status?: string;
  t?: number | string;
  timestamp?: number | string;
  [key: string]: any; // Allow for other properties
}

export async function GET() {
  try {
    const client = getClient();
    if (!client) {
      return NextResponse.json(
        { error: "WhatsApp client not initialized" },
        { status: 401 }
      );
    }

    const chats = await client.getAllChats() as VenomChat[];
    const formattedChats: Chat[] = await Promise.all(chats.map(async (chat) => {
      const contact = await client?.getContact(chat.id._serialized);
      const msgs = (chat.msgs || []) as VenomMessage[];
      const lastMsg = msgs[0];
      
      // Get contact status which may include last seen information
      let lastSeen = undefined;
      try {
        // WhatsApp API'sinde değişiklik olduğu için getStatus fonksiyonu hata verebilir
        // Bu durumda chat.t değerini kullanacağız
        try {
          const statusInfo = await client.getStatus(chat.id._serialized) as StatusResponse;
          // Check if statusInfo has a timestamp property
          if (statusInfo) {
            if (statusInfo.t) {
              lastSeen = new Date(Number(statusInfo.t) * 1000).toISOString();
            } else if (statusInfo.timestamp) {
              lastSeen = new Date(Number(statusInfo.timestamp) * 1000).toISOString();
            }
          }
        } catch (statusError) {
          // Alternatif olarak chat.t değerini kullan
          if (chat.t) {
            lastSeen = new Date(Number(chat.t) * 1000).toISOString();
          } else if (chat.presence && 'lastSeen' in chat.presence) {
            // TypeScript'in presence.lastSeen özelliğini tanıması için 'in' operatörü kullanıyoruz
            lastSeen = new Date(Number((chat.presence as any).lastSeen) * 1000).toISOString();
          }
        }
      } catch (error) {
      }
      
      // Get the correct timestamp for the last message
      let messageTimestamp;
      if (lastMsg && lastMsg.timestamp) {
        // Convert Unix timestamp to ISO string if it's a number
        if (typeof lastMsg.timestamp === 'number') {
          messageTimestamp = new Date(lastMsg.timestamp * 1000).toISOString();
        } else {
          try {
            // Try to parse the timestamp if it's not a number
            messageTimestamp = new Date(lastMsg.timestamp).toISOString();
          } catch (e) {
            console.warn(`[WhatsApp API] Could not parse timestamp for chat ${chat.id._serialized}:`, e);
            messageTimestamp = new Date().toISOString();
          }
        }
      } else {
        // If no last message or timestamp, use current time
        messageTimestamp = new Date().toISOString();
      }
      
      // Eğer chat.t değeri varsa ve lastSeen tanımlanmamışsa, chat.t'yi lastSeen olarak kullan
      if (chat.t && !lastSeen) {
        lastSeen = new Date(Number(chat.t) * 1000).toISOString();
      }
      
      return {
        id: chat.id._serialized,
        name: chat.name || contact?.pushname || contact?.name || contact?.shortName || contact?.id.user || 'Unknown',
        lastMessage: lastMsg?.body || "",
        timestamp: messageTimestamp,
        unreadCount: chat.unreadCount || 0,
        avatar: contact?.profilePicThumbObj?.eurl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id._serialized}`,
        status: contact?.isOnline ? "online" : "offline",
        lastSeen: lastSeen,
        isBusiness: contact?.isBusiness || false,
        isUser: contact?.isUser || true,
        pushname: contact?.pushname || "",
        shortName: contact?.shortName || "",
        t: chat.t ? Number(chat.t) * 1000 : undefined
      };
    }));

    return NextResponse.json(formattedChats);
  } catch (error) {
    console.error("[WhatsApp API] Error getting chats:", error);
    return NextResponse.json(
      { error: "Failed to get chats" },
      { status: 500 }
    );
  }
}
