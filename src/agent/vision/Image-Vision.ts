import { GoogleGenAI, createUserContent, createPartFromUri } from "@google/genai";
import fs from "fs";
import path from "path";
import mime from "mime-types";

export class ImageProcessor {
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

    // Method to process multiple image files
    private async processImages(images: string[], retryCount: number = 0, maxRetries: number = 3): Promise<any> {
        try {
            // Upload all images concurrently
            const uploadedFiles = await Promise.all(
                images.map(async (imageName) => {
                    const filePath = path.resolve(__dirname, "../../../downloads/images", imageName);

                    // Check if the file exists at the resolved path
                    if (!fs.existsSync(filePath)) {
                        throw new Error(`File not found: ${filePath}`);
                    }

                    // Log the local file name instead of uploading
                    console.log(`Uploading local file: ${imageName}`);

                    // Determine MIME type using mime-types
                    const mimeType = mime.lookup(imageName);
                    if (!mimeType || !mimeType.startsWith('image/')) {
                        throw new Error('Unsupported file format.');
                    }

                    // Upload the image file to Gemini server
                    const uploadedFile = await this.ai.files.upload({
                        file: filePath,
                        config: { mimeType: mimeType }, // Use the detected MIME type
                    });

                    return uploadedFile;
                })
            );

            // Create parts for each uploaded image using their URIs
            const imageParts = uploadedFiles.map((uploadedFile) =>
                createPartFromUri(uploadedFile.uri!, uploadedFile.mimeType!)
            );

            // System prompt for image duplication check

            const systemPrompt = `
You are an AI assistant for GG Collections, a Shein bale clothing vendor based in Ilorin, Nigeria. Your task is to check if any of the product images appear more than once in the list of images you receive. The product images will have a product code attached, while the user sample image will not have any product code.

Instructions:
1. **Product Image Duplication Check:**
   - You will receive a list of images where product images will have product codes (e.g., Product1_Code).
   - Your task is to check whether any product image appears more than once.
   - For any duplicates, return the product codes of the duplicated product images.
   - The user sample image does not have a product code and should be handled separately. Do not check for duplicates in the user sample image.
  
2. **JSON Response Format:**
   - Return a JSON object with the following structure:
     - "unique_images": An array of unique product codes (excluding duplicates).
     - "duplicate_images": An array of objects containing the duplicated product code and the number of occurrences.
     - "user_image": The user sample image (if provided).
   
Example Workflow:
User sends: "Here are the images for our products and my photo."
List of images: [Product1_Code, Product2_Code, UserImage, Product1_Code]

Response:
{
"message" : "Duplicates found.",
  "duplicate_images": [
    {
      "product_code": "Product1_Code",
      "occurrences": 2
    }
  ],
}

AI Response (if no duplicates):
{
"message" : "No duplicates found.",
  "duplicate_images": [],
}

`;

            // Generate content using Gemini (image duplication check)
            const result = await this.ai.models.generateContent({
                model: "gemini-2.0-flash",
                config: {
                    responseMimeType: "application/json",
                    systemInstruction: systemPrompt,
                },
                contents: createUserContent([
                    ...imageParts, // Spread the image parts to include all images
                    "Is any of this product image duplicated?",
                ]),
            });

            // Log the response
            console.log(result.text);

            // Check if the response is valid JSON
            if (!result.text) {
                throw new Error('Invalid response from the model.');
            }
            return JSON.parse(result.text);

        } catch (error) {
            if (retryCount < maxRetries) {
                if (error instanceof Error) {
                    if (error.message.includes("429 Too Many Requests")) {
                        console.error(`🚨 API key ${this.currentApiKeyIndex + 1} limit exhausted, switching...`);
                        this.switchApiKey();  // Switch to the next API key
                        // Retry the process with the new API key
                        await new Promise((resolve) => setTimeout(resolve, 5000)); // Optional: wait before retry
                        return this.processImages(images, retryCount + 1, maxRetries);
                    } else if (error.message.includes("503 Service Unavailable")) {
                        console.error("⏳ Service is unavailable. Retrying in 5 seconds...");
                        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before retry
                        return this.processImages(images, retryCount + 1, maxRetries);
                    } else {
                        console.error("⚠ Error generating content:", error.message);
                    }
                } else {
                    console.error("❌ Unknown error:", error);
                }
            } else {
                console.error("Maximum retry attempts reached. Could not process the images.");
            }
        }
    }

    // Public method to process multiple images
    public async processImageFile(images: string[]): Promise<void> {
        await this.processImages(images);
    }
}



// Example usage: Initialize the processor and process an image file

async function runModel() {

    const processor = new ImageProcessor();

    // List of images to process
    const imagePaths = ["gg56yu.jpg", "gy58hu.jpg", "UserImage.jpg"]


    const result = await processor.processImageFile(imagePaths)

    console.log("✅ Final Result:", result);
}

runModel();