import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(req: Request) {
  try {
    const { content } = await req.json();
    const model = genAI.getGenerativeModel({ 
      model: "gemini-flash-latest",
      safetySettings: [
        { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
        { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
      ],
    });

const prompt = `
  GÖREV: Aşağıdaki "Girdi" metnini tıp akademisyen standartlarında düzenle.
  
  STRATEJİ:
  - Metni hiyerarşik H2 ve H3 başlıklarına ayır.
  - Tıbbi terminolojiyi Latinize et (Örn: Apandisit -> Appendicitis).
  - İçerikten en az bir "KLİNİK İNCİ" çıkar ve vurgula.
  - Sadece temiz HTML döndür.
  - Eğer girdi metni anlamsızsa (örn: [object Object]), tıbbi bir analiz yapma, hata döndür.

  GİRDİ:
  ${content}
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return NextResponse.json({ result: response.text() });
  } catch (error: any) {
    console.error("ORACLE_CRITICAL_ERROR:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}