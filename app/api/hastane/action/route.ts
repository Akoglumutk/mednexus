import { medicalModel } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // Eğer kullanmıyorsan değişkeni sil veya prompt içine dahil et
    const { action, stage, branch, vitals } = await req.json(); 
    // history'yi sildik çünkü logda unused uyarısı veriyordu.

    const systemPrompt = `
      ROL: Divine Hospital tıbbi simülasyon motorusun.
      BRANŞ: ${branch} | KADEME: ${stage}
      GÖREV: Kullanıcının "${action}" hamlesine klinik yanıt üret.
      
      KURALLAR:
      1. Hasta tutarlı olmalı. Mevcut Vitaller: ${JSON.stringify(vitals)}.
      2. Yanıt kesinlikle JSON formatında olmalı.
      3. ${stage === 'STAJYER' ? 'Bulguları parantez içinde (Yüksek/Düşük) olarak açıkla.' : 'Sadece ham değerleri ver.'}
    `;

    const result = await medicalModel.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Markdown bloklarını temizle
    text = text.replace(/```json|```/g, "").trim();
    
    return NextResponse.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Kahin Error:", error);
    return NextResponse.json({ 
      log: "Klinik veri işlenirken hata oluştu: " + error.message,
      options: ["Tekrar Dene"] 
    }, { status: 500 });
  }
}
