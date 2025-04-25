import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";
import fs from "fs";
import path from "path";
import mime from "mime-types";  // Import mime-types package

class AudioProcessor {
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
        this.ai = new GoogleGenAI({ apiKey: this.apiKeys[this.currentApiKeyIndex] });
    }

    // Method to switch to the next API key if the current one fails
    private switchApiKey(): void {
        this.currentApiKeyIndex = (this.currentApiKeyIndex + 1) % this.apiKeys.length;
        this.ai = new GoogleGenAI({ apiKey: this.apiKeys[this.currentApiKeyIndex] });
        console.log(`🔄 Switched to API key: ${this.currentApiKeyIndex + 1}`);
    }

    // Recursive method to process the audio file with retries
    private async processAudioFileRecursive(fileName: string, retryCount: number = 0, maxRetries: number = 3): Promise<any> {
        try {
            // Resolve the file path relative to the project root
            const filePath = path.resolve(__dirname, "../../../downloads/audio", fileName);

            // Check if the file exists at the resolved path
            if (!fs.existsSync(filePath)) {
                throw new Error(`File not found: ${filePath}`);
            }

            // Log the local file name instead of uploading
            console.log(`Processing local file: ${fileName}`);

            // Determine the MIME type using mime-types package
            const mimeType = mime.lookup(fileName);
            if (!mimeType || !mimeType.startsWith('audio/')) {
                throw new Error('Unsupported file format.');
            }

            // Upload the audio file to Gemini server
            const myFile = await this.ai.files.upload({
                file: filePath,
                config: { mimeType: mimeType },  // Use the detected MIME type
            });

            // Check if the upload returned valid uri and mimeType
            if (!myFile.uri || !myFile.mimeType) {
                throw new Error('File upload failed, URI or MIME type is missing.');
            }

            // Generate content using Gemini (skip uploading the file to the server)
            const result = await this.ai.models.generateContent({
                model: "gemini-1.5-flash",
                contents: createUserContent([
                    createPartFromUri(myFile.uri, myFile.mimeType), // Ensure these are strings
                    "Generate a transcript of the audio.",
                ]),
            });

            // Log the response
            console.log(result.text);
            return result.text;

        } catch (error) {
            if (retryCount < maxRetries) {
                if (error instanceof Error) {
                    if (error.message.includes("429 Too Many Requests")) {
                        console.error(`🚨 API key ${this.currentApiKeyIndex + 1} limit exhausted, switching...`);
                        this.switchApiKey();  // Switch to the next API key
                        // Retry the process with the new API key
                        await new Promise((resolve) => setTimeout(resolve, 5000)); // Optional: wait before retry
                        return this.processAudioFileRecursive(fileName, retryCount + 1, maxRetries);
                    } else if (error.message.includes("503 Service Unavailable")) {
                        console.error("⏳ Service is unavailable. Retrying in 5 seconds...");
                        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before retry
                        return this.processAudioFileRecursive(fileName, retryCount + 1, maxRetries);
                    } else {
                        console.error("⚠ Error generating content:", error.message);
                    }
                } else {
                    console.error("❌ Unknown error:", error);
                }
            } else {
                console.error("Maximum retry attempts reached. Could not process the audio file.");
            }
        }
    }

    // Public method to process the audio file
    public async processAudioFile(fileName: string): Promise<void> {
        await this.processAudioFileRecursive(fileName);
    }
}

// Example usage: Initialize the processor and process an audio file
const processor = new AudioProcessor();
processor.processAudioFile("Big7.mp3").catch((error) => {
    console.error("An error occurred:", error);
});
