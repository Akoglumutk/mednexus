import { medicalModel } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { action, stage, branch, history, vitals } = await req.json();

    // Geçmişi modelin bağlamı kaybetmemesi için stringleştiriyoruz
    const historyContext = history
      .map((h: any) => `${h.role === 'user' ? 'Hekim' : 'Sistem'}: ${h.text}`)
      .join('\n');

    const systemPrompt = `
      Sen "Divine Hospital" tıbbi simülasyon motorusun. 
      BRANŞ: ${branch}
      HEKİM SEVİYESİ: ${stage}

      KRİTİK TALİMATLAR:
      1. TUTARLILIK: Hasta vaka boyunca aynı kalmalı. (Geçmiş: ${historyContext})
      2. ROL: "${action}" bir soruysa hasta gibi yanıt ver, bir tetkikse bulgu raporla.
      3. ÇÖZÜNÜRLÜK: ${stage === 'STAJYER' || stage === 'INTERN' ? 'Bulguları parantez içinde (Normal/Yüksek) şeklinde açıkla.' : 'Sadece ham sayısal verileri ver.'}
      4. SAKINCA: Tetkik istenmeden kesin tanı koyma.

      MEVCUT VİTALLER: ${JSON.stringify(vitals)}

      MUTLAK JSON FORMATI:
      {
        "log": "İçerik buraya",
        "newVitals": { "hr": 80, "bp": "120/80", "temp": 36.6, "spo2": 98 },
        "options": ["Adım 1", "Adım 2", "Adım 3"]
      }
    `;

    const result = await medicalModel.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text();

    // Markdown temizliği ve JSON ayıklama
    const cleanJson = text.replace(/```json|```/g, "").trim();
    
    try {
      const parsedData = JSON.parse(cleanJson);
      return NextResponse.json(parsedData);
    } catch (parseError) {
      // Eğer JSON parse başarısız olursa, regex ile objeyi yakalamaya çalış
      const match = cleanJson.match(/\{[\s\S]*\}/);
      if (match) {
        return NextResponse.json(JSON.parse(match[0]));
      }
      throw new Error("Kahin geçersiz formatta yanıt verdi.");
    }

  } catch (error: any) {
    console.error("Simulation Engine Error:", error);
    return NextResponse.json(
      { log: "Klinik veri işlenirken bir hata oluştu: " + error.message }, 
      { status: 500 }
    );
  }
}
