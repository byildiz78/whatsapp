import { NextResponse } from "next/server";
import { getClient } from "@/app/utils/whatsapp";
import { type Chat as VenomChat, type Message as VenomMessage } from "venom-bot";
import { type Chat } from "@/types/chat";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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
      
      return {
        id: chat.id._serialized,
        name: chat.name || contact?.pushname || contact?.id.user || 'Unknown',
        lastMessage: lastMsg?.body || "",
        timestamp: String(lastMsg?.timestamp || new Date().toISOString()),
        unreadCount: chat.unreadCount || 0,
        avatar: contact?.profilePicThumbObj?.eurl || `https://api.dicebear.com/7.x/avataaars/svg?seed=${chat.id._serialized}`,
        status: contact?.isOnline ? "online" : "offline"
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
