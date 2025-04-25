import { GoogleGenAI, createPartFromUri } from "@google/genai";
import fs from "fs";
import path from "path";
import mime from "mime-types";

class FileProcessor {
    private apiKeys: string[];
    private currentApiKeyIndex: number;
    private ai: GoogleGenAI;

    constructor() {
        this.apiKeys = [
            "AIzaSyDAwMfnUqo7REPxSkLVOCo9OTeaEHAf43E",
            "AIzaSyAv4K3hVofefPm1d5mt4Y39NQVXNQ49Dbg",
            "AIzaSyB1YZPMxgYzLdhyWOoLQoi6Akv_AVZQihs",
            "AIzaSyDV9XzIcYhYw9uqNrWZNfI25GT3iFlGy3A",
            "AIzaSyAIcaMSaIPnbsulIMi7WJSrx95tiwyyjIo",
            "AIzaSyDi4JRtfBP0NEXXWLT40rYTD5-_bIBIogQ",
            "AIzaSyADgAkDx5jvf8kmyk9nqcKSQtSNqeG62qA",
            "AIzaSyDYeeex41Ssr409I1sx04Jxk3xlb-z1O5M",
        ];
        this.currentApiKeyIndex = 0;
        this.ai = new GoogleGenAI({ apiKey: this.apiKeys[this.currentApiKeyIndex] });
    }

    private switchApiKey(): void {
        this.currentApiKeyIndex = (this.currentApiKeyIndex + 1) % this.apiKeys.length;
        this.ai = new GoogleGenAI({ apiKey: this.apiKeys[this.currentApiKeyIndex] });
        console.log(`🔄 Switched to API key: ${this.currentApiKeyIndex + 1}`);
    }

    private async waitForFileProcessing(fileName: string): Promise<any> {
        let file = await this.ai.files.get({ name: fileName });
        while (file.state === "PROCESSING") {
            console.log(`⏳ File is still processing... status: ${file.state}`);
            await new Promise(resolve => setTimeout(resolve, 5000));
            file = await this.ai.files.get({ name: fileName });
        }

        if (file.state === "FAILED") {
            throw new Error("❌ File processing failed.");
        }

        return file;
    }

    private async processFileRecursive(fileName: string, retryCount: number = 0, maxRetries: number = 3): Promise<void> {
        try {
            const filePath = path.resolve(__dirname, "../../../downloads/docs", fileName);
            if (!fs.existsSync(filePath)) {
                throw new Error(`📁 File not found: ${filePath}`);
            }

            const mimeType = mime.lookup(fileName);
            if (!mimeType) {
                throw new Error("❌ Cannot determine MIME type.");
            }

            const uploaded = await this.ai.files.upload({
                file: filePath,
                config: {
                    displayName: fileName,
                    mimeType,
                },
            });
            // Check if the upload returned valid name
            if (!uploaded.name) {
                throw new Error('File upload failed, file NAME is missing.');
            }
            const processedFile = await this.waitForFileProcessing(uploaded.name);

            const contents = [
                "Summarize this document",
                createPartFromUri(processedFile.uri!, processedFile.mimeType!)
            ];

            const response = await this.ai.models.generateContent({
                model: "gemini-2.0-flash",
                contents,
            });

            console.log("✅ Summary:\n", response.text);

        } catch (error: any) {
            if (retryCount < maxRetries) {
                if (error.message?.includes("429 Too Many Requests")) {
                    console.warn("⚠ API limit hit, switching key...");
                    this.switchApiKey();
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    return this.processFileRecursive(fileName, retryCount + 1);
                } else if (error.message?.includes("503 Service Unavailable")) {
                    console.warn("📡 Gemini service down, retrying...");
                    await new Promise(resolve => setTimeout(resolve, 5000));
                    return this.processFileRecursive(fileName, retryCount + 1);
                } else {
                    console.error("❗ Error:", error.message);
                }
            } else {
                console.error("🚫 Max retries reached.");
            }
        }
    }

    public async processFile(fileName: string): Promise<void> {
        await this.processFileRecursive(fileName);
    }
}

// Example usage
const processor = new FileProcessor();
processor.processFile("A17_FlightPlan.pdf").catch((error) => {
    console.error("💥 Unhandled error:", error);
});
