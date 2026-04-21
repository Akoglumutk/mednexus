import { medicalModel } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await medicalModel.generateContent("Merhaba Kahin, sistem aktif mi? Kısa bir cevap ver.");
    return NextResponse.json({ status: "Mühür Aktif", message: result.response.text() });
  } catch (error: any) {
    return NextResponse.json({ status: "Mühür Bozuk", error: error.message }, { status: 500 });
  }
}