// lib/gemini.ts
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export const medicalModel = genAI.getGenerativeModel({ 
  model: "gemini-flash-latest",
  generationConfig: { responseMimeType: "application/json" }
});
