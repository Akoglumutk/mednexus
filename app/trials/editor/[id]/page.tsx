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
      setLoading(false);
    } else {
      fetchTrial();
    }
  }, [id]);

  async function fetchTrial() {
    const { data, error } = await supabase.from('trials').select('*').eq('id', id).single();
    if (data) setTrial(data);
    setLoading(false);
  }

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Oturum bulunamadı.");

      // Payload temizliği
      const { id: tId, created_at, ...cleanPayload } = trial;
      const payload = { 
        ...cleanPayload, 
        user_id: user.id // Kullanıcı ID'sini kesinleştiriyoruz
      };

      let result;
      if (id === 'new') {
        result = await supabase.from('trials').insert([payload]).select().maybeSingle();
      } else {
        result = await supabase.from('trials').update(payload).eq('id', id).select().maybeSingle();
      }

      if (result.error) throw result.error;
      
      if (!result.data) {
        // RLS duvarına çarptığımızda buraya düşeriz
        throw new Error("Güncelleme başarısız. Bu vakayı düzenleme yetkiniz olmayabilir.");
      }

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

    if (!error) {
      router.push('/trials');
    } else {
      alert("İmha hatası: " + error.message);
      setLoading(false);
    }
  };

  if (loading || !trial) return <div className="bg-[#010102] h-screen flex items-center justify-center text-[#D4AF37] animate-pulse">KÜLLİYAT HAZIRLANIYOR...</div>;

  return (
    <main onPaste={async (e) => {
      const url = await handlePaste(e);
      if (url) setTrial({...trial, image_url: url});
    }} className="min-h-screen bg-[#010102] text-[#E0E0E0] p-8 md:p-16 pb-32">
      
      <div className="max-w-4xl mx-auto space-y-12">
        <header className="border-b border-[#D4AF37]/20 pb-6 flex justify-between items-end">
          <h1 className="text-3xl font-bold italic tracking-widest text-[#D4AF37] uppercase">Vaka Editörü</h1>
          <div className="flex gap-6">
            {id !== 'new' && (
              <button onClick={handleDelete} className="text-[10px] text-[#8B0000] hover:underline uppercase tracking-widest">
                [ VAKAYI İMHA ET ]
              </button>
            )}
            <button onClick={() => router.back()} className="text-[10px] opacity-30 hover:opacity-100 uppercase tracking-widest">
              [ Vazgeç ]
            </button>
          </div>
        </header>

        {/* Görsel Alanı */}
        <section className="relative aspect-video bg-black/40 border border-white/5 flex items-center justify-center overflow-hidden">
          {trial.image_url ? (
            <img src={trial.image_url} className="w-full h-full object-contain" />
          ) : (
            <p className="text-[10px] text-white/20 uppercase italic">[ Ctrl+V ile Vaka Görseli Yapıştır ]</p>
          )}
        </section>

        {/* Soru Metni */}
        <textarea 
          value={trial.question}
          onChange={(e) => setTrial({...trial, question: e.target.value})}
          placeholder="Klinik soruyu buraya mühürle..."
          className="w-full bg-transparent border-l-2 border-[#D4AF37]/30 p-6 text-xl italic outline-none min-h-[120px]"
        />

        {/* Dinamik Şıklar */}
        <div className="space-y-4">
          <p className="text-[10px] text-[#D4AF37]/50 uppercase tracking-widest">Seçenekler & Doğru Yanıt</p>
          {trial.options.map((opt: string, i: number) => (
            <div key={i} className="flex gap-4 items-center">
              <button 
                onClick={() => setTrial({...trial, correct_idx: i})}
                className={`w-10 h-10 border flex items-center justify-center font-bold transition-all ${trial.correct_idx === i ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'border-white/10 text-white/20'}`}
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
                className="flex-1 bg-white/[0.02] border border-white/5 p-4 text-sm italic outline-none focus:border-[#D4AF37]/30"
              />
            </div>
          ))}
          <button onClick={() => setTrial({...trial, options: [...trial.options, '']})} className="text-[9px] text-[#D4AF37]/40 uppercase">+ Şık Ekle</button>
        </div>

        {/* Açıklama (Explanation) */}
        <section>
          <p className="text-[10px] text-[#D4AF37]/50 uppercase tracking-widest mb-4">Klinik Analiz (Açıklama)</p>
          <textarea 
            value={trial.explanation}
            onChange={(e) => setTrial({...trial, explanation: e.target.value})}
            className="w-full bg-black/60 border border-white/5 p-6 text-xs italic text-white/60 leading-relaxed outline-none min-h-[150px]"
            placeholder="Doğru yanıtın nedenini ve klinik incileri buraya not et..."
          />
        </section>

        {/* Etiketler */}
        <DivineTagInput tags={trial.tags || []} onChange={(t) => setTrial({...trial, tags: t})} />
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-black/90 border-t border-[#D4AF37]/20 p-6 z-50">
        <div className="max-w-4xl mx-auto flex justify-end">
          <button onClick={handleSave} className="bg-[#D4AF37] text-black px-12 py-3 font-bold uppercase text-[10px] tracking-[0.3em] active:scale-95 transition-all shadow-[0_0_20px_rgba(212,175,55,0.2)]">
            VAKAYI MÜHÜRLE
          </button>
        </div>
      </footer>
    </main>
  );
}