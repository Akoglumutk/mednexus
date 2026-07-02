import { groq } from "@/lib/groq";
import { NextResponse } from "next/server";
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

export async function POST(req: Request) {
  try {
    const { action, stage, branch, vitals, history, turnCount, checklistProgress } = await req.json();
    // turnCount: Simülasyonda kaçıncı hamle yapıldığı (Örn: 5, 8, 12)
    // checklistProgress: { step1Done: true, step2Done: false } gibi frontend'in takip ettiği durum

    // 1. Önce Hızlı Başarı Kontrolü (Gated Checklist Avantajı)
    // Eğer frontend veya backend kritik adımların doğru sıra ile tamamlandığını onaylıyorsa 
    // LLM'e sadece dramatik bir kapanış konuşması yaptırıp SUCCESS döneceğiz.
    const isGoldStandardMet = checklistProgress?.step1Done && checklistProgress?.step2Done;

    // 2. Dinamik Sistem Promptu
    const systemPrompt: ChatCompletionMessageParam = {
      role: "system",
      content: `ROL: Divine Hospital tıbbi simülasyon motorusun.
      BRANŞ: ${branch} | KADEME: ${stage} | SİMÜLASYON TURU: ${turnCount || 0}
      
      YANIT FORMATI: Kesinlikle JSON dön. Asla markdown kullanma.
      {
        "log": "Klinik durum veya hamleye verilen tepki...",
        "newVitals": { "hr": 80, "bp": "120/80", "temp": 36.6, "spo2": 98 },
        "status": "CONTINUE", 
        "options": { "ANAMNEZ": [], "MUAYENE": [], "TETKİK": [], "TEDAVİ": [] }
      }

      DİNAMİK KLİNİK KURALLAR (BAŞARISIZLIK VE KOMPLİKASYON HESABI):
      1. KRİTİK ZAMAN MEKANİĞİ: Şu an vakanın ${turnCount}. hamlesindeyiz. Eğer hasta akut bir KVC veya Batın vakasıysa ve hekim hala doğru tedaviyi (Tansiyon kontrolü, IV sıvı, antibiyotik vb.) vermediyse, TUR SAYISI ARTTIKÇA hastanın vitallerini kademeli olarak KÖTÜLEŞTİR (Örn: KVC'de tansiyonu düşürmek yerine vakit kaybettiüyse tansiyonu 180/100'den 210/120'ye çıkar veya hastayı dekompanse et, nabzı fırlat).
      2. BAŞARISIZLIK (DEATH/FATAL_ERROR): Tur sayısı çok uzadıysa (örn: 8-10 hamle boyunca doğru müdahale yapılmadıysa) veya hekim hastanın durumuna tamamen tezat bir ilaç verdiyse (Hipertansif krizdeki hastaya tansiyon artırıcı vermek, hipotansif hastaya beta bloker vermek gibi), status'ü derhal "DEATH" veya "FATAL_ERROR" yap, simülasyonu sonlandır.
      3. BAŞARI TETİKLENMESİ: ${isGoldStandardMet ? "KRİTİK BİLGİ: Hekim tanı ve tedavi protokolünü (Gold Standard) doğru sıra ile tamamladı. Bu turda kesinlikle status değerini 'SUCCESS' yapmalısın. Log kısmında hekimi epikriz tadında öv ve bitir." : "Hasta henüz tamamen stabilize edilmedi, hekimin hamlelerini değerlendirmeye devam et."}
      4. Vitaller hamlelere gerçekçi tepki vermelidir.`
    };

    const messages: ChatCompletionMessageParam[] = [systemPrompt];

    if (history && Array.isArray(history)) {
      history.forEach((h: { role: string; text: string }) => {
        messages.push({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.text
        });
      });
    }

    messages.push({ role: "user", content: action });

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.3, // Kararlılık için düşük sıcaklık
      response_format: { type: "json_object" } 
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const responseData = JSON.parse(text);

    // End state koruması
    if (responseData.status === "SUCCESS" || responseData.status === "DEATH" || responseData.status === "FATAL_ERROR") {
      responseData.options = {};
    }
    
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Groq Error:", error);
    return NextResponse.json({ 
      log: "Simülasyon motorunda klinik bir aksama oldu.",
      newVitals: vitals,
      status: "CONTINUE",
      options: { "SİSTEM": ["Tekrar Dene"] }
    }, { status: 500 });
  }
}
