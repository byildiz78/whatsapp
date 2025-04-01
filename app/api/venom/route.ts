import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

let client: any = null;

const getVenom = async () => {
  if (typeof window === 'undefined') {
    const { create } = await import('venom-bot');
    return create;
  }
  return null;
};

export async function POST(req: Request) {
  try {
    if (!client) {
      const create = await getVenom();
      if (!create) {
        throw new Error('Failed to load venom-bot');
      }
      
      client = await create({
        session: "whatsapp-session",
        multidevice: true,
      });
    }

    const { action, data } = await req.json();

    switch (action) {
      case "send-message":
        const { to, message } = data;
        await client.sendText(to, message);
        return NextResponse.json({ success: true });

      case "get-messages":
        // This is a placeholder - Venom-bot doesn't have a direct method to fetch messages
        // You'll need to implement message storage and retrieval
        return NextResponse.json({ messages: [] });

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }
  } catch (error) {
    console.error("WhatsApp API Error:", error);
    return NextResponse.json(
      { error: "Failed to process WhatsApp action" },
      { status: 500 }
    );
  }
}