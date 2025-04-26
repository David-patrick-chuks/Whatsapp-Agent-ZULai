import logger from "../config/loggger";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { StickerProcessor } from "./vision/Sticker-Vision";

const chuksPersonalityPrompt = `
You are the owner of GG Collections, replying to a customer on WhatsApp. A vision model has described a sticker the customer sent.

Your task:
- Read the sticker description and reply like you saw the sticker yourself.
- Respond in a friendly, natural Nigerian tone — short, warm, and helpful.
- React based on the mood or meaning of the sticker (e.g., laughter, confusion, sarcasm, stress).
- If it shows a question or doubt, gently reassure or guide the customer.
- If it’s playful or funny, feel free to banter lightly before continuing.
- Always return your reply in this JSON format:

{
  "reply": "[your short response here]"
}

Example input:
Description: Sticker shows a man lying on the floor with hands on his head — looks frustrated or overwhelmed.

Example output:
{
  "reply": "😂 I know e fit be like say wahala too much, but I go explain everything small small."
}

`;


let currentApiKeyIndex = 0; // Keeps track of the current Gemini API key in use

let geminiApiKeys = [
    "AIzaSyC2HLk9_WJtMTbEQxCpRSGOGPkXFVPZ35g",
    "AIzaSyBwNCakKQ6wc7pg3q4PxiBhq_rCfZOb2UU",
    "AIzaSyBsiPPnjvrDhut2DMTkQ6wxeHSPfyBEihk",
    "AIzaSyAQ1rZygvFT8NzPhAO6qxa-dtaMEHqZP64",
    "AIzaSyDOuzfEaU37K19tOtv5cjokC1pBs2lZLCQ",
    "AIzaSyA81tzxjDxVnjjZq8Op8D5AQm3-ckXA0cg",
    "AIzaSyB5Hu2ZLAqsEfiZuQi94RhIbCe1KcOj4DM",
    "AIzaSyDMiBX1S2gQVxUFT85rnMrVNruWmBKwlTk",
    "AIzaSyC1lPUfpiJnsbDL2CdAa5zZb9CL4tgvK80",
    "AIzaSyArInw0_5TGUcVuO0LKmNQLy10lCW49okM",
    "AIzaSyBJTwgOwvmu7w_rXcvY5or7ZI2vvou70cA",
    "AIzaSyDmYhOZLV4hd0apv6ZM1R3NS7LWmTpp_s4",
    "AIzaSyApO0edRaTwI2JWkhsZq_SPyPQ-q5OeE4o",
    "AIzaSyCpdaWdiYW2__6cRywmzkH6Kwr0TpgjP_E",
    "AIzaSyCuR1HxXWSXgoY_Nlw6OWMLEaOGDj7YRF8",
    "AIzaSyDgSGUAH569RjrmYjz-QUsDMqjITiHS7OA",
    "AIzaSyDNJ-IRsFQumvGEi044P_J8zPs3wIU367o",
    "AIzaSyBz6jaMp4Z5304Knx9UiJdX8DQjw1lqg9g",
    "AIzaSyBHVdQ5gjbWiYrxUNE_wbNTZ_aUGPjWqwI",
    "AIzaSyDNa1rY4QAiVwzj_1LcGPPFAetEfVa7zr0",
    "AIzaSyA9Df2q2kOR9MZkrCimGjgUVAKuz1kyZPg",
    "AIzaSyDAwMfnUqo7REPxSkLVOCo9OTeaEHAf43E",
    "AIzaSyAv4K3hVofefPm1d5mt4Y39NQVXNQ49Dbg",
    "AIzaSyB1YZPMxgYzLdhyWOoLQoi6Akv_AVZQihs",
    "AIzaSyDV9XzIcYhYw9uqNrWZNfI25GT3iFlGy3A",
    "AIzaSyAIcaMSaIPnbsulIMi7WJSrx95tiwyyjIo",
    "AIzaSyDi4JRtfBP0NEXXWLT40rYTD5-_bIBIogQ",
    "AIzaSyADgAkDx5jvf8kmyk9NqcKSQtSNqeG62qA",
    "AIzaSyDYeeex41Ssr409I1sx04Jxk3xlb-z1O5M",
    "AIzaSyAF8TSVWvVTv62X-bmeHTXv21KBDgcYDVE",
    "AIzaSyBUACYkd6ZGP2madg6weu5Twbrb8LtsjKQ",
    "AIzaSyB6yhfVxwbEAwXcgoApKTJPeutdjH_yWH4",
    "AIzaSyAwePV5GXjqn2IrHs9rWlZHGeei4LvXrSo",
    "AIzaSyBUHKun0ofNXC4c57lWM7VwVA5627BdCsI",
    "AIzaSyCCMWWDVJq83MCTtt4za1LMk3rPtEyO2DE",
];

// Function to get the next API key in the list
const getNextApiKey = () => {
    currentApiKeyIndex = (currentApiKeyIndex + 1) % geminiApiKeys.length; // Circular rotation of API keys
    return geminiApiKeys[currentApiKeyIndex];
};

export async function stickerReply(prompt: string) {
    let geminiApiKey = geminiApiKeys[currentApiKeyIndex];
    let currentApiKeyName = `GEMINI_API_KEY_${currentApiKeyIndex + 1}`;
    // console.log(`GEMINI_API_KEY_${currentApiKeyName}`);
    //   console.log(
    //     `\n🗝️  Key: ${currentApiKeyName} selected. Let's proceed with the analysis.`
    //   );
    if (!geminiApiKey) {
        logger.error("No Gemini API key available.");
        return "No API key available.";
    }
    const generationConfig = {
        responseMimeType: "application/json",
    };

    const googleAI = new GoogleGenerativeAI(geminiApiKey);
    const model = googleAI.getGenerativeModel({
        model: "gemini-1.5-flash",
        generationConfig,
        systemInstruction: chuksPersonalityPrompt,
    });

    // Construct final prompt
    let finalPrompt = `
       ${prompt}
           `;

    try {
        const result = await model.generateContent(finalPrompt);

        if (!result || !result.response) {
            logger.info(
                "No response received from the AI model. || Service Unavailable"
            );
            return "Service unavailable!";
        }

        const responseText = result.response.text();
        // const data = JSON.parse(responseText);

        // console.log("The response is::", responseText);
        return JSON.parse(responseText);
        // return responseText;
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes("429 Too Many Requests")) {
                logger.error(
                    `---${currentApiKeyName} limit exhausted, switching to the next API key...`
                );
                geminiApiKey = getNextApiKey(); // Switch to the next API key
                currentApiKeyName = `GEMINI_API_KEY_${currentApiKeyIndex + 1}`; // Update the name
                return stickerReply(prompt); // Retry with the new API key
            } else if (error.message.includes("503 Service Unavailable")) {
                logger.error("Service is temporarily unavailable. Retrying...");
                // Implement retry logic, like a small delay before retrying
                await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
                geminiApiKey = getNextApiKey(); // Switch to the next API key
                currentApiKeyName = `GEMINI_API_KEY_${currentApiKeyIndex + 1}`; // Update the name
                return stickerReply(prompt); // Retry the request
            } else {
                console.error("Error runing Ai Agent:", error.message);
                return "An error occurred while generating content.";
            }
        } else {
            console.error("An unknown error occurred:", error);
            return "An unknown error occurred.";
        }
    }
}



export const replyUserSticker = async (path: string) => {
    try {
        const processor = new StickerProcessor();
        const result = await processor.processStickerFile(path);
        console.log("✅ Raw Result:", result);
        const response = await stickerReply(result.description)
        console.log("AI Response:", response.reply);
        return response.reply;
    } catch (error) {
        console.error("Error replying to user sticker:", error);

    }
}

// replyUserSticker();