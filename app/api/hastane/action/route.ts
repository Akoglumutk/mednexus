// app/api/hastane/action/route.ts
import { medicalModel } from "@/lib/gemini";
import { NextResponse } from "next/server";

// Mutlaka "POST" ismiyle ve "export" edilerek tanımlanmalı
export async function POST(req: Request) {
  try {
    const { action, stage, branch, history, vitals } = await req.json();

    const systemPrompt = `...`; // Önceki mesajdaki prompt içeriği

    const result = await medicalModel.generateContent(systemPrompt);
    const response = await result.response;
    const text = response.text().replace(/```json|```/g, "").trim();
    
    return NextResponse.json(JSON.parse(text));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

