import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const medicalModel = genAI.getGenerativeModel({ 
  model: "gemini-1.5-flash", // Daha stabil referans
  generationConfig: { 
    responseMimeType: "application/json",
    temperature: 0.7
  }
});
