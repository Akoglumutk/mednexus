import { groq } from "@/lib/groq";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { action, stage, branch, vitals, history } = await req.json();

    // 1. Sistem Yönergesi (Sadece kuralları içerir)
    const systemPrompt = {
      role: "system",
      content: `ROL: Divine Hospital tıbbi simülasyon motorusun.
      BRANŞ: ${branch} | KADEME: ${stage}
      
      YANIT FORMATI: Kesinlikle ve SADECE JSON dön. Asla markdown kullanma.
      {
        "log": "Klinik durum veya tetkik sonucu açıklaması...",
        "newVitals": { "hr": 80, "bp": "120/80", "temp": 36.6, "spo2": 98 },
        "options": ["Mantıklı Hamle 1", "Mantıklı Hamle 2", "Mantıklı Hamle 3"]
      }

      KURALLAR:
      1. Hasta tutarlı olmalı. Mevcut Vitaller: ${JSON.stringify(vitals)}.
      2. ${stage === 'STAJYER' ? 'Bulguları (Yüksek/Düşük) diye açıkla.' : 'Sadece ham değerleri ver.'}`
    };

    // 2. Geçmiş Logları Groq Formatına Çeviriyoruz
    const messages: any[] = [systemPrompt];

    if (history && history.length > 0) {
      history.forEach((h: any) => {
        messages.push({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.text
        });
      });
    }

    // 3. Kullanıcının Son Hamlesini Ekliyoruz
    messages.push({
      role: "user",
      content: action
    });

    // 4. Groq'a İstek Atıyoruz
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile", // ESKİSİ: "llama3-70b-8192"
      temperature: 0.7,
      response_format: { type: "json_object" } 
    });

    const text = completion.choices[0]?.message?.content || "{}";
    
    return NextResponse.json(JSON.parse(text));

  } catch (error: any) {
    console.error("Groq Error:", error);
    return NextResponse.json({ 
      log: "Simülasyon bağlantısı koptu veya hasta verisi işlenemedi. Lütfen tekrar dene.",
      options: ["Tekrar Dene", "Vakayı Sıfırla"] 
    }, { status: 500 });
  }
}
