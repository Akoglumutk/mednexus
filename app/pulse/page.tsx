'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Viewer from '@/components/Viewer';
import SearchGozcu from '@/components/SearchGozcu';
import { shuffleArray } from '@/lib/utils';

export default function Pulse() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const router = useRouter();

  const filteredItems = items.filter(item => {
    const searchTerm = search.toLowerCase();
    return (
      item.title?.toLowerCase().includes(searchTerm) ||
      item.question?.toLowerCase().includes(searchTerm) ||
      item.tags?.some((tag: string) => tag.toLowerCase().includes(searchTerm))
    );
  });

  useEffect(() => {
    async function fetchPulse() {
      setLoading(true);
      const { data: notes } = await supabase.from('notes').select('*');
      const { data: atlas } = await supabase.from('atlas_assets').select('*');
      
      // KRİTİK: Tablo adını 'trials' olarak güncelledik
      const { data: trials } = await supabase.from('trials').select('*'); 
      
      const combined = [
        ...(notes || []).map(n => ({ ...n, type: 'note' })),
        ...(atlas || []).map(a => ({ ...a, type: 'atlas' })),
        // 'question' alanını 'title' veya 'text' olarak map'liyoruz ki NabizCard okuyabilsin
        ...(trials || []).map(t => ({ 
          ...t, 
          type: 'trial', 
          title: t.question.substring(0, 60) + "..." // Soru kökünü başlık yapıyoruz
        })),
      ];
    
      setItems(shuffleArray(combined));
      setLoading(false);
    }
    fetchPulse();
  }, []);

  if (loading) return <div className="h-screen bg-[#0A0A0A] flex items-center justify-center animate-pulse text-[#D4AF37] uppercase text-xs tracking-widest">Ritim Aranıyor...</div>;

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] font-serif pb-24">
      <header className="p-4 md:p-6 border-b border-[#D4AF37]/10 sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-md z-50">
        <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <h1 className="text-xl font-bold tracking-[0.3em] text-[#D4AF37] uppercase italic">Nabız</h1>
          <SearchGozcu value={search} onChange={setSearch} />
          <div className="flex justify-end">
            <button onClick={() => router.push('/')} className="text-[10px] text-[#D4AF37]/50 hover:text-[#D4AF37] transition-all uppercase tracking-widest border border-[#D4AF37]/10 px-4 py-2 bg-white/5">[ Ana Kapı ]</button>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4 space-y-12 mt-10">
        {filteredItems.map((item) => (
          <article key={`${item.type}-${item.id}`} className="bg-black/40 border border-white/5 p-6 backdrop-blur-sm group hover:border-[#D4AF37]/30 transition-all">
            
            {/* TİP ETİKETİ VE TARİH */}
            <div className="flex justify-between items-center mb-4">
               <span className={`text-[7px] uppercase tracking-[0.3em] font-bold px-2 py-1 ${
                 item.type === 'trial' ? 'text-[#8B0000] bg-[#8B0000]/10' : 
                 item.type === 'atlas' ? 'text-blue-400 bg-blue-400/10' : 'text-[#D4AF37] bg-[#D4AF37]/10'
               }`}>
                 {item.type} // {item.subject || 'GENEL'}
               </span>
               <span className="text-[8px] text-white/20 italic">{new Date(item.created_at).toLocaleDateString('tr-TR')}</span>
            </div>

            {/* İÇERİK RENDER */}
            {item.type === 'trial' && (
              <div className="space-y-4">
                <p className="text-lg text-white italic leading-relaxed">"{item.text || item.question}"</p>
                <button onClick={() => router.push(`/trials/${item.id}`)} className="text-[9px] text-[#8B0000] border border-[#8B0000]/30 px-3 py-1 uppercase">Vakayı Çöz</button>
              </div>
            )}

            {item.type === 'note' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#D4AF37] italic uppercase">{item.title}</h2>
                <div className="max-h-24 overflow-hidden relative opacity-50">
                  <Viewer content={item.content} />
                  <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-black to-transparent" />
                </div>
                <button onClick={() => router.push(`/scriptorium/${item.id}`)} className="text-[9px] text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1 uppercase">Notu Aç</button>
              </div>
            )}

            {item.type === 'atlas' && (
              <div className="space-y-4">
                <h2 className="text-xl font-bold text-[#D4AF37] italic uppercase">{item.title}</h2>
                {item.image_url && <img src={item.image_url} className="w-full h-auto border border-white/5 opacity-80" />}
                {item.description && <p className="text-[11px] text-white/40 italic line-clamp-2 border-l border-blue-400/30 pl-3">{item.description}</p>}
                <button onClick={() => router.push(`/atlas/${item.id}`)} className="text-[9px] text-blue-400 border border-blue-400/30 px-3 py-1 uppercase">Preparata Git</button>
              </div>
            )}

            {/* ETİKET BULUTU (Ortak) */}
            <div className="flex flex-wrap gap-2 mt-6 border-t border-white/5 pt-4">
              {item.tags?.map((tag: string) => (
                <span key={tag} className="text-[8px] text-white/30 uppercase italic">#{tag}</span>
              ))}
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}