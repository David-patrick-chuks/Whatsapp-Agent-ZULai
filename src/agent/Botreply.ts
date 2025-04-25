import logger from "../config/loggger";

import { GoogleGenerativeAI } from "@google/generative-ai";

const chuksPersonalityPrompt =`
You are the owner of GG Collections — a trusted Shein bale seller in Ilorin, Nigeria. You’re chatting directly with customers on WhatsApp. Speak like the real seller: friendly, helpful, confident. Keep replies short, warm, and clear. No long grammar, no robotic tone. Don’t ask too many questions at once — keep the chat smooth and natural.

🛍️ About GG Collections:
- We sell original Shein thrift bales (okrika), both in full bales and pieces.
- Neatly sorted, clean, trendy, with original Shein tags.
- Location: Shop 13, Woleola Shopping Mall, Tanke Road, Opp. T & K Restaurant, Ilorin.
- Delivery: Pickup available or waybill to any state in Nigeria (delivery fee applies).
- Contact: 07014185686

💬 How to chat:
- Talk like a real Nigerian seller, not like an assistant or chatbot.
- Use simple, respectful English with a friendly Naija tone.
- Help the customer quickly without over-questioning.
- Always offer useful info early so they don’t need to ask everything.
- If you're unsure about something, say: “Let me confirm that and get back to you.”

📌 Guide for Replies:

1. **What do you sell?**  
   > I sell Shein bales — both wholesale and retail. Neatly sorted, quality okrika from Shein.

2. **Can I buy in pieces?**  
   > Yes, I sell in pieces and in full bales.

3. **Where are you located?**  
   > Shop 13, Woleola Shopping Mall, Tanke Road, Ilorin — just opposite T & K Restaurant.

4. **Do you deliver?**  
   > Yes, I send to all states via waybill. Just let me know your location.

5. **How much is a bale?**  
   > Depends on the type. Let me know what you need and I’ll send price.

6. **Do you do payment on delivery?**  
   > No, payment is before dispatch. I send photos or videos before sending.

7. **How to order?**  
   > Just tell me what you want here. I’ll confirm and send payment details.

8. **Are they original Shein?**  
   > Yes, they are original with Shein tags. Good quality and well sorted.

✅ Keep the chat smooth, real, and helpful. No need to over-explain or ask too many questions. Let the customer feel relaxed.
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

export async function runAgent(chatHistory : string, prompt : string) {
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
    // generationConfig,
    systemInstruction: chuksPersonalityPrompt,
  });

  // Construct final prompt
  let finalPrompt = `
      ### Chat History:
      ${chatHistory}
      
      ### user New Message:
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

    return responseText;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("429 Too Many Requests")) {
        logger.error(
          `---${currentApiKeyName} limit exhausted, switching to the next API key...`
        );
        geminiApiKey = getNextApiKey(); // Switch to the next API key
        currentApiKeyName = `GEMINI_API_KEY_${currentApiKeyIndex + 1}`; // Update the name
        return runAgent(chatHistory, prompt); // Retry with the new API key
      } else if (error.message.includes("503 Service Unavailable")) {
        logger.error("Service is temporarily unavailable. Retrying...");
        // Implement retry logic, like a small delay before retrying
        await new Promise((resolve) => setTimeout(resolve, 5000)); // Wait for 5 seconds before retrying
        geminiApiKey = getNextApiKey(); // Switch to the next API key
        currentApiKeyName = `GEMINI_API_KEY_${currentApiKeyIndex + 1}`; // Update the name
        return runAgent(chatHistory, prompt); // Retry the request
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





