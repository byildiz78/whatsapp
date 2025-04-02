import { create, Whatsapp } from "venom-bot";
import { type LaunchOptions } from "puppeteer";

let client: Whatsapp | null = null;
let qrCode: string | null = null;

export const getClient = () => client;
export const getQrCode = () => qrCode;

export const initWhatsapp = async () => {
  if (client) return client;

  try {
    const puppeteerOptions: LaunchOptions = {
      executablePath: process.env.CHROME_BIN || process.env.PUPPETEER_EXECUTABLE_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--disable-gpu'
      ]
    };

    client = await create("whatsapp-session", 
      (base64Qr: string) => {
        console.log("[WhatsApp] New QR Code received");
        qrCode = base64Qr;
      },
      (status: string) => {
        console.log("[WhatsApp] Status changed:", status);
        if (status === "isLogged") {
          qrCode = null;
        }
      },
      {
        browserArgs: ["--no-sandbox"],
        disableSpins: true,
        disableWelcome: true,
        updatesLog: true,
        debug: true,
        logQR: true,
        puppeteerOptions
      }
    );

    client.onMessage((message) => {
      console.log("[WhatsApp] New message received:", message.body);
    });

    console.log("[WhatsApp] Client created successfully!");
    return client;
  } catch (error) {
    console.error("[WhatsApp] Error creating client:", error);
    throw error;
  }
};
