import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey || "");

export const medicalModel = genAI.getGenerativeModel({
  model: "gemini-1.5-flash", // Daha güncel ve hızlı model
  safetySettings: [
    { 
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, 
      threshold: HarmBlockThreshold.BLOCK_NONE 
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_NONE
    }
  ],
  generationConfig: {
    temperature: 0.7,
    topK: 40,
    topP: 0.95,
    maxOutputTokens: 1024,
    responseMimeType: "application/json", // Modelin doğrudan JSON dönmesini zorlar
  },
});
