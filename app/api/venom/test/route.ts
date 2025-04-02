import { NextResponse } from "next/server";
import type { Whatsapp } from 'venom-bot';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

let client: Whatsapp | null = null;

export async function GET() {
  try {
    console.log('Testing venom-bot initialization...');
    
    if (!client) {
      console.log('Importing venom-bot...');
      const { create } = await import('venom-bot');
      
      console.log('Creating new session...');
      client = await create({
        session: 'test-session',
        browserArgs: [
          '--no-sandbox',
          '--disable-setuid-sandbox'
        ],
        createPathFileToken: true,
        debug: true,
        disableWelcome: true
      });
      
      console.log('Session created successfully');
    }
    
    return NextResponse.json({ status: 'success', message: 'WhatsApp initialized' });
  } catch (error) {
    console.error('Test failed:', error);
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
