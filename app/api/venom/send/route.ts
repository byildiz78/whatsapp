import { NextRequest, NextResponse } from 'next/server';
import { getClient } from "@/app/utils/whatsapp";
import { writeFile } from 'fs/promises';
import { join } from 'path';
import os from 'os';

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

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const chatId = formData.get('chatId') as string;
    const message = formData.get('message') as string;
    const file = formData.get('file') as File | null;

    if (!chatId || (!message && !file)) {
      return NextResponse.json(
        { error: 'Chat ID and either message or file are required' },
        { status: 400 }
      );
    }

    const client = getClient();
    
    if (!client) {
      return NextResponse.json(
        { error: 'WhatsApp client not initialized' },
        { status: 500 }
      );
    }

    let result: VenomResponse;

    if (file) {
      try {
        // Create temporary file path
        const tempDir = os.tmpdir();
        const fileName = `${Date.now()}-${file.name}`;
        const filePath = join(tempDir, fileName);

        // Save file to temporary directory
        const bytes = await file.arrayBuffer();
        await writeFile(filePath, Buffer.from(bytes));

        console.log('[WhatsApp API] Sending file:', { 
          name: file.name, 
          type: file.type, 
          size: file.size,
          path: filePath
        });

        // Use appropriate method based on file type
        if (file.type.startsWith('image/')) {
          result = await (client.sendImage as any)(
            chatId,
            filePath,
            file.name,
            message || ''
          );
        } else {
          result = await (client.sendFile as any)(
            chatId,
            filePath,
            file.name,
            message || ''
          );
        }

        // Try to cleanup temp file (but continue if it fails)
        try {
          await writeFile(filePath, '');
        } catch (cleanupError) {
          console.warn('[WhatsApp API] Failed to cleanup temp file:', cleanupError);
        }
      } catch (error) {
        console.error('[WhatsApp API] Error sending file:', error);
        return NextResponse.json(
          { error: 'Failed to send file' },
          { status: 500 }
        );
      }
    } else {
      result = await (client.sendText as any)(chatId, message);
    }

    const messageId = result?.id && typeof result.id === 'object' && 'id' in result.id ? 
      result.id.id : 
      String(result?.id || 'unknown');
    
    return NextResponse.json({
      success: true,
      messageId
    });
  } catch (error) {
    console.error('[WhatsApp API] Error sending message:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
