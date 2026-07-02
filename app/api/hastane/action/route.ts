import { groq } from "@/lib/groq";
import { NextResponse } from "next/server";
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

export async function POST(req: Request) {
  try {
    const { action, stage, branch, vitals, history, turnCount, checklistProgress } = await req.json();

    // 1. Gated Checklist Kontrolü (Hekim doğru sıra ile kritik adımları tamamladı mı?)
    // Eğer frontend'den gelen onay mekanizması kurulduysa, LLM'i doğrudan başarı moduna zorluyoruz.
    const isGoldStandardMet = checklistProgress?.step1Done && checklistProgress?.step2Done;

    // 2. Sistem Yönergesi (Divine Hospital Kuralları)
    const systemPrompt: ChatCompletionMessageParam = {
      role: "system",
      content: `ROL: Divine Hospital tıbbi simülasyon motorusun.
      BRANŞ: ${branch} | KADEME: ${stage} | SİMÜLASYON TURU: ${turnCount || 0}
      
      YANIT FORMATI: Kesinlikle JSON dön. Asla markdown kullanma. Metin içinde kaçış karakterlerine dikkat et.
      {
        "log": "Klinik durum açıklaması veya hekimin hamlesine verilen dramatik/klinik tepki...",
        "newVitals": { "hr": 80, "bp": "120/80", "temp": 36.6, "spo2": 98 },
        "status": "CONTINUE", // Durumlar: CONTINUE, SUCCESS, FATAL_ERROR, DEATH
        "options": {
          "ANAMNEZ": ["Hamle 1", "Hamle 2"],
          "MUAYENE": ["Hamle 1"],
          "TETKİK": ["Hamle 1"],
          "TEDAVİ": ["Hamle 1"]
        }
      }

      KLİNİK KURALLAR VE ZAMAN MEKANİĞİ:
      1. SÜREÇ TAKİBİ: Şu an vakanın ${turnCount || 0}. hamlesindeyiz. Eğer bu akut bir acil vakaysa (MI, Akut Batın, Arrest vb.) ve hekim hala doğru tanı/tedavi adımlarını atmadıysa, TUR SAYISI ARTTIKÇA hastanın vitallerini kademeli olarak KÖTÜLEŞTİR (Nabzı fırlat, tansiyonu dekompanse et, spo2 düşür).
      2. KESİN BAŞARI (SUCCESS): ${isGoldStandardMet ? "KRİTİK BİLGİ: Hekim tanı ve tedavi protokolünü (Gold Standard) doğru sıra ile tamamladı. Bu turda kesinlikle status değerini 'SUCCESS' yapmalısın. Log kısmında hekimi epikriz tadında öv, ameliyatın/müdahalenin başarısını anlat ve döngüyü bitir." : "Hasta henüz tamamen stabilize edilmedi, hekimin hamlelerini ve klinik mantığını değerlendirmeye devam et."}
      3. ÇÖMEZ HATASI (FATAL_ERROR): Eğer kullanıcı akut/acil bir durumda zaman kaybettiren saçma bir tetkik isterse (örn: Aktif MI geçiren hastaya tedavi yerine MR istemek, tansiyonu 60/40 olan hastaya antihipertansif vermek) veya tur sayısı 10'u geçtiği halde hasta hala tedavi edilmediyse status'ü "FATAL_ERROR" veya "DEATH" yap ve simülasyonu bitir.
      4. SEKMELİ SEÇENEKLER: Eğer status CONTINUE ise, options nesnesindeki ANAMNEZ, MUAYENE, TETKİK, TEDAVİ kategorilerini mantıklı 3'er/4'er kısa ve öz seçenekle doldur. Mobilde taşma yapmaması için seçenek metinleri olabildiğince kısa olmalıdır.`
    };

    // 3. Geçmiş Logları Yapılandırma (Tüm hikayeyi modele besliyoruz)
    const messages: ChatCompletionMessageParam[] = [systemPrompt];

    if (history && Array.isArray(history)) {
      history.forEach((h: { role: string; text: string }) => {
        messages.push({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.text
        });
      });
    }

    // 4. Kullanıcının Son Hamlesini Ekliyoruz
    // Eğer history içinde bu hamle zaten varsa mükerrer olmaması için yerel kontrol yapılabilir, 
    // ancak en güncel aksiyonu user rolüyle en sona eklemek LLM odağı için şarttır.
    if (messages[messages.length - 1]?.content !== action) {
      messages.push({
        role: "user",
        content: action
      });
    }

    // 5. Groq İsteği (Düşük temperature ile kesin ve hızlı tıbbi kararlar)
    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.2, // Uzatmayı engellemek ve kurallara uymasını sağlamak için deterministik seviye
      response_format: { type: "json_object" } 
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const responseData = JSON.parse(text);

    // 6. Oyun Sonu Koruması
    // Eğer vaka başarıyla bittiyse veya ölümle sonuçlandıysa seçenekleri kapatıyoruz
    if (
      responseData.status === "SUCCESS" || 
      responseData.status === "DEATH" || 
      responseData.status === "FATAL_ERROR"
    ) {
      responseData.options = {};
    }
    
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Groq Api Error:", error);
    
    // Frontend'in kırılmaması ve 'bekleniyor...' kalmaması için arayüzün beklediği şemada hata yanıtı dönüyoruz
    return NextResponse.json({ 
      log: "Simülasyon bağlantısı koptu veya hasta verisi işlenemedi. Lütfen klinik sezgilerinize güvenerek tekrar deneyin.",
      newVitals: vitals || { "hr": 0, "bp": "0/0", "temp": 0, "spo2": 0 },
      status: "CONTINUE",
      options: {
        "SİSTEM": ["Tekrar Dene", "Vakayı Sıfırla"]
      }
    }, { status: 500 });
  }
}
