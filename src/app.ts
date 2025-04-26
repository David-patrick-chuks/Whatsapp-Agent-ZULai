import express, { Application } from "express";
import { Client, RemoteAuth, MessageMedia, Message } from "whatsapp-web.js";
import qrcode from "qrcode-terminal";
import mongoose from "mongoose";
import { MongoStore } from "wwebjs-mongo";
import QRCode from "qrcode";
import { runAgent } from "./agent/Botreply";
import db from "./config/db";
import { clearWWebjsCache } from "./services";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { replyUserSticker } from "./agent/Sticker";
import { replyImage } from "./agent/vision/Image-Vision";
import { replyAudio } from "./agent/media/audio";

const app: Application = express();

// MongoDB connection
db.connect()

// WhatsApp client setup
let client: Client;
let globalQRCodeDataURL: string | null = null;

const MESSAGE_DELAY = 1000; // Delay time in milliseconds (3 seconds)
let messageBuffer: Message[] = [];
let messageTimeout: NodeJS.Timeout | null = null;

async function handleMessagesBatch(messages: Message[]) {
  try {
    // Process the messages after waiting for the user
    console.log(`Handling a batch of ${messages.length} messages...`);
    
    // Check the user's intent based on the collected messages.
    const lastMessage = messages[messages.length - 1];
    const text = lastMessage.body.trim();
    
    if (messages.length === 1) {
      // Handle single message response
      const response = await runAgent(messages.map(msg => msg.body).join("\n\n"), text);
      await lastMessage.reply(response);
      console.log("Replied to the single message:", response);
    } else {
      // Handle multiple messages, or react to the last one.
    //   await lastMessage.react('👍');  // React to the last message as a "thumbs up"
      console.log("Reacted to the last message.");
      // Reply to all collected messages one by one (or you could choose specific logic)
      for (const msg of messages) {
        const response = await runAgent(messages.map(m => m.body).join("\n\n"), msg.body.trim());
        await msg.reply(response);
        console.log("Replied to message:", response);
      }
    }

  } catch (error) {
    console.error("Error handling message batch:", error);
  } finally {
    // Reset the message buffer after processing
    messageBuffer = [];
  }
}


async function handleIncoming(message: Message) {
    try {
      const contact = await message.getContact();
      const senderName = contact.pushname || contact.name || contact.number || "Unknown";
      const chat = await message.getChat();
  
      console.log("Received message from", senderName, "type=", message.type);
  
      if (message.hasMedia) {
        const media = await message.downloadMedia();
        if (media?.data) {
          const mimetype = media.mimetype;
          const folder =
            mimetype === "image/gif" ? "gifs" :
            mimetype === "image/webp" ? "stickers" :
            mimetype.startsWith("image/") ? "images" :
            mimetype.startsWith("audio/") ? "audios" :
            "media";
  
        //   const ext = mimetype.split("/")[1];
        const ext = mimetype.split("/")[1]?.split(";")[0];
            if (!ext) {
                console.error("Unsupported media type:", mimetype);
                return;
            }
          const dir = join(process.cwd(), "downloads", folder);
          if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
  
          const filename = `${Date.now()}_${message.from}.${ext}`;
          const filepath = join(dir, filename);
          writeFileSync(filepath, Buffer.from(media.data, "base64"));
  
          console.log(`Saved ${folder} to ${filepath}`);
  
          if (folder === "stickers") {
            const stickerResponse = await replyUserSticker(filepath);
            if (stickerResponse) {
              await message.reply(stickerResponse);
              console.log("Replied to sticker with:", stickerResponse);
            }
          } 
          else if (folder === "images") {
            const imageResponse = await replyImage(filepath);
            if (imageResponse) {
              await message.reply(imageResponse);
              console.log("Replied to image with:", imageResponse);
            }
          }
          else if (folder === "audios") {
            const audioResponse = await replyAudio(filepath);
            if (audioResponse) {
        const response = await runAgent(messageBuffer.map(m => m.body).join("\n\n"), audioResponse);
                
              await message.reply(response);
              console.log("Replied to audio with:", audioResponse);
            }
          } 
          else {
            await message.reply(`Got your ${folder.slice(0, -1)}—I've saved it! 😊`);
          }
  
          // 👉🏽 After replying to media, exit early.
          return;
        }
      }
  
      // 🟰 If it's not media (pure text), continue the normal flow
      messageBuffer.push(message);
  
      if (messageTimeout) clearTimeout(messageTimeout);
      messageTimeout = setTimeout(() => {
        handleMessagesBatch(messageBuffer);
      }, MESSAGE_DELAY);
  
    } catch (error) {
      console.error("Error processing incoming message:", error);
    }
  }
  

  
mongoose.connection.once("open", () => {
    console.log("MongoDB connection is open. Initializing WhatsApp client...");
    clearWWebjsCache(); // Call this function before initializing the client

    const store = new MongoStore({ mongoose });
    console.log("MongoStore initialized.");

    client = new Client({
        authStrategy: new RemoteAuth({
            store: store,
            backupSyncIntervalMs: 300000,
        }),
        // Disable whatsapp-web.js' built-in cache
        // webCache: { enabled: false }
    });

    client.on("qr", async (qr) => {
        console.log("QR code received. Use the /qr-live endpoint to scan.");
        qrcode.generate(qr, { small: true }); // Displays QR code in terminal
        globalQRCodeDataURL = await QRCode.toDataURL(qr);
        console.log(qr);
    });

    // 2) On “ready”, catch up unread
    
client.on("ready", async () => {
    console.log("Client ready — catching up on unread messages...");
    
    const chats = await client.getChats();
    for (const chat of chats) {
      if (chat.unreadCount > 0) {
        console.log(`› ${chat.id._serialized} has ${chat.unreadCount} unread`);
        const unread = (await chat.fetchMessages({ limit: chat.unreadCount })).reverse();
        for (const msg of unread) {
          try {
            await handleIncoming(msg);
            // mark as read (blue ticks) after replying
            await chat.sendSeen();
          } catch (e) {
            console.error("Error processing unread message:", e);
          }
        }
      }
    }
  
    console.log("✅ All unread processed. Now listening for new messages.");
    client.on("message", handleIncoming);
    })


    client.on("authenticated", () => {
        console.log("WhatsApp client authenticated successfully!");
        globalQRCodeDataURL = null; // Clear the Base64 data URL after authentication
    });

    client.on("auth_failure", (msg) => {
        console.error("Authentication failed:", msg);
    });

    client.on("loading_screen", (percent, message) => {
        console.log(`Loading screen: ${percent}% - ${message}`);
    });

    client.on("disconnected", (reason) => {
        console.error("WhatsApp client disconnected:", reason);
    });



    console.log("Initializing WhatsApp client...");
    client.initialize();
});

// Express routes
app.get("/", (_req, res) => {
    res.send("WhatsApp Bot is live!");
});

// Route to serve the QR code dynamically
app.get("/qr-live", (_req, res) => {
    console.log("QR code request received.");
    if (globalQRCodeDataURL) {
        res.type("text/html");
        res.send(`
        <img src="${globalQRCodeDataURL}" alt="Scan this QR code with WhatsApp" />
        <p>Scan this QR code with WhatsApp!</p>
      `);
    } else {
        res.send("No QR code available yet. Please wait or restart the bot.");
    }
});

// Health check route
app.get("/health", (_req, res) => {
    console.log("Health check route accessed");
    res.send("WhatsApp Bot is live and healthy!");
});

// Status route
app.get("/status", (_req, res) => {
    console.log("Status route accessed");
    if (client) {
        res.send({ status: client.info ? "ready" : "not ready" });
    } else {
        res.send({ status: "client not initialized" });
    }
});



export default app;