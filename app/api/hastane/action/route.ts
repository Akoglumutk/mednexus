import { groq } from "@/lib/groq";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { branch, targetConsult, vitals, history, currentLog } = await request.json();
    
    // Konsültan hekim simülasyonu promptu
    const consultPrompt = `ROL: Divine Hospital kıdemli ${targetConsult} konsültanısın.
    ${branch} biriminden bir asistan hekim, takip ettiği vaka için senden konsültasyon istiyor.
    
    HASTANIN ANLIK DURUMU:
    Vitaller: ${JSON.stringify(vitals)}
    En Son Klinik Durum (Log): ${currentLog}
    
    GÖREVİN:
    Bir konsültan edasıyla, asistanı çok fazla ezmeden ama tıbbi ciddiyeti koruyarak (gerekirse hafif fırça atarak veya doğrudan hayat kurtarıcı bir tüyo vererek) durumu yorumla. Yanıtın kısa, öz ve mobil ekranda kolay okunabilir (maksimum 2-3 cümle) olmalıdır.
    
    YANIT FORMATI: Kesinlikle JSON olmalı, markdown içermemelidir:
    {
      "consultantNote": "Konsültan hekimin klinik yorumu ve asistana direktifi..."
    }`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: consultPrompt },
        { role: "user", content: `Hocam vaka şu şekilde, geçmiş süreç: ${JSON.stringify(history?.slice(-3))}. Ne yapmamı önerirsiniz?` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.6,
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0]?.message?.content || "{}";
    return NextResponse.json(JSON.parse(text));
    
  } catch (error) {
    console.error("Consultation Error:", error);
    return NextResponse.json({ 
      consultantNote: "Konsültan hekime şu an ulaşılamıyor (Sinyal hatası). Lütfen klinik sezgilerine güvenerek devam et." 
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Consult API aktif ve Divine Senior Staff hazır." });
}
