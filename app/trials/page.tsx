// app/trials/page.tsx
'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import SearchGozcu from '@/components/SearchGozcu';

export default function TrialsArchive() {
  const [trials, setTrials] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    async function fetchTrials() {
      const { data } = await supabase.from('trials').select('*').order('created_at', { ascending: false });
      setTrials(data || []);
      setLoading(false);
    }
    fetchTrials();
  }, []);

  const filteredTrials = trials.filter(t => {
    const questionMatch = t.question?.toLowerCase().includes(search.toLowerCase());
    const tagMatch = t.tags?.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()));
    return questionMatch || tagMatch;
  });

  if (!mounted) return null;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] p-6 font-serif">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#8B0000]/20 pb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-[0.2em] text-[#8B0000] uppercase italic">İmtihan</h1>
          <p className="text-[10px] text-[#D4AF37]/40 uppercase tracking-[0.3em] mt-2 tracking-widest font-mono">Sorgu, Hakikate Götürür</p>
        </div>
        <div className="flex flex-wrap gap-4 font-mono">
          <button 
            onClick={() => router.push('/')}
            className="text-[10px] text-[#D4AF37]/50 hover:text-[#D4AF37] transition-all uppercase tracking-widest border border-[#D4AF37]/10 px-4 py-2 bg-white/5"
          >
            [ Ana Kapı ]
          </button>
          <button 
            onClick={() => router.push('/trials/editor/new')}
            className="bg-[#8B0000] text-white px-10 py-3 text-[10px] font-bold tracking-[0.2em] uppercase active:scale-95 transition-transform"
          >
            Yeni Soru Mühürle
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto mb-12">
        <SearchGozcu value={search} onChange={setSearch} />
      </div>

      <div className="max-w-5xl mx-auto grid gap-4">
        {loading ? (
          <p className="text-center text-[#D4AF37]/20 animate-pulse uppercase text-xs tracking-widest font-mono">Sorgu Odası Hazırlanıyor...</p>
        ) : filteredTrials.length === 0 ? (
          <p className="text-center text-white/20 italic text-sm py-10">Külliyatta bu sorguya eş değer bir iz bulunamadı.</p>
        ) : (
          filteredTrials.map((trial) => (
            <div 
              key={trial.id} 
              onClick={() => router.push(`/trials/${trial.id}`)}
              className="group relative bg-black/40 border border-white/5 p-6 cursor-pointer hover:border-[#8B0000]/50 transition-all active:scale-[0.99]"
            >
              <div className="flex justify-between items-start mb-4 font-mono">
                <span className="text-[9px] text-[#D4AF37]/30 uppercase tracking-widest">
                  #{trial.tags?.[0] || trial.subject || 'Genel'}
                </span>
                <button 
                  onClick={(e) => { e.stopPropagation(); router.push(`/trials/editor/${trial.id}`); }}
                  className="text-[8px] text-white/20 hover:text-[#D4AF37] uppercase tracking-widest"
                >
                  [ Düzenle ]
                </button>
              </div>
              <p className="text-sm italic text-white/80 line-clamp-2 leading-relaxed font-serif">"{trial.question}"</p>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
