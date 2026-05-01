import { medicalModel } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    // 1. History'yi yeniden destructure ediyoruz
    const { action, stage, branch, vitals, history } = await req.json(); 

    // 2. Geçmiş logları Kahin'in okuyabileceği bir metne çeviriyoruz
    const historyText = history && history.length > 0
      ? history.map((h: any) => `${h.role === 'user' ? 'Hekim' : 'Klinik'}: ${h.text}`).join('\n')
      : "Henüz hamle yapılmadı. Bu yeni bir vaka.";

    // 3. Promptu geçmiş ve JSON şeması ile güçlendiriyoruz
    const systemPrompt = `
      ROL: Divine Hospital tıbbi simülasyon motorusun.
      BRANŞ: ${branch} | KADEME: ${stage}
      
      VAKA GEÇMİŞİ (ÖNEMLİ):
      ${historyText}
      
      GÖREV: Yukarıdaki vaka geçmişini dikkate alarak, kullanıcının son hamlesi olan "${action}" aksiyonuna klinik bir yanıt üret.
      
      YANIT FORMATI (KESİNLİKLE AŞAĞIDAKİ JSON ŞEMASINA UY):
      {
        "log": "Klinik durum veya tetkik sonucu açıklaması...",
        "newVitals": { "hr": 80, "bp": "120/80", "temp": 36.6, "spo2": 98 },
        "options": ["Sonraki Mantıklı Hamle 1", "Sonraki Mantıklı Hamle 2", "Sonraki Mantıklı Hamle 3"]
      }

      KURALLAR:
      1. Hasta ve vaka öyküsü tutarlı olmalı. Mevcut Vitaller: ${JSON.stringify(vitals)}.
      2. Asla markdown kullanma, sadece saf JSON döndür.
      3. ${stage === 'STAJYER' ? 'Bulguları parantez içinde (Yüksek/Düşük) olarak açıkla.' : 'Sadece ham değerleri ver.'}
    `;

    const result = await medicalModel.generateContent(systemPrompt);
    const response = await result.response;
    let text = response.text().trim();
    
    // Markdown bloklarını temizle (Garanti olması için)
    text = text.replace(/```json|```/g, "").trim();
    
    return NextResponse.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Kahin Error:", error);
    return NextResponse.json({ 
      log: "Klinik veri işlenirken hata oluştu: " + error.message,
      options: ["Tekrar Dene", "Vakayı Sıfırla"] 
    }, { status: 500 });
  }
}
