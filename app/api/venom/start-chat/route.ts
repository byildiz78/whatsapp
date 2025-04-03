import { NextRequest, NextResponse } from 'next/server';
import { getClient } from "@/app/utils/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const { phone } = await request.json();

    // Validate inputs
    if (!phone) {
      return NextResponse.json(
        { error: 'Phone number is required' },
        { status: 400 }
      );
    }

    // Format phone number (ensure it has country code and no special characters)
    let formattedPhoneNumber = phone.replace(/\D/g, '');
    
    // Add @ to the end for venom-bot format (phoneNumber@c.us)
    const chatId = `${formattedPhoneNumber}@c.us`;

    // Get WhatsApp client
    const client = getClient();
    
    if (!client) {
      return NextResponse.json(
        { error: 'WhatsApp client not initialized' },
        { status: 500 }
      );
    }

    console.log(`[WhatsApp API] Starting new chat with: ${chatId}`);
    
    // Send an empty message or get chat info to initialize the chat
    // This is just to make sure the chat exists in the system
    const initialMessage = "Merhaba! Yeni bir sohbet başlatıldı.";
    await (client.sendText as any)(chatId, initialMessage);

    // Return the chat information
    return NextResponse.json({
      id: chatId,
      name: formattedPhoneNumber,
      lastMessage: {
        body: initialMessage,
        fromMe: true,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('[WhatsApp API] Error starting new chat:', error);
    return NextResponse.json(
      { error: 'Failed to start new chat', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
