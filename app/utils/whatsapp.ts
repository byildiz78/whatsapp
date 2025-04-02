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
      (base64Qr: string) => {
        console.log('[WhatsApp] New QR code received');
        qrCode = base64Qr;
      },
      (statusSession: string) => {
        console.log('[WhatsApp] Status changed:', statusSession);
        if (statusSession === 'isLogged') {
          qrCode = null;
        }
      },
      {
        headless: 'new',
        useChrome: false,
        browserArgs: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ],
        createPathFileToken: true,
        createPathFileSession: true,
        disableWelcome: true,
        updatesLog: true,
        autoClose: 0,
        catchQR: (base64Qr: string) => {
          qrCode = base64Qr;
        },
        statusFind: (statusSession: string) => {
          console.log('[WhatsApp] Status:', statusSession);
          if (statusSession === 'isLogged') {
            qrCode = null;
          }
        },
        browser: 'Chromium',
        browserPathExecutable: '/usr/bin/chromium',
        puppeteerOptions: {
          executablePath: '/usr/bin/chromium',
          headless: 'new',
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--no-first-run',
            '--no-zygote',
            '--disable-gpu'
          ]
        }
      } as any
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
