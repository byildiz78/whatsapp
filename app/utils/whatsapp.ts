import { create, Whatsapp } from 'venom-bot';

let client: Whatsapp | null = null;
let qrCode: string | null = null;

export async function initializeClient() {
  if (client) {
    return client;
  }

  try {
    console.log('[WhatsApp] Creating new client...');
    client = await create(
      'whatsapp-session',
      (base64Qr) => {
        console.log('[WhatsApp] New QR code received');
        qrCode = base64Qr;
      },
      (statusSession) => {
        console.log('[WhatsApp] Status changed:', statusSession);
        if (statusSession === 'isLogged') {
          qrCode = null;
        }
      },
      {
        headless: 'new',
        browserArgs: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      }
    );
    
    console.log('[WhatsApp] Client created successfully');
    
    return client;
  } catch (error) {
    console.error('[WhatsApp] Error creating client:', error);
    throw error;
  }
}

export function getClient() {
  return client;
}

export function getQrCode() {
  return qrCode;
}

export function closeClient() {
  if (client) {
    client.close();
    client = null;
    qrCode = null;
  }
}
