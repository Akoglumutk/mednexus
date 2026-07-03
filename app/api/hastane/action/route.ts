import { groq } from "@/lib/groq";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { branch, stage } = await req.json();

    const systemPrompt = `ROL: Sen tıp fakültesi komite sınavları ve TUS/USMLE düzeyinde sorular hazırlayan akademik bir kurul hekimisin.
    
    GÖREVİN: Kullanıcının seçtiği "${branch}" branşına ve "${stage}" yetkinlik kademesine tam uygun, derinlemesine tıbbi bir klinik vaka senaryosu (case paragraph) yazmak ve buna bağlı birbiriyle çelişmeyen tam 3 adet ardışık test sorusu kurgulamaktır.
    
    KLİNİK PARAGRAF KURALLARI:
    - Metin oldukça detaylı olmalıdır. Hastanın yaşı, cinsiyeti, acile veya polikliniğe başvuru semptomları (Anamnez), yapılan fizik muayenesinin kritik pozitif/negatif bulguları (Oskültasyon, palpasyon vb.) ve istenen ilk tetkik/laboratuvar/grafi sonuçları (Örn: Hemogram, EKG, Biyokimya değerleri) tek bir akıcı epikriz paragrafı halinde metne gömülmelidir.
    
    ARDIŞIK SORU KURALLARI:
    - 1. Soru genellikle: "Bu klinik ve laboratuvar bulguları ışığında hastada en olası ön tanı hangisidir?" tarzında tanıya yönelik olmalıdır.
    - 2. Soru genellikle: "Bu patolojinin patofizyolojisinde/etiyolojisinde rol oynayan temel mekanizma veya laboratuvar bulgusu hangisidir?" şeklinde temel bilim mekanizmasına inmeli.
    - 3. Soru genellikle: "Bu hastanın tedavisinde/yönetiminde ilk tercih edilmesi gereken altın standart yaklaşım veya kontraendike olan ajan hangisidir?" şeklinde klinik farmakoloji/tedaviye yönelik olmalıdır.
    - Şıklar (A, B, C, D, E) kesinlikle 5 adet olmalıdır. 
    
    YANIT FORMATI: Kesinlikle sadece aşağıdaki saf JSON objesini dön. Markdown (fenced code blocks \`\`\`json) veya dış açıklama asla ekleme:
    {
      "diagnosisTitle": "Vakanın Kesin Tıbbi Tanısı (Örn: Akut ST Elevasyonlu Anterior MI)",
      "caseParagraph": "Buraya tüm anamnez, fizik muayene ve laboratuvar bulgularını içeren detaylı medikal metin gelecek...",
      "questions": [
        {
          "questionText": "1. Soru metni buraya...",
          "options": ["A seçeneği metni", "B seçeneği metni", "C seçeneği metni", "D seçeneği metni", "E seçeneği metni"],
          "correctIdx": 0, // 0=A, 1=B, 2=C, 3=D, 4=E
          "rebuttal": "Doğru şıkkın patofizyolojik gerekçesi, Costanzo/Robbins referans kılavuz açıklaması buraya yazılacaktır..."
        },
        ...
      ]
    }`;

    const completion = await groq.chat.completions.create({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Bana ${branch} branşı için ${stage} seviyesine uygun vakayı mühürle.` }
      ],
      model: "llama-3.3-70b-versatile",
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const text = completion.choices[0]?.message?.content || "{}";
    return NextResponse.json(JSON.parse(text));

  } catch (error: any) {
    console.error("Clinicum API Hatası:", error);
    return NextResponse.json({
      diagnosisTitle: "Bağlantı Kesintisi",
      caseParagraph: "Kahin odasına ulaşılırken klinik bir pürüz oluştu. Lütfen sinyali tekrar tazeleyin.",
      questions: []
    }, { status: 500 });
  }
}
