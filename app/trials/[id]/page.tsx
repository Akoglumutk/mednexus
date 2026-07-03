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
  const [mounted, setMounted] = useState(false);

  // --- GOTİK KUTSAL KUM SAATİ (POMODORO/TIMER) STATE'LERİ ---
  const [seconds, setSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    setSelectedIdx(null);
    setShowResult(false);
    setTrial(null);
    setSeconds(0);
    setIsTimerActive(true);
    
    fetchTrial();
  }, [id]);

  // Kronometre Akış Motoru
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && !showResult) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, showResult]);

  async function fetchTrial() {
    const { data } = await supabase.from('trials').select('*').eq('id', id).single();
    if (data) {
      setTrial({
        ...data,
        explanation: data.explanation || '',
        image_url: data.image_url || '',
        options: data.options || ['', '', '', ''],
        tags: data.tags || []
      });
    }
  }

  // Zaman Formatlayıcı (00:00)
  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  if (!mounted || !trial) {
    return <div className="h-screen bg-[#010102] flex items-center justify-center text-[#D4AF37] tracking-[0.3em] text-[10px] uppercase font-mono animate-pulse">VAKA YÜKLENİYOR...</div>;
  }

  return (
    <main className="min-h-screen bg-[#010102] text-[#E0E0E0] p-6 md:p-20 font-serif pb-40">
      <div className="max-w-3xl mx-auto space-y-10">
        <header className="flex justify-between items-center text-[10px] text-[#D4AF37]/40 uppercase tracking-widest border-b border-white/5 pb-6 font-mono">
          <div className="flex gap-4 items-center">
            {/* Soruyu Çözmeden Güvenli Geri Dönüş Rotası */}
            <button onClick={() => router.push('/trials')} className="hover:text-[#D4AF37] text-white/30 transition-colors">← KÜLLİYAT</button>
            <span>// {trial.subject} // İMTİHAN</span>
          </div>
          
          {/* GOTİK KUM SAATI UI ELEMENTİ */}
          <div className="flex items-center gap-3 bg-white/[0.02] border border-white/5 px-3 py-1.5 rounded-sm">
            <span className={`w-1.5 h-1.5 rounded-full ${isTimerActive ? 'bg-[#D4AF37] animate-ping' : 'bg-white/20'}`} />
            <span className="text-[#D4AF37] font-bold tracking-wider">{formatTime(seconds)}</span>
            <button 
              onClick={() => setIsTimerActive(!isTimerActive)} 
              className="text-white/20 hover:text-white transition-colors text-[8px] ml-1"
            >
              {isTimerActive ? '[ DURDUR ]' : '[ BAŞLAT ]'}
            </button>
          </div>

          <button className="hover:text-[#D4AF37] transition-colors" onClick={() => router.push('/trials/editor/' + trial.id)}>[ Düzenle ]</button>
        </header>

        {trial.image_url && (
          <div className="w-full max-h-[400px] border border-white/5 bg-black/20 p-4 flex justify-center items-center overflow-hidden">
            <img src={trial.image_url} alt="Vaka Görseli" className="max-w-full max-h-[360px] object-contain" />
          </div>
        )}

        <h2 className="text-xl md:text-2xl font-medium leading-relaxed italic text-white/90">
          "{trial.question}"
        </h2>

        <div className="grid gap-3">
          {trial.options.map((opt: string, i: number) => (
            <button 
              key={i}
              disabled={showResult}
              onClick={() => { setSelectedIdx(i); setShowResult(true); setIsTimerActive(false); }}
              className={`w-full text-left p-5 border transition-all duration-500 relative overflow-hidden ${
                showResult 
                  ? i === trial.correct_idx 
                    ? 'border-[#D4AF37] bg-[#D4AF37]/10' 
                    : i === selectedIdx ? 'border-[#8B0000] bg-[#8B0000]/10' : 'border-white/5 opacity-40'
                  : 'border-white/10 hover:border-[#D4AF37]/40 bg-white/[0.02]'
              }`}
            >
              <span className="mr-4 text-[#D4AF37]/40 font-bold font-mono">{String.fromCharCode(65 + i)})</span>
              <span className="text-sm font-sans">{opt}</span>
            </button>
          ))}
        </div>

        {showResult && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className={`p-6 border-l-2 ${selectedIdx === trial.correct_idx ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-[#8B0000] bg-[#8B0000]/5'}`}>
              <h4 className="text-[10px] uppercase tracking-widest mb-4 font-bold font-mono flex justify-between">
                <span>{selectedIdx === trial.correct_idx ? '✓ Başarılı Analiz' : '✗ Hatalı Teşhis'}</span>
                <span className="text-white/30 text-[9px] font-normal font-mono">Teşhis Süresi: {formatTime(seconds)}</span>
              </h4>
              <p className="text-sm italic text-white/70 leading-relaxed font-sans whitespace-pre-line">
                {trial.explanation || "Bu vaka için klinik açıklama girilmemiş."}
              </p>
            </div>
            <button 
              onClick={() => router.push('/trials')}
              className="mt-8 text-[9px] uppercase tracking-[0.3em] text-[#D4AF37]/40 hover:text-[#D4AF37] transition-all font-mono"
            >
              [ Külliyata Dön ]
            </button>
          </section>
        )}
      </div>
    </main>
  );
}
