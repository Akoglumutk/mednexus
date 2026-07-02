import { groq } from "@/lib/groq";
import { NextResponse } from "next/server";
import { ChatCompletionMessageParam } from "groq-sdk/resources/chat/completions";

// Textbook düzeyinde branş vaka kılavuzu (Modelin jenerik vakalara kaçmasını engeller)
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
  ],
  "DERMATOLOJİ": [
    "Ağır Atopik Dermatit (Egzama) ve Sekonder Bakteriyel Enfeksiyon",
    "Psoriazis Vulgaris (Sedef Hastalığı) Akut Yaygın Plak Atak",
    "İlaç Erüpsiyonu - Toksik Epidermal Nekroliz (TEN) Erken Evre Şüphesi"
  ]
};

export async function POST(req: Request) {
  try {
    const { action, stage, branch, vitals, history, turnCount, checklistProgress } = await req.json();

    // Seçilen branşa göre havuzu belirle
    const bransVakalari = BRANS_VAKA_KILAVUZU[branch?.toUpperCase()] || ["Akut Apandisit zemininde gelişen peritonit"];
    const vakaHavuzuMetni = bransVakalari.map((v, i) => `${i+1}. ${v}`).join("\n");

    // Temel mesaj geçmişini oluşturuyoruz
    const messages: ChatCompletionMessageParam[] = [];

    // Eğer gelen hamle bir sonlandırma kararı ise ([KARAR] ile başlıyorsa)
    if (action && action.startsWith("[KARAR]")) {
      const hekimKarari = action.replace("[KARAR] ", "");

      const finalPrompt: ChatCompletionMessageParam = {
        role: "system",
        content: `ROL: Divine Hospital Kıdemli Hakem Kurulusun. 
        Hekim vaka döngüsünü sonlandırdı ve hasta hakkında şu nihai kararı verdi: ${hekimKarari}.
        
        GÖREVİN: Tüm süreç geçmişini ve hastanın son durumunu incele.
        
        STATUS BELİRLEME KURALLARI:
        1. SUCCESS: Eğer hekim hastanın branşına uygun temel tanısal adımları atmış, gerekli tedaviyi (örn: egzama için topikal steroid/nemlendirici, enfeksiyonda antibiyotik) eksiksiz vermiş ve hastayı stabil halde taburcu veya sevk etmişse durumu "SUCCESS" yap.
        2. FAILED: Eğer hasta hayati tehlike altında değilse (örn: hafif egzama, stabil poliklinik vakaları) AMA hekim doğru dürüst tedavi düzenlemeden, semptomları tam çözmeden erkenden TABURCU kararı verdiyse durum kesinlikle "FAILED" olmalıdır. Log kısmında klinisyene eksik bıraktığı adımları sert bir dille raporla.
        3. DEATH / FATAL_ERROR: Akut hayati kriz (MI, Akut Batın, Ağır Hiperkalemi) varken eksik tedaviyle taburcu ettiyse durum "DEATH" veya "FATAL_ERROR" olmalıdır.
        
        YANIT FORMATI: Kesinlikle şu JSON şemasına uy:
        {
          "log": "Hekimin yaptığı eksiklikleri, gözden kaçırdığı lezyon/semptomları ve neden klinik olarak başarısız (FAILED) veya başarılı (SUCCESS) olduğunu açıklayan epikriz raporu.",
          "status": "SUCCESS", // SUCCESS, FAILED, DEATH, FATAL_ERROR
          "newVitals": ${JSON.stringify(vitals)},
          "options": {}
        }`
      };

      messages.push(finalPrompt);

      // Geçmiş logları ekle
      if (history && Array.isArray(history)) {
        history.forEach((h: { role: string; text: string }) => {
          messages.push({
            role: h.role === 'user' ? 'user' : 'assistant',
            content: h.text
          });
        });
      }

      const completion = await groq.chat.completions.create({
        messages: messages,
        model: "llama-3.3-70b-versatile",
        temperature: 0.2,
        response_format: { type: "json_object" }
      });

      const text = completion.choices[0]?.message?.content || "{}";
      return NextResponse.json(JSON.parse(text));
    }

    // --- NORMAL OYUN AKIŞI (Aksiyon Değerlendirme) ---
    const isGoldStandardMet = checklistProgress?.step1Done && checklistProgress?.step2Done;

    const systemPrompt: ChatCompletionMessageParam = {
      role: "system",
      content: `ROL: Divine Hospital tıbbi simülasyon motorusun.
      BRANŞ: ${branch} | KADEME: ${stage} | SİMÜLASYON TURU: ${turnCount || 0}
      
      YANIT FORMATI: Kesinlikle JSON dön. Asla markdown kullanma.
      {
        "log": "Klinik durum açıklaması veya hekimin hamlesine verilen dramatik/klinik tepki...",
        "newVitals": { "hr": 80, "bp": "120/80", "temp": 36.6, "spo2": 98 },
        "status": "CONTINUE",
        "options": {
          "ANAMNEZ": ["Hamle 1", "Hamle 2"],
          "MUAYENE": ["Hamle 1"],
          "TETKİK": ["Hamle 1"],
          "TEDAVİ": ["Hamle 1"]
        }
      }

      BRANŞA ÖZEL VAKA ÜRETİM KURALI (KRİTİK):
      Kullanıcı "${branch}" branşını seçti. "Vakayı Başlat" komutu verildiğinde, kesinlikle başka branşların popüler vakalarına KAÇMA. Aşağıdaki vaka havuzundan, daha önce bu oturumda işlenmemiş RASTGELE bir patolojiyi seç ve simülasyonu o patofizyoloji üzerine kur:
      
      [${branch} VAKA HAVUZU KILAVUZU]
      ${vakaHavuzuMetni}

      KLİNİK KURALLAR VE ZAMAN MEKANİĞİ:
      1. SÜREÇ TAKİBİ: Şu an vakanın ${turnCount || 0}. hamlesindeyiz. Eğer bu akut bir acil vakaysa ve hekim doğru adımları atmadıysa, TUR SAYISI ARTTIKÇA vitallerini kademeli olarak KÖTÜLEŞTİR.
      2. KESİN BAŞARI (SUCCESS): ${isGoldStandardMet ? "KRİTİK BİLGİ: Hekim tanı ve tedavi protokolünü (Gold Standard) tamamladı. Bu turda kesinlikle status değerini 'SUCCESS' yapmalısın. Log kısmında hekimi tebrik et ve bitir." : "Hasta henüz tamamen stabilize edilmedi, hamleleri değerlendirmeye devam et."}
      3. ÇÖMEZ HATASI (FATAL_ERROR): Akut acil durumda zaman kaybettiren saçma bir tetkik istenirse veya yanlış ilaç verilirse acımadan status'ü 'FATAL_ERROR' veya 'DEATH' yap ve bitir.
      4. SEKMELİ SEÇENEKLER: Eğer status CONTINUE ise, options nesnesindeki sekmeleri mantıklı, kısa ve öz seçeneklerle doldur. Mobilde sığması için seçenek metinleri kısa olmalıdır.`
    };

    messages.push(systemPrompt);

    if (history && Array.isArray(history)) {
      history.forEach((h: { role: string; text: string }) => {
        messages.push({
          role: h.role === 'user' ? 'user' : 'assistant',
          content: h.text
        });
      });
    }

    if (messages[messages.length - 1]?.content !== action) {
      messages.push({
        role: "user",
        content: action
      });
    }

    const completion = await groq.chat.completions.create({
      messages: messages,
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0]?.message?.content || "{}";
    const responseData = JSON.parse(text);

    if (
      responseData.status === "SUCCESS" || 
      responseData.status === "DEATH" || 
      responseData.status === "FATAL_ERROR" ||
      responseData.status === "FAILED"
    ) {
      responseData.options = {};
    }
    
    return NextResponse.json(responseData);

  } catch (error: any) {
    console.error("Groq Api Error:", error);
    return NextResponse.json({ 
      log: "Simülasyon bağlantısı koptu veya hasta verisi işlenemedi. Lütfen tekrar deneyin.",
      newVitals: { "hr": 72, "bp": "120/80", "temp": 36.6, "spo2": 99 },
      status: "CONTINUE",
      options: { "SİSTEM": ["Tekrar Dene", "Vakayı Sıfırla"] }
    }, { status: 500 });
  }
}
