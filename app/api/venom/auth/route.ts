import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

let qrCode: string | null = null;
let client: any = null;
let authStatus: 'pending' | 'authenticated' | 'error' = 'pending';
let initializationAttempts = 0;
const MAX_ATTEMPTS = 3;

// Import venom-bot dynamically only on the server side
const getVenom = async () => {
  if (typeof window === 'undefined') {
    const { create } = await import('venom-bot');
    return create;
  }
  return null;
};

export async function GET() {
  return NextResponse.json({
    qrCode,
    status: authStatus,
    attempts: initializationAttempts
  });
}

export async function POST() {
  try {
    if (client) {
      return NextResponse.json({ status: authStatus });
    }

    if (initializationAttempts >= MAX_ATTEMPTS) {
      authStatus = 'error';
      return NextResponse.json(
        { error: 'Maximum initialization attempts reached' },
        { status: 500 }
      );
    }

    initializationAttempts++;

    const create = await getVenom();
    if (!create) {
      throw new Error('Failed to load venom-bot');
    }

    client = await create({
      session: 'whatsapp-session',
      catchQR: (base64Qr) => {
        qrCode = base64Qr;
      },
      statusFind: (status) => {
        console.log('Status:', status);
        if (status === 'isLogged') {
          authStatus = 'authenticated';
          qrCode = null;
        } else if (status === 'notLogged') {
          authStatus = 'pending';
        } else if (status === 'browserClose') {
          authStatus = 'error';
          client = null;
        }
      },
      multidevice: true,
      headless: 'new',
      useChrome: false,
      debug: false
    });

    return NextResponse.json({ status: 'initializing' });
  } catch (error) {
    console.error('WhatsApp Authentication Error:', error);
    authStatus = 'error';
    client = null;
    return NextResponse.json(
      { error: 'Failed to initialize WhatsApp' },
      { status: 500 }
    );
  }
}