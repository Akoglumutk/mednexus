import { groq } from "@/lib/groq";
import { NextResponse } from "next/server";
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

export async function POST(req: Request) {
  try {
    const { action, stage, branch, vitals, history } = await req.json();

    // 1. Sistem Yönergesi (Sıkılaştırılmış ve Netleştirilmiş)
    const systemPrompt: ChatCompletionMessageParam = {
      role: "system",
      content: `ROL: Divine Hospital tıbbi simülasyon motorusun.
      BRANŞ: ${branch} | KADEME: ${stage}
      
      YANIT FORMATI: Kesinlikle JSON dön. Asla markdown kullanma.
      {
        "log": "Klinik durum açıklaması veya doktorun hamlesine verilen dramatik/klinik tepki...",
        "newVitals": { "hr": 80, "bp": "120/80", "temp": 36.6, "spo2": 98 },
        "status": "CONTINUE", // Durum: CONTINUE, SUCCESS, FATAL_ERROR, DEATH
        "options": {
          "ANAMNEZ": ["Şikayetini detaylandır", "Özgeçmiş/Soygeçmiş"],
          "MUAYENE": ["Kardiyovasküler", "Solunum", "Batın"],
          "TETKİK": ["EKG", "PA Akciğer Grafisi", "Hemogram", "Kardiyak Panel"],
          "TEDAVİ": ["Oksijen (Nazal)", "IV Sıvı", "Aspirin"]
        }
      }

      KLİNİK KURALLAR VE OYUN MEKANİĞİ:
      1. Hasta tutarlı olmalı. Mevcut Vitaller: ${JSON.stringify(vitals)}.
      2. DİNAMİK SEKMELER: Seçenekleri (options) mutlaka kategorilerine göre ayırarak mantıklı 3'er/4'er hamle öner. Mobilde sığması için seçenek metinleri kısa ve öz olmalıdır.
      3. ÇÖMEZ HATASI (FATAL_ERROR): Eğer kullanıcı akut/acil bir durumda zaman kaybettiren saçma bir tetkik isterse (örn: Aktif MI geçiren hastaya tedavi yerine MR istemek, tansiyonu 60/40 olan hastaya antihipertansif vermek) status'ü "FATAL_ERROR" yap ve log kısmında hekimi sertçe uyararak simülasyonu bitir.
      4. END STATES: Hasta tamamen stabilize edilip doğru taburcu kararı verilirse status'ü "SUCCESS", hasta yanlış müdahalelerle kaybedilirse "DEATH" yap.
      5. Vitaller hamlelere gerçekçi ve anlık tepki vermelidir.`
    };

    // 2. Geçmiş Logları Tip Güvenliği ile Dönüştürme
    const messages: ChatCompletionMessageParam[] = [systemPrompt];

    if (history && Array.isArray(history)) {
      history.forEach((h: { role: string; text: string }) => {
        messages.push({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.text
        });
      });
    }

    // 3. Kullanıcının Son Hamlesi
    messages.push({
      role: "user",
      content: action
    });

    // 4. Groq İsteği (Daha hızlı ve kararlı yanıt için temp optimize edildi)
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.4, // Hızlı ve kararlı tıbbi kararlar için düşürüldü
      response_format: { type: "json_object" } 
    });

    const text = completion.choices[0]?.message?.content || "{}";
    
    return NextResponse.json(JSON.parse(text));

  } catch (error: any) {
    console.error("Groq Error:", error);
    // Arayüzün kırılmaması için hata anında da aynı şemayı besliyoruz
    return NextResponse.json({ 
      log: "Simülasyon bağlantısı koptu veya hasta verisi işlenemedi. Lütfen tekrar dene.",
      newVitals: vitals || { "hr": 0, "bp": "0/0", "temp": 0, "spo2": 0 },
      status: "CONTINUE",
      options: {
        "SİSTEM": ["Tekrar Dene", "Vakayı Sıfırla"]
      }
    }, { status: 500 });
  }
}
