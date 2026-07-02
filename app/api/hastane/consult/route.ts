import { groq } from "@/lib/groq";
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { branch, targetConsult, vitals, history, currentLog } = await request.json();
    
    const consultPrompt = `ROL: Divine Hospital kıdemli ${targetConsult} konsültanısın.
    ${branch} biriminden bir asistan hekim, takip ettiği vaka için senden konsültasyon istiyor.
    
    HASTANIN ANLIK DURUMU:
    Vitaller: ${JSON.stringify(vitals)}
    En Son Klinik Durum (Log): ${currentLog}
    
    GÖREVİN:
    Bir konsültan edasıyla, asistanı çok fazla ezmeden ama tıbbi ciddiyeti koruyarak durumu yorumla. Yanıtın kısa, öz ve mobil ekranda kolay okunabilir (maksimum 2-3 cümle) olmalıdır.
    
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
      temperature: 0.5,
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const data = JSON.parse(text);

    // Eğer LLM bazen anahtarı küçük/büyük harf veya farklı döndürürse diye tolerans kontrolü:
    const finalNote = data.consultantNote || data.note || data.message || "Vakayı daha derinlemesine incelemeniz gerekiyor.";

    return NextResponse.json({ consultantNote: finalNote });
    
  } catch (error) {
    console.error("Consultation Error:", error);
    // Hata anında undefined dönmesini tamamen engelliyoruz
    return NextResponse.json({ 
      consultantNote: "Şu an ilgili konsültana ulaşılamıyor. Klinik protokolleri gözden geçirip kendi kararınızla devam edin." 
    });
  }
}

export async function GET() {
  return NextResponse.json({ message: "Consult API aktif." });
}
