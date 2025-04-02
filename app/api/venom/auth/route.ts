import { NextResponse } from "next/server";
import { getClient, getQrCode, initializeClient } from "@/app/utils/whatsapp";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const client = getClient();
    if (!client) {
      await initializeClient();
    }

    const qrCode = getQrCode();
    return NextResponse.json({ qrCode });
  } catch (error) {
    console.error('[WhatsApp API] Error in auth route:', error);
    return NextResponse.json(
      { error: 'Failed to initialize WhatsApp client' },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    const client = getClient();
    if (!client) {
      return NextResponse.json(
        { error: "WhatsApp client not initialized" },
        { status: 401 }
      );
    }

    return NextResponse.json({ status: "authenticated" });
  } catch (error) {
    console.error("[WhatsApp API] Error in auth route:", error);
    return NextResponse.json(
      { error: "Failed to authenticate" },
      { status: 500 }
    );
  }
}