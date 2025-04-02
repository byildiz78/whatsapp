import { NextResponse } from "next/server";
import { getClient, getQrCode, initWhatsapp } from "@/app/utils/whatsapp";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  try {
    const client = getClient();
    const qrCode = getQrCode();

    if (client) {
      return NextResponse.json({ status: "authenticated" });
    }

    if (!qrCode) {
      await initWhatsapp();
    }

    return NextResponse.json({ 
      status: "pending",
      qrCode: qrCode 
    });
  } catch (error) {
    console.error("[WhatsApp API] Error in auth route:", error);
    return NextResponse.json(
      { error: "Failed to authenticate" },
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