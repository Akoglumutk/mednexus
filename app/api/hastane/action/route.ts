import { groq } from "@/lib/groq";
import { NextResponse } from "next/server";
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

// app/api/hastane/action/route.ts dosyasına eklenecek Branş Vaka Kılavuzu
const BRANS_VAKA_KILAVUZU: Record<string, string[]> = {
  "KARDİYOLOJİ": [
    "Akut ST Yükselmeli Miyokard Enfarktüsü (STEMI) - Anterior MI",
    "Stabil Olmayan Anjina Pektoris (USAP) ve Akut Koroner Sendrom",
    "Atriyal Fibrilasyon (Hızlı Ventrikül Yanıtlı) ve Akut Kalp Yetersizliği"
  ],
  "NEFROLOJİ": [
    "Poststreptokokal Akut Glomerulonefrit (PSGN) - Nefritik Sendrom",
    "Minimal Değişiklik Hastalığına (MCD) Bağlı Ağır Nefrotik Sendrom",
    "Akut Tübüler Nekroz (ATN) - Toksik Hasara Bağlı Akut Böbrek Hasarı",
    "Kronik Böbrek Hastalığı Evre 4 Zemininde Gelişen Akut Hiperkalemi Krizi"
  ],
  "GASTROENTEROLOJİ": [
    "Özofagus Variz Kanamasına Bağlı Üst GİS Kanaması ve Siroz Dekompanzasyonu",
    "Akut Pankreatit - Safra Taşı Kaynaklı (Biliyer) Akut Karın",
    "Ülseratif Kolit Akut Atak - Toksik Megakolon Şüphesi"
  ],
  "ACİL": [
    "Diabetik Ketoasidoz (DKA) Koması",
    "Anfilaktik Şok - Arı Sokması Sonrası Hücresel Hipoksi",
    "Pulmoner Emboli - Derin Ven Trombozu Kaynaklı Akut Solunum Sıkıntısı"
  ]
};

export async function POST(req: Request) {
  try {
    const { action, stage, branch, vitals, history, turnCount, checklistProgress } = await req.json();

    // Seçilen branşa ait vaka listesini çekiyoruz. Eğer kılavuzda yoksa jenerik acil vakası veriyoruz.
    const bransVakalari = BRANS_VAKA_KILAVUZU[branch?.toUpperCase()] || ["Akut Apandisit zemininde gelişen peritonit"];
    
    // Modelin her seferinde aynı vakayı üretmemesi için sistem promptuna bu diziyi enjekte edeceğiz.
    const vakaHavuzuMetni = bransVakalari.map((v, i) => `${i+1}. ${v}`).join("\n");

    const systemPrompt: ChatCompletionMessageParam = {
      role: "system",
      content: `ROL: Divine Hospital tıbbi simülasyon motorusun.
      BRANŞ: ${branch} | KADEME: ${stage} | SİMÜLASYON TURU: ${turnCount || 0}
      
      YANIT FORMATI: Kesinlikle JSON dön. Asla markdown kullanma.
      {
        "log": "Klinik durum açıklaması...",
        "newVitals": { "hr": 80, "bp": "120/80", "temp": 36.6, "spo2": 98 },
        "status": "CONTINUE", 
        "options": { "ANAMNEZ": [], "MUAYENE": [], "TETKİK": [], "TEDAVİ": [] }
      }

      BRANŞA ÖZEL VAKA ÜRETİM KURALI (KRİTİK):
      Kullanıcı "${branch}" branşını seçti. "Vakayı Başlat" komutu verildiğinde, kesinlikle başka branşların (Kardiyoloji, KVC vb.) popüler vakalarına KAÇMA. Aşağıdaki vaka havuzundan, daha önce bu oturumda işlenmemiş RASTGELE bir patolojiyi seç ve simülasyonu o patofizyoloji üzerine kur:
      
      [${branch} VAKA HAVUZU KILAVUZU]
      ${vakaHavuzuMetni}
      
      Örneğin hekim NEFROLOJİ seçtiyse vaka göğüs ağrısı olamaz; hematüri, oligüri, periorbital ödem, proteinüri veya üremik semptomlarla (bulantı, kusma, ensefalopati) başlamalıdır.

      KLİNİK KURALLAR VE ZAMAN MEKANİĞİ:
      1. SÜREÇ TAKİBİ: Şu an ${turnCount || 0}. hamledeyiz. Hekim patolojiye yönelik spesifik adımları geciktirirse vitalleri kötüleştir.
      2. GATED CHECKLIST BAŞARI: ${checklistProgress?.step1Done && checklistProgress?.step2Done ? "Kritik tedavi uygulandı, status'ü SUCCESS yap." : "Devam et."}
      3. SEKMELİ SEÇENEKLER: Seçenekler (options) tamamen seçilen bu spesifik vakanın klinik kılavuzuna uygun olmalıdır.`
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
