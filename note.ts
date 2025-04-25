// // Function to clear .wwebjs files and folders
// const clearWWebjsCache = () => {
//   const cacheDir = path.join(__dirname, "..wwebjs_auth");
//   const wwebjsDir = path.join(__dirname, ".wwebjs_cache");

//   // Delete cache/wwebjs folder
//   if (fs.existsSync(cacheDir)) {
//     fs.rmSync(cacheDir, { recursive: true, force: true });
//     console.log("Cleared cache/wwebjs folder.");
//   }

//   // Delete .wwebjs folder
//   if (fs.existsSync(wwebjsDir)) {
//     fs.rmSync(wwebjsDir, { recursive: true, force: true });
//     console.log("Cleared .wwebjs folder.");
//   }
// };

//   clearWWebjsCache(); // Call this function before initializing the client

// // client.on("message", async (msg) => {
//   //   if (msg.body === "!send-media") {
//   //     /// send file to server
//   //     // const media = await MessageMedia.fromUrl('https://via.placeholder.com/350x150.png');
//   //     ////sending local media
//   //     // const media = MessageMedia.fromFilePath('./path/to/image.png');
//   //     const media = new MessageMedia("image/png", base64Image);
//   //     await client.sendMessage(msg.from, media);
//   //     /// you can add caption
//   //     // await client.sendMessage(chatId, media, { caption: 'this is my caption' });
//   //   }
//   // });

//   client.on("message", async (msg) => {
//     if (msg.hasMedia) {
//       const media = await msg.downloadMedia();
//       // do something with the media data here
//     }
//   });







  
//   client.on("message", async (message) => {
//     try {
//       // Get the sender's contact
//       const contact = await message.getContact();
//       console.log(
//         "Message received with body:",
//         message.body || "No message body"
//       );

//       // Determine the sender's name
//       const senderName =
//         contact.pushname || contact.name || contact.number || "Unknown";
//       console.log("Sender name:", senderName);
//       console.log("Sender Phone Num:", message.from);

//       // Fetch previous messages from this chat
//       const chat = await message.getChat();
//       const messages = (await chat.fetchMessages({ limit: 10 })) || [];

//       // Ensure messages array is not empty before mapping
//       const chatHistory = messages.length
//         ? messages
//             .map((msg) => {
//               let sender = msg.from === "2347081643714@c.us" ? "Chuks" : "User";
//               return `${sender}: ${msg.body}`;
//             })
//             .join("\n\n")
//         : "No previous messages";

//       console.log("Previous Messages:", chatHistory);

//       // Process new message
//       if (message.body?.trim()) {
//         const resp = await runAgent(chatHistory, message.body.trim());
//         if (resp) {
//           await message.reply(resp);
//           console.log("Replied with:", resp);
//         }
//       } else {
//         console.log("No valid message received.");
//       }

//       // Handle chat history request
//       if (message.body?.trim() === "!history") {
//         let history = messages.length
//           ? messages.map((msg, i) => `${i + 1}. ${msg.body}`).join("\n")
//           : "No chat history available.";

//         await message.reply(`Chat history:\n${history}`);
//       }
//     } catch (error) {
//       console.error("Error processing message:", error);
//     }
//   });

  