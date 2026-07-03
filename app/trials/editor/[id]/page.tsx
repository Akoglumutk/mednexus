// app/trials/editor/[id]/page.tsx
'use client'
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAssetUpload } from '@/hooks/useAssetUpload';
import DivineTagInput from '@/components/DivineTagInput';

export default function TrialsEditor() {
  const { id } = useParams();
  const router = useRouter();
  const { handlePaste } = useAssetUpload();

  const [trial, setTrial] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Toplu Soru Modu State'leri
  const [bulkText, setBulkText] = useState('');
  const [isBulkMode, setIsBulkMode] = useState(false);

  useEffect(() => {
    if (id === 'new') {
      setTrial({
        question: '',
        options: ['', '', '', ''],
        correct_idx: 0,
        explanation: '',
        tags: [],
        subject: 'Anatomi',
        image_url: ''
      });
      setIsBulkMode(true);
      setLoading(false);
    } else {
      fetchTrial();
    }
  }, [id]);

  async function fetchTrial() {
    const { data } = await supabase.from('trials').select('*').eq('id', id).single();
    if (data) {
      // Veritabanından gelen null değerlerin inputları bozmaması için sanitizasyon
      setTrial({
        ...data,
        question: data.question || '',
        options: data.options || ['', '', '', ''],
        correct_idx: typeof data.correct_idx === 'number' ? data.correct_idx : 0,
        explanation: data.explanation || '',
        tags: data.tags || [],
        subject: data.subject || 'Anatomi',
        image_url: data.image_url || ''
      });
    }
    setLoading(false);
  }

  // --- GELİŞMİŞ STATE-MACHINE MS WORD KİTAPÇIK PARÇALAYICI ---
  const handleBulkParse = () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    let questionText = '';
    let parsedOptions: string[] = [];
    let correctIdx = 0;
    let explanationText = '';

    const optionRegex = /^([A-Ea-e])[\s.)\-\/]+(.*)/;
    const answerRegex = /^(cevap|doğru|ans|key)[\s.:\-]*([A-Ea-e])/i;

    // Ayrıştırma durumunu takip eden State-Machine
    let currentMode: 'question' | 'options' | 'explanation' = 'question';

    lines.forEach(line => {
      const optionMatch = line.match(optionRegex);
      const answerMatch = line.match(answerRegex);

      if (answerMatch) {
        const letter = answerMatch[2].toUpperCase();
        correctIdx = letter.charCodeAt(0) - 65; // A=0, B=1...
        currentMode = 'explanation'; // Cevap satırından sonra gelen her şey açıklamadır.
      } else if (optionMatch) {
        parsedOptions.push(optionMatch[2]);
        currentMode = 'options';
      } else {
        // Bir regex kalıbına uymayan ara satırlar
        if (currentMode === 'question') {
          if (questionText) {
            questionText += '\n' + line;
          } else {
            // Soru numarasını temizle (Örn: "1. Soru metni" -> "Soru metni")
            questionText = line.replace(/^\d+[\s.)\-\/]+/, '');
          }
        } else if (currentMode === 'options') {
          // Çok satırlı şıklar: Eğer yeni şık emaresi yoksa, metni son eklenen şıkka bağla
          if (parsedOptions.length > 0) {
            parsedOptions[parsedOptions.length - 1] += '\n' + line;
          }
        } else if (currentMode === 'explanation') {
          explanationText += (explanationText ? '\n' : '') + line;
        }
      }
    });

    if (parsedOptions.length === 0) parsedOptions = ['', '', '', ''];

    setTrial((prev: any) => ({
      ...prev,
      question: questionText || prev.question,
      options: parsedOptions,
      correct_idx: correctIdx < parsedOptions.length ? correctIdx : 0,
      explanation: explanationText || prev.explanation
    }));

    setIsBulkMode(false); // Form moduna dön ve hekime inceleme şansı ver
  };

  const handleSave = async () => {
    if (!trial.question.trim()) {
      alert("Hata: Soru gövdesi boş bırakılamaz.");
      return;
    }
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı.");

      const { id: tId, created_at, ...cleanPayload } = trial;
      const payload = { ...cleanPayload, user_id: user.id };

      let result;
      if (id === 'new') {
        result = await supabase.from('trials').insert([payload]).select().maybeSingle();
      } else {
        result = await supabase.from('trials').update(payload).eq('id', id).select().maybeSingle();
      }

      if (result.error) throw result.error;
      router.push(`/trials/${result.data.id || id}`);
    } catch (err: any) {
      console.error("Mühürleme Hatası Detay:", err);
      alert("Hata: " + (err.message || "Bilinmeyen bir pürüz oluştu."));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    const confirmDelete = confirm("Bu vaka külliyattan tamamen silinecek. Emin misin hekim?");
    if (!confirmDelete) return;

    setLoading(true);
    const { error } = await supabase.from('trials').delete().eq('id', id);
    if (!error) router.push('/trials');
    setLoading(false);
  };

  if (loading || !trial) return <div className="bg-[#010102] h-screen flex items-center justify-center text-[#D4AF37] animate-pulse tracking-[0.3em] uppercase text-[10px] font-mono">KÜLLİYAT HAZIRLANIYOR...</div>;

  return (
    <main onPaste={async (e) => {
      const url = await handlePaste(e);
      if (url) setTrial({...trial, image_url: url});
    }} className="min-h-screen bg-[#010102] text-[#E0E0E0] p-4 md:p-12 pb-40 md:pb-48 font-serif select-none">
      
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="border-b border-[#D4AF37]/10 pb-6 flex justify-between items-end">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold italic tracking-widest text-[#D4AF37] uppercase">Vaka Editörü</h1>
            <p className="text-[8px] text-white/30 uppercase tracking-widest mt-1 font-mono">Trials Module // Intellect Phase</p>
          </div>
          <div className="flex gap-4 font-mono">
            {id === 'new' && (
              <button 
                onClick={() => setIsBulkMode(!isBulkMode)}
                className="text-[9px] text-[#D4AF37] border border-[#D4AF37]/20 px-3 py-1.5 bg-[#D4AF37]/5 uppercase tracking-widest rounded-sm transition-all hover:bg-[#D4AF37]/10"
              >
                {isBulkMode ? '[ Form Modu ]' : '[ MS Word Modu ]'}
              </button>
            )}
            {id !== 'new' && (
              <button onClick={handleDelete} className="text-[9px] text-[#8B0000] hover:underline uppercase tracking-widest">[ VAKAYI İMHA ET ]</button>
            )}
          </div>
        </header>

        {isBulkMode ? (
          <section className="space-y-4 animate-in fade-in duration-300">
            <div className="p-4 bg-[#8B0000]/5 border border-[#8B0000]/20 rounded-sm">
              <span className="text-[8px] block text-red-400 uppercase tracking-widest mb-1 font-mono">Kollateral Ayrıştırıcı (Bulk Engine Engine v2.0)</span>
              <p className="text-xs italic text-white/60">Soru gövdesini, şıkları ve en alta "Cevap: C" ibaresini ekleyerek yapıştırın. Cevap satırından sonra yazacağınız açıklamalar otomatik olarak analiz kısmına aktarılacaktır.</p>
            </div>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="Örnek:&#10;1. Hücre membran yapısı...&#10;A) Fosfatidilkolin&#10;B) Sfingomyelin&#10;Cevap: A&#10;Bu sorunun patofizyolojik gerekçesi şudur..."
              className="w-full h-80 bg-black/50 border border-white/10 p-4 text-xs italic text-white/80 outline-none focus:border-[#D4AF37] resize-none leading-relaxed font-sans rounded-sm"
            />
            <button
              onClick={handleBulkParse}
              className="bg-[#D4AF37] text-black text-[9px] font-bold uppercase tracking-[0.2em] px-8 py-3 rounded-sm active:scale-95 transition-transform font-mono"
            >
              Matrisi Ayrıştır ve Forma Dağıt
            </button>
          </section>
        ) : (
          <div className="space-y-8 animate-in fade-in duration-300">
{/* Görsel Alanı */}
<section className="relative aspect-video bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden rounded-sm group">
  {trial.image_url ? (
    <>
      <img src={trial.image_url} alt="Önizleme" className="w-full h-full object-contain" />
      <button 
        type="button"
        onClick={() => setTrial({...trial, image_url: ''})} 
        className="absolute top-2 right-2 bg-black/80 border border-white/10 p-2 text-[8px] text-red-500 rounded-sm opacity-0 group-hover:opacity-100 transition-opacity font-mono"
      >
        Görseli Kaldır
      </button>
    </>
  ) : (
    <p className="text-[9px] text-white/20 uppercase tracking-widest italic font-mono">[ Vaka Görselini Buraya Ctrl+V İle Yapıştır ]</p>
  )}
</section>

            {/* Soru Metni */}
            <section className="space-y-2">
              <label className="text-[8px] text-white/30 uppercase tracking-widest font-mono">Soru Metni</label>
              <textarea 
                value={trial.question}
                onChange={(e) => setTrial({...trial, question: e.target.value})}
                placeholder="Klinik soruyu buraya mühürle..."
                className="w-full bg-black/20 border border-white/5 focus:border-[#D4AF37]/30 p-4 text-sm md:text-base italic outline-none min-h-[100px] leading-relaxed rounded-sm font-serif"
              />
            </section>

            {/* Şıklar */}
            <div className="space-y-4">
              <label className="text-[8px] text-white/30 uppercase tracking-widest font-mono block">Seçenek Yapısı & Doğru Matris</label>
              {trial.options.map((opt: string, i: number) => (
                <div key={i} className="flex gap-3 items-center">
                  <button 
                    type="button"
                    onClick={() => setTrial({...trial, correct_idx: i})}
                    className={`w-10 h-10 border text-xs flex items-center justify-center font-bold transition-all rounded-sm font-mono ${trial.correct_idx === i ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_10px_rgba(212,175,55,0.2)]' : 'border-white/10 text-white/30 hover:border-white/20'}`}
                  >
                    {String.fromCharCode(65 + i)}
                  </button>
                  <input 
                    value={opt}
                    onChange={(e) => {
                      const newOpts = [...trial.options];
                      newOpts[i] = e.target.value;
                      setTrial({...trial, options: newOpts});
                    }}
                    className="flex-1 bg-white/[0.01] border border-white/5 p-3 text-xs italic outline-none focus:border-[#D4AF37]/30 rounded-sm font-sans"
                  />
                  {trial.options.length > 2 && (
                    <button 
                      type="button"
                      onClick={() => {
                        const newOpts = trial.options.filter((_: any, idx: number) => idx !== i);
                        // Eğer doğru index silinen aralığın dışına çıkarsa sıfırla
                        const newCorrectIdx = trial.correct_idx >= newOpts.length ? 0 : trial.correct_idx;
                        setTrial({...trial, options: newOpts, correct_idx: newCorrectIdx});
                      }}
                      className="text-white/20 hover:text-red-500 transition-colors text-xs px-2"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
              <button type="button" onClick={() => setTrial({...trial, options: [...trial.options, '']})} className="text-[8px] text-[#D4AF37]/50 uppercase tracking-widest font-mono transition-colors hover:text-[#D4AF37]">+ Yeni Şık Enjekte Et</button>
            </div>

            {/* Açıklama */}
            <section className="space-y-2">
              <label className="text-[8px] text-white/30 uppercase tracking-widest font-mono block">Klinik Analiz & Textbook Referansı (Explanation)</label>
              <textarea 
                value={trial.explanation}
                onChange={(e) => setTrial({...trial, explanation: e.target.value})}
                className="w-full bg-black/60 border border-white/5 p-4 text-xs italic text-white/60 leading-relaxed outline-none min-h-[120px] rounded-sm font-sans whitespace-pre-line"
                placeholder="Doğru yanıtın patofizyolojik gerekçesini buraya mühürle..."
              />
            </section>

            {/* Meta Alanları */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="text-[8px] text-white/30 uppercase tracking-widest font-mono block mb-2">Branş</label>
                <select 
                  value={trial.subject}
                  onChange={e => setTrial({...trial, subject: e.target.value})}
                  className="w-full bg-black/40 border border-white/10 p-3 text-[#D4AF37] text-[10px] uppercase tracking-widest outline-none rounded-sm font-mono"
                >
                  <option value="Anatomi">Anatomi</option>
                  <option value="Fizyoloji">Fizyoloji</option>
                  <option value="Histoloji">Histoloji</option>
                  <option value="Biyokimya">Biyokimya</option>
                  <option value="Mikrobiyoloji">Mikrobiyoloji</option>
                  <option value="Patoloji">Patoloji</option>
                </select>
              </div>
              <div>
                <label className="text-[8px] text-white/30 uppercase tracking-widest font-mono block mb-2">Etiket İzlemleri</label>
                <DivineTagInput tags={trial.tags || []} onChange={(t) => setTrial({...trial, tags: t})} />
              </div>
            </div>
          </div>
        )}
      </div>

{/* FOOTER MÜHÜRLEME BARUTU - YENİ DÜZENLEME */}
<footer className="mt-12 border-t border-t-white/5 pt-6 pb-12 flex justify-end">
  <button 
    disabled={isBulkMode}
    onClick={handleSave} 
    className="w-full sm:w-auto bg-[#D4AF37] text-black px-12 py-3.5 font-bold uppercase text-[10px] tracking-[0.3em] active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.15)] disabled:opacity-10 rounded-sm font-mono"
  >
    VAKAYI KÜLLİYATA MÜHÜRLE
  </button>
</footer>
    </main>
  );
}
