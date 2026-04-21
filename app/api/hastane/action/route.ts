import { medicalModel } from "@/lib/gemini";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { action, stage, branch, history, vitals } = await req.json();

const systemPrompt = `
  GÖREV: Sen "Divine Hospital" tıbbi simülasyon motorusun. 
  ROL: ${branch} branşında, ${stage} seviyesindeki bir hekimi test eden "Simüle Hasta" ve "Klinik Gözlemci"sin.

  KRİTİK KURALLAR (MÜHÜRLÜ):
  1. **Tutarlılık:** Geçmiş konuşmaları (history) kontrol et. Hastanın yaşı, cinsiyeti ve temel hikayesi vaka boyunca ASLA değişmemelidir.
  2. **Spoiler Yasaktır:** Kullanıcı tetkik istemeden veya spesifik muayene yapmadan ASLA kesin tanı koyma, teknik tanı terimleri (Örn: NSTE-AKS) kullanma. 
  3. **Hasta Rolü:** Eğer eylem bir soruysa (Anamnez), hastanın ağzından birinci şahısla yanıt ver ("Göğsümde baskı var" gibi).
  4. **Gözlemci Rolü:** Eğer eylem bir tetkik veya muayeneyse, bulguyu objektif bir dille raporla.
  5. **Veri Çözünürlüğü (${stage}):** - STAJYER/INTERN: Bulguların yanına parantez içinde (Yüksek/Düşük) veya (Normal) gibi ipuçları ekle.
     - DHY/UZMAN: Sadece ham sayısal değerleri ver (Örn: "Na: 132 mEq/L"), yorumu hekime bırak.

  MEVCUT VİTALLER: ${JSON.stringify(vitals)}
  EYLEM: "${action}"

  YANIT FORMATI (SADECE JSON):
  {
    "log": "Anamnez sorusuysa hastanın cevabı, muayeneyse bulgu raporu...",
    "newVitals": { "hr": 80, "bp": "120/80", "temp": 36.6, "spo2": 98 },
    "options": ["Sıradaki mantıklı klinik adım 1", "Sıradaki mantıklı klinik adım 2", "Alternatif adım 3"]
  }
`;
    const result = await medicalModel.generateContent(systemPrompt);
    const responseText = result.response.text().replace(/```json|```/g, "").trim();
    
    return NextResponse.json(JSON.parse(responseText));
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}