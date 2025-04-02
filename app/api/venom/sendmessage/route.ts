import { NextRequest, NextResponse } from 'next/server';
import { getClient } from "@/app/utils/whatsapp";

export async function POST(request: NextRequest) {
  try {
    const { phoneNumber, message } = await request.json();

    // Validate inputs
    if (!phoneNumber || !message) {
      return NextResponse.json(
        { error: 'Phone number and message are required' },
        { status: 400 }
      );
    }

    // Format phone number (ensure it has country code and no special characters)
    let formattedPhoneNumber = phoneNumber.replace(/\D/g, '');
    
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

    console.log(`[WhatsApp API] Sending direct message to: ${chatId}`);
    
    // Send the message
    const result = await (client.sendText as any)(chatId, message);

    // Extract message ID from response
    const messageId = result?.id && typeof result.id === 'object' && 'id' in result.id ? 
      result.id.id : 
      String(result?.id || 'unknown');
    
    return NextResponse.json({
      success: true,
      messageId,
      recipient: chatId
    });
  } catch (error) {
    console.error('[WhatsApp API] Error sending direct message:', error);
    return NextResponse.json(
      { error: 'Failed to send direct message', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
