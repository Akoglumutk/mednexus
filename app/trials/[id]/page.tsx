'use client'
import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function TrialSolver() {
  const { id } = useParams();
  const router = useRouter();
  const [trial, setTrial] = useState<any>(null);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);

  useEffect(() => {
    fetchTrial();
  }, [id]);

  async function fetchTrial() {
    const { data } = await supabase.from('trials').select('*').eq('id', id).single();
    if (data) setTrial(data);
  }

  if (!trial) return <div className="h-screen bg-[#010102] flex items-center justify-center text-[#D4AF37]">VAKA YÜKLENİYOR...</div>;

  return (
    <main className="min-h-screen bg-[#010102] text-[#E0E0E0] p-6 md:p-20 font-serif">
      <div className="max-w-3xl mx-auto space-y-10">
        <header className="flex justify-between items-center text-[10px] text-[#D4AF37]/40 uppercase tracking-widest border-b border-white/5 pb-6">
          <span>{trial.subject} // İMTİHAN</span>
          <button onClick={() => router.push('/trials/editor/' + trial.id)}>[ Düzenle ]</button>
        </header>

        {trial.image_url && (
          <img src={trial.image_url} className="w-full max-h-[400px] object-contain border border-white/5 bg-black/20 p-4" />
        )}

        <h2 className="text-2xl font-medium leading-relaxed italic text-white/90">
          "{trial.question}"
        </h2>

        <div className="grid gap-3">
          {trial.options.map((opt: string, i: number) => (
            <button 
              key={i}
              disabled={showResult}
              onClick={() => { setSelectedIdx(i); setShowResult(true); }}
              className={`w-full text-left p-5 border transition-all duration-500 relative overflow-hidden ${
                showResult 
                  ? i === trial.correct_idx 
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10' 
                    : i === selectedIdx ? 'border-[#8B0000] bg-[#8B0000]/10' : 'border-white/5 opacity-40'
                  : 'border-white/10 hover:border-[#D4AF37]/40 bg-white/[0.02]'
              }`}
            >
              <span className="mr-4 text-[#D4AF37]/40 font-bold">{String.fromCharCode(65 + i)})</span>
              <span className="text-sm">{opt}</span>
            </button>
          ))}
        </div>

        {showResult && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-1000">
            <div className={`p-6 border-l-2 ${selectedIdx === trial.correct_idx ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-[#8B0000] bg-[#8B0000]/5'}`}>
              <h4 className="text-[10px] uppercase tracking-widest mb-4 font-bold">
                {selectedIdx === trial.correct_idx ? '✓ Başarılı Analiz' : '✗ Hatalı Teşhis'}
              </h4>
              <p className="text-sm italic text-white/70 leading-relaxed">
                {trial.explanation || "Bu vaka için klinik açıklama girilmemiş."}
              </p>
            </div>
            <button 
              onClick={() => router.push('/trials')}
              className="mt-8 text-[9px] uppercase tracking-[0.3em] text-[#D4AF37]/40 hover:text-[#D4AF37] transition-all"
            >
              [ Külliyata Dön ]
            </button>
          </section>
        )}
      </div>
    </main>
  );
}