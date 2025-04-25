
import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";
import fs from "fs";
import path from "path";
import mime from "mime-types";  // Import mime-types package

export class StickerProcessor {
    private apiKeys: string[];
    private currentApiKeyIndex: number;
    private ai: GoogleGenAI;

    constructor() {
        // Initialize the list of API keys
        this.apiKeys = [
            "AIzaSyDAwMfnUqo7REPxSkLVOCo9OTeaEHAf43E",
            "AIzaSyAv4K3hVofefPm1d5mt4Y39NQVXNQ49Dbg",
            "AIzaSyB1YZPMxgYzLdhyWOoLQoi6Akv_AVZQihs",
            "AIzaSyDV9XzIcYhYw9uqNrWZNfI25GT3iFlGy3A",
            "AIzaSyAIcaMSaIPnbsulIMi7WJSrx95tiwyyjIo",
            "AIzaSyDi4JRtfBP0NEXXWLT40rYTD5-_bIBIogQ",
            "AIzaSyADgAkDx5jvf8kmyk9NqcKSQtSNqeG62qA",
            "AIzaSyDYeeex41Ssr409I1sx04Jxk3xlb-z1O5M",
        ];
        this.currentApiKeyIndex = 0;
        this.ai = new GoogleGenAI({ apiKey: this.apiKeys[this.currentApiKeyIndex] }, );
    }

    // Method to switch to the next API key if the current one fails
    private switchApiKey(): void {
        this.currentApiKeyIndex = (this.currentApiKeyIndex + 1) % this.apiKeys.length;
        this.ai = new GoogleGenAI({ apiKey: this.apiKeys[this.currentApiKeyIndex] });
        console.log(`🔄 Switched to API key: ${this.currentApiKeyIndex + 1}`);
    }

    // Recursive method to process the image file with retries
    private async processStickerFileRecursive(fileName: string, retryCount: number = 0, maxRetries: number = 3): Promise<any> {
        try {
            // Resolve the file path relative to the project root
            const filePath = path.resolve(__dirname, "../../../downloads/stickers", fileName);

            // Check if the file exists at the resolved path
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            // Log the local file name instead of uploading
            console.log(`Processing local file: ${fileName}`);

            // Determine the MIME type using mime-types package
            const mimeType = mime.lookup(fileName);
            if (!mimeType || !mimeType.startsWith('image/')) {
                throw new Error('Unsupported file format.');
            }

            // Upload the image file to Gemini server
            const myFile = await this.ai.files.upload({
                file: filePath,
                config: { mimeType: mimeType },  // Use the detected MIME type
            });

            // Check if the upload returned valid uri and mimeType
            if (!myFile.uri || !myFile.mimeType) {
                throw new Error('File upload failed, URI or MIME type is missing.');
            }
        const systemPrompt = `
 You are a vision model that analyzes WhatsApp stickers and describes them clearly so another AI can reply like it saw the sticker.

Your task:
- Look at the sticker image and describe what it shows.
- Focus on facial expressions, body language, gestures, text, mood, or cultural meaning.
- Be brief, but clear and accurate.
- Use simple, natural English.
- Do not interpret or generate a reply — just describe what the sticker looks like and what it's likely expressing.

Output format:
{
  "description": "[your short description here]"
}

Examples:
- Sticker shows a woman clapping slowly with a sarcastic face. Likely expressing sarcasm or mock praise.
- Sticker shows a man kneeling and raising hands in frustration. Possibly means “I give up” or “Why now?”
- Sticker has bold text saying “God abeg!” with a worried cartoon face. It shows stress or pleading.

Now describe the sticker:

        `;

        // Generate content using Gemini (captions for the image)
        const result = await this.ai.models.generateContent({
            model: "gemini-2.0-flash",
            config: {
                    responseMimeType: "application/json",
                    systemInstruction: systemPrompt,
                },
                contents: createUserContent([
                    createPartFromUri(myFile.uri, myFile.mimeType), // Ensure these are strings
                    "Caption this image.",
                ]),
            });

            // Log the response
            console.log(result.text);
            // Check if the response is valid JSON
            if (!result.text) {
                throw new Error('Invalid response from the model.');
            }
            return JSON.parse(result.text); // Parse the JSON response to get the description

        } catch (error) {
            if (retryCount < maxRetries) {
                if (error instanceof Error) {
                    if (error.message.includes("429 Too Many Requests")) {
                        console.error(`🚨 API key ${this.currentApiKeyIndex + 1} limit exhausted, switching...`);
                        this.switchApiKey();  // Switch to the next API key
                        // Retry the process with the new API key
                        await new Promise((resolve) => setTimeout(resolve, 5000)); // Optional: wait before retry
                        return this.processStickerFileRecursive(fileName, retryCount + 1, maxRetries);
                    } else if (error.message.includes("503 Service Unavailable")) {
                        console.error("⏳ Service is unavailable. Retrying in 5 seconds...");
                        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before retry
                        return this.processStickerFileRecursive(fileName, retryCount + 1, maxRetries);
                    } else {
                        console.error("⚠ Error generating content:", error.message);
                    }
                } else {
                    console.error("❌ Unknown error:", error);
                }
            } else {
                console.error("Maximum retry attempts reached. Could not process the image file.");
            }
        }
    }

    // Public method to process the image file
    public async processStickerFile(fileName: string): Promise<any> {
     return await this.processStickerFileRecursive(fileName);
    }
}





async function runModel()  {
    const processor = new StickerProcessor();

    const result = await processor.processStickerFile("girl.webp")

    // Log the entire result to check its structure again
    console.log("✅ Raw Result:", result);

    // Check if description is inside another object or key
    if (result && result.description) {
        console.log("✅ Final Result:", result.description);
    } else {
        console.log("❌ Description not found in result.");
    }
}

// runModel();
