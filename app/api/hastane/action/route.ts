import { groq } from "@/lib/groq";
import { NextResponse } from "next/server";

// --- KUTSAL KLİNİK MATRİS (Sıfır Halüsinasyon Veri Havuzu) ---
interface ClinicalCase {
  diagnosis: string;
  presentation: string;
  goldStandard: string[]; // Başarı için yapılması zorunlu eylemler
  fatalTriggers: string[]; // Anında ölüm/ihlal tetikleyecek yanlış hamleler
  vitalsFlow: {
    start: { hr: number; bp: string; temp: number; spo2: number };
    worse: { hr: number; bp: string; temp: number; spo2: number };
  };
  tetkikSonuclari: Record<string, string>;
  muayeneSonuclari: Record<string, string>;
  dogruKarar: 'YATIŞ' | 'TABURCU' | 'SEVK';
}

const CLINICAL_MATRIX: Record<string, ClinicalCase> = {
  "KARDİYOLOJİ": {
    diagnosis: "Akut ST Yükselmeli Anterior Miyokard Enfarktüsü (STEMI)",
    presentation: "45 yaşında erkek hasta, acil servise sol kola yayılan, ezici tarzda retrosternal göğüs ağrısı ve soğuk terleme şikayetiyle başvurdu.",
    goldStandard: ["EKG", "Aspirin", "Nitrogat/Gliseril trinitrat", "KVC Konsültasyonu"],
    fatalTriggers: ["Topikal Steroid", "Egzersiz Testi", "Diklofenak Enjeksiyonu"],
    vitalsFlow: {
      start: { hr: 95, bp: "140/90", temp: 36.5, spo2: 96 },
      worse: { hr: 125, bp: "85/50", temp: 36.4, spo2: 91 } // Kardiyojenik şok tablosu
    },
    muayeneSonuclari: {
      "Akciğer Oskültasyonu": "Bilateral bazallerde hafif raller işitildi.",
      "Kardiyak Muayene": "S4 gallop ritmi mevcut, üfürüm saptanmadı.",
      "Batın Palpasyonu": "Batın rahat, defans veya rebound saptanmadı."
    },
    tetkikSonuclari: {
      "EKG": "Anterior derivasyonlarda (V1-V4) 3mm ST elevasyonu ve resiprok ST depresyonları mühürlendi.",
      "Kardiyak Enzimler": "Troponin T: 2.4 ng/mL (Yüksek), CK-MB: 45 U/L (Yüksek)",
      "Tam Kan Sayımı": "WBC: 11.200/mm³, Hb: 14.2 g/dL, Plt: 245.000/mm³"
    },
    dogruKarar: "YATIŞ" // Koroner Anjiyografi / Yoğun Bakım Yatışı şart
  },
  "NEFROLOJİ": {
    diagnosis: "Kronik Böbrek Hasarı Zemininde Ağır Hiperkalemi Krizi",
    presentation: "62 yaşında kadın hasta, yaygın kas güçsüzlüğü, uyuşukluk ve çarpıntı şikayetiyle getirildi. Öyküsünde KBH mevcut.",
    goldStandard: ["EKG", "Kalsiyum Glukonat", "İnsülin-Dekstroz İnfüzyonu"],
    fatalTriggers: ["Potasyum İnfüzyonu", "Potasyum Tutucu Diüretik", "Taburcu"],
    vitalsFlow: {
      start: { hr: 48, bp: "100/60", temp: 36.6, spo2: 95 },
      worse: { hr: 32, bp: "70/40", temp: 36.2, spo2: 88 } // Ventriküler fibrilasyon / Asistoli riski
    },
    muayeneSonuclari: {
      "Kardiyak Muayene": "Bradikardik ve ritmik ritim, S1 S2 doğal.",
      "Nörolojik Muayene": "Proksimal kas gruplarında belirgin kas gücü kaybı (3/5), derin tendon refleksleri azalmış."
    },
    tetkikSonuclari: {
      "EKG": "T dalgalarında sivrileşme (Tall T), PR mesafesinde uzama ve QRS kompleksinde genişleme.",
      "Biyokimya": "Potasyum (K): 7.2 mEq/L (Ölümcül Yüksek), Kreatinin: 4.8 mg/dL, BUN: 85 mg/dL"
    },
    dogruKarar: "YATIŞ"
  },
  "ACİL": {
    diagnosis: "Arı Sokmasına Bağlı Akut Anfilaktik Şok",
    presentation: "24 yaşında kadın hasta, sol elinden arı sokmasından 15 dakika sonra gelişen tüm vücutta kaşıntı, nefes darlığı ve bayılma hissiyle getirildi.",
    goldStandard: ["Adrenalin/Epinefrin", "IV Hidrasyon", "Antihistaminik"],
    fatalTriggers: ["Bekle-Gör Politikası", "Sadece Nemlendirici", "Taburcu"],
    vitalsFlow: {
      start: { hr: 118, bp: "80/45", temp: 36.8, spo2: 92 },
      worse: { hr: 140, bp: "50/20", temp: 36.5, spo2: 78 } // Ağır solunum yetmezliği ve kardiyak arrest
    },
    muayeneSonuclari: {
      "Akciğer Oskültasyonu": "Bilateral yaygın ekspiratuar stridor ve wheezing işitildi.",
      "Dermatolojik Muayene": "Tüm vücutta yaygın ürtiker plakları ve anjioödem (özellikle dudak çevresi) izlendi."
    },
    tetkikSonuclari: {
      "Kan Gazı": "pH: 7.28, pCO2: 52 mmHg, pO2: 60 mmHg (Akut Respiratuar Asidoz bulguları)."
    },
    dogruKarar: "YATIŞ"
  }
};

export async function POST(req: Request) {
  try {
    const { action, stage, branch, vitals, history, turnCount, checklistProgress } = await req.json();

    // 1. BRANŞ AYRIMI GÜVENCESİ: Matristen ilgili branşın tekil ve değişmez vakasını çekiyoruz
    const upperBranch = branch?.toUpperCase() || "KARDİYOLOJİ";
    const currentCase = CLINICAL_MATRIX[upperBranch] || CLINICAL_MATRIX["KARDİYOLOJİ"];

    // --- DURUM A: HEKİM NİHAİ KARAR VERDİYSE ([KARAR] MODU) ---
    if (action && action.startsWith("[KARAR]")) {
      const hekimKarari = action.replace("[KARAR] ", ""); // TABURCU, SEVK, YATIŞ
      
      // Hekimin tüm süreç boyunca gold standard adımları atıp atmadığını kontrol et
      const historyTexts = history ? history.map((h: any) => h.text) : [];
      const missingSteps = currentCase.goldStandard.filter(step => 
        !historyTexts.some((text: string) => text.toLowerCase().includes(step.toLowerCase()))
      );

      let finalStatus: 'SUCCESS' | 'FAILED' | 'DEATH' = 'SUCCESS';
      let finalLog = "";

      if (hekimKarari !== currentCase.dogruKarar) {
        // Yanlış departman kararı (Örn: STEMI hastasını eve göndermek veya sevk edip yolda öldürmek)
        finalStatus = "FAILED";
        finalLog = `KLİNİK BAŞARISIZLIK: Belirlenen patoloji "${currentCase.diagnosis}" idi. Bu hastaya dair nihai yönetim kararınız "${hekimKarari}" olarak seçildi ancak textbook kılavuzlarına göre doğru karar "${currentCase.dogruKarar}" olmalıydı. Hasta yanlış departman yönetimi nedeniyle malpraktis sınırına girdi.`;
      } else if (missingSteps.length > 0) {
        // Doğru karar verilmiş ama gerekli temel tanı/tedavi adımları eksik bırakılmış
        finalStatus = "FAILED";
        finalLog = `KLİNİK EKSİKLİK: Doğru triyaj kararı verdiniz ancak hastayı stabilize etmeden önce şu kritik süreçleri atladınız: [${missingSteps.join(", ")}]. Gerekli kılavuz tedavileri mühürlenmeden vaka sonlandırılamaz.`;
      } else {
        // Her şey kusursuz
        finalStatus = "SUCCESS";
        finalLog = `TEBRİKLER HEKİM! "${currentCase.diagnosis}" vakasını en yüksek yetkinlikle yönettiniz. Tüm altın standart protokoller ([${currentCase.goldStandard.join(", ")}]) başarıyla mühürlendi ve hastanın vitalleri güvenli sınıra çekildi. İmtihan başarıyla tamamlandı.`;
      }

      return NextResponse.json({
        log: finalLog,
        status: finalStatus,
        newVitals: vitals,
        options: {}
      });
    }

    // --- DURUM B: "VAKAYI BAŞLAT" İLK HAMLESİ ---
    if (action === "Vakayı Başlat") {
      return NextResponse.json({
        log: `[HASTA GİRİŞİ] Acil Komuta Merkezi'ne bir vaka mühürlendi. ${currentCase.presentation} İlk olarak ne yapmak istersiniz?`,
        newVitals: currentCase.vitalsFlow.start,
        status: "CONTINUE",
        options: generateDynamicOptions(currentCase, [])
      });
    }

    // --- DURUM C: NORMAL SÜREÇ İÇİ AKSİYON DEĞERLENDİRME ---
    const historyTexts = history ? history.map((h: any) => h.text) : [];
    
    // 1. Ölümcül Hata Kontrolü (Fatal Triggers)
    if (currentCase.fatalTriggers.some(trigger => action.toLowerCase().includes(trigger.toLowerCase()))) {
      return NextResponse.json({
        log: `ÖLÜMCÜL İHLAL! Hastaya "${action}" müdahalesinde bulundunuz. "${currentCase.diagnosis}" tablosunda bu işlem kesin kontraendikedir. Hasta ani kardiyak/hücresel şok ile EX oldu.`,
        status: "DEATH",
        newVitals: currentCase.vitalsFlow.worse,
        options: {}
      });
    }

    // 2. Muayene veya Tetkik Buton Tetiklemeleri (Statik Akıllı Veri Okuma)
    let actionResponseLog = "";
    if (currentCase.muayeneSonuclari[action]) {
      actionResponseLog = `[FİZİK MUAYENE] ${currentCase.muayeneSonuclari[action]}`;
    } else if (currentCase.tetkikSonuclari[action]) {
      actionResponseLog = `[LABORATUVAR/GRAFİ] ${currentCase.tetkikSonuclari[action]}`;
    }

    // 3. Eğer hamle bunlardan biri değilse, LLM sadece hastanın dilinden Anamnez konuşması yapsın!
    if (!actionResponseLog) {
      const aiPrompt = `ROL: Sen Divine Hospital simülatöründeki bir hastasın.
      SENSİN: ${currentCase.diagnosis} hastasısın. Şikayetlerin: ${currentCase.presentation}
      GÖREVİN: Karşındaki asistan hekim sana "${action}" dedi veya sordu. Sadece bir hastanın bilinci ve kelimeleriyle, tıbbi terim kullanmadan, acı çeken bir dille kısa bir (1-2 cümle) yanıt ver. Asla laboratuvar bulgusu veya muayene kelimesi uydurma.`;

      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: aiPrompt },
          { role: "user", content: action }
        ],
        model: "llama-3.3-70b-versatile",
        temperature: 0.4
      });

      actionResponseLog = completion.choices[0]?.message?.content || "Hasta acıyla başını salladı.";
    }

    // 4. Zaman Mekaniği ve Vitalleri Kötüleştirme (Turn Count > 5 ve hala Gold Standard eksikse)
    let updatedVitals = { ...vitals };
    const completedGoldSteps = currentCase.goldStandard.filter(step => 
      [...historyTexts, action].some((text: string) => text.toLowerCase().includes(step.toLowerCase()))
    );

    if (turnCount > 5 && completedGoldSteps.length < 2) {
      updatedVitals = currentCase.vitalsFlow.worse;
      actionResponseLog += `\n\n[KRİTİK UYARI] Müdahalede gecikiyorsunuz! Hastanın patofizyolojisi kötüye gidiyor, vitaller sarsılıyor!`;
    }

    return NextResponse.json({
      log: actionResponseLog,
      newVitals: updatedVitals,
      status: "CONTINUE",
      options: generateDynamicOptions(currentCase, [...historyTexts, action])
    });

  } catch (error: any) {
    console.error("Klinik Motor Hatası:", error);
    return NextResponse.json({ log: "Sinyal kesildi.", status: "CONTINUE", options: {} }, { status: 500 });
  }
}

// Butonları mevcut klinik duruma göre dinamik besleyen steril fonksiyon
function generateDynamicOptions(c: ClinicalCase, currentHistory: string[]) {
  // Kullanılmış hamleleri buton listesinden filtrele ki hekim sürekli aynı butona basmasın
  const filterUsed = (arr: string[]) => arr.filter(item => !currentHistory.some(h => h.toLowerCase().includes(item.toLowerCase())));

  return {
    "ANAMNEZ": filterUsed(["Ağrının Karakteri", "Ek Hastalık Öyküsü", "Kullanılan İlaçlar"]),
    "MUAYENE": filterUsed(Object.keys(c.muayeneSonuclari).length > 0 ? Object.keys(c.muayeneSonuclari) : ["Kardiyak Muayene", "Batın Palpasyonu"]),
    "TETKİK": filterUsed(Object.keys(c.tetkikSonuclari).length > 0 ? Object.keys(c.tetkikSonuclari) : ["EKG", "Tam Kan Sayımı"]),
    "TEDAVİ": filterUsed([...c.goldStandard, ...c.fatalTriggers].slice(0, 4)) // Gerekli ve ölümcül ilaçlar havuzundan karma
  };
}
