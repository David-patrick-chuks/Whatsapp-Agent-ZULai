import {
    Client,
    RemoteAuth,
    Message,
    MessageMedia,
    Contact,
    Chat
  } from "whatsapp-web.js";
  import { MongoStore } from "wwebjs-mongo";
  import qrcode from "qrcode-terminal";
  import QRCode from "qrcode";
  import mongoose from "mongoose";
  import { runAgent } from "../agent/Botreply";
  
  export class WhatsAppController {
    private client: Client | null = null;
    private qrDataURL: string | null = null;
  
    public getQRCode(): string | null {
      return this.qrDataURL;
    }
  
    public getClient(): Client | null {
      return this.client;
    }
  
    public initClient(): void {
      const store = new MongoStore({ mongoose });
  
      this.client = new Client({
        authStrategy: new RemoteAuth({
          store,
          backupSyncIntervalMs: 300000,
        }),
      });
  
      this.client.on("qr", async (qr: string) => {
        console.log("QR Code received.");
        qrcode.generate(qr, { small: true });
        this.qrDataURL = await QRCode.toDataURL(qr);
      });
  
      this.client.on("ready", () => {
        console.log("✅ WhatsApp client is ready.");
      });
  
      this.client.on("authenticated", () => {
        console.log("✅ Authenticated successfully.");
        this.qrDataURL = null;
      });
  
      this.client.on("auth_failure", (msg: string) => {
        console.error("❌ Auth failure:", msg);
      });
  
      this.client.on("message", (message: Message) => {
        void this.handleMessage(message); // Marked as void to handle async fire-and-forget
      });
  
      this.client.initialize();
    }
  
    private async handleMessage(message: Message): Promise<void> {
      try {
        if (message.type !== "chat" || !message.body.trim()) return;
  
        const contact: Contact = await message.getContact();
        const senderName =
          contact.pushname || contact.name || contact.number || "Unknown";
  
        const chat: Chat = await message.getChat();
        const messages: Message[] = await chat.fetchMessages({ limit: 10 });
  
        const chatHistory = messages
          .map((msg: Message) => {
            const sender = msg.from === "2347081643714@c.us" ? "Chuks" : "User";
            return `${sender}: ${msg.body}`;
          })
          .join("\n\n");
  
        const response = await runAgent(chatHistory, message.body.trim());
        await message.reply(response);
      } catch (err) {
        console.error("❌ Error handling message:", err);
      }
    }
  }
  