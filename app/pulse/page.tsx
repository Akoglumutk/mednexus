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
  const [mounted, setMounted] = useState(false);
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
    setMounted(true);
    async function fetchPulse() {
      setLoading(true);
      try {
        const { data: notes } = await supabase.from('notes').select('*');
        const { data: atlas } = await supabase.from('atlas_assets').select('*');
        const { data: trials } = await supabase.from('trials').select('*'); 
        
        const combined = [
          ...(notes || []).map(n => ({ ...n, type: 'note' })),
          ...(atlas || []).map(a => ({ ...a, type: 'atlas' })),
          ...(trials || []).map(t => ({ 
            ...t, 
            type: 'trial', 
            // Controlled component koruması ve güvenli substring
            title: t.question ? (t.question.substring(0, 60) + "...") : "Klinik Vaka Sorusu"
          })),
        ];
      
        setItems(shuffleArray(combined));
      } catch (err) {
        console.error("Ritim yakalama hatası:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchPulse();
  }, []);

  if (!mounted || loading) {
    return (
      <div className="h-screen bg-[#0A0A0A] flex items-center justify-center text-[#D4AF37] uppercase text-[10px] tracking-[0.3em] font-mono animate-pulse">
        Ritim Aranıyor...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] font-serif pb-40 select-none">
      {/* Sticky Header ve Mobil Uyumlu Grid */}
      <header className="p-4 md:p-6 border-b border-[#D4AF37]/10 sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-md z-40">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-center sm:text-left">
            <h1 className="text-xl font-bold tracking-[0.3em] text-[#D4AF37] uppercase italic">Nabız</h1>
            <p className="text-[7px] text-white/30 uppercase tracking-widest font-mono mt-0.5">Compendium // Reaktif Akış</p>
          </div>
          <div className="w-full sm:w-72">
            <SearchGozcu value={search} onChange={setSearch} />
          </div>
        </div>
      </header>

      {/* Akış Alanı */}
      <div className="max-w-2xl mx-auto p-4 space-y-8 mt-6">
        {filteredItems.length === 0 ? (
          <p className="text-center text-white/20 italic text-xs py-12">Nabız sönümlendi. Uygun veri bulunamadı.</p>
        ) : (
          filteredItems.map((item) => (
            <article 
              key={`${item.type}-${item.id}`} 
              className="bg-black/40 border border-white/5 p-5 md:p-6 backdrop-blur-sm group hover:border-[#D4AF37]/20 transition-all rounded-sm relative overflow-hidden"
            >
              {/* Üst Bilgi Satırı */}
              <div className="flex justify-between items-center mb-4 font-mono">
                <span className={`text-[7px] uppercase tracking-[0.3em] font-bold px-2 py-0.5 rounded-sm ${
                  item.type === 'trial' ? 'text-[#8B0000] bg-[#8B0000]/10' : 
                  item.type === 'atlas' ? 'text-blue-400 bg-blue-400/10' : 'text-[#D4AF37] bg-[#D4AF37]/10'
                }`}>
                  {item.type} // {item.subject || 'GENEL'}
                </span>
                <span className="text-[8px] text-white/20 italic">
                  {item.created_at ? new Date(item.created_at).toLocaleDateString('tr-TR') : 'Mühürsüz Zaman'}
                </span>
              </div>

              {/* TİP A: TRIAL (VAKA) */}
              {item.type === 'trial' && (
                <div className="space-y-4">
                  <p className="text-sm md:text-base text-white/90 italic leading-relaxed line-clamp-4 md:line-clamp-none">
                    "{item.question}"
                  </p>
                  <button 
                    onClick={() => router.push(`/trials/${item.id}`)} 
                    className="text-[9px] text-[#8B0000] border border-[#8B0000]/30 px-3 py-1.5 uppercase font-mono tracking-wider hover:bg-[#8B0000]/10 transition-colors"
                  >
                    Vakayı Çöz
                  </button>
                </div>
              )}

              {/* TİP B: NOTE (NOTLAR / SCRIPTORIUM) */}
              {item.type === 'note' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-[#D4AF37] italic uppercase tracking-wide">{item.title}</h2>
                  <div className="max-h-24 overflow-hidden relative opacity-60">
                    <Viewer content={item.content} />
                    <div className="absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-[#0A0A0A] to-transparent" />
                  </div>
                  <button 
                    onClick={() => router.push(`/scriptorium/${item.id}`)} 
                    className="text-[9px] text-[#D4AF37] border border-[#D4AF37]/30 px-3 py-1.5 uppercase font-mono tracking-wider hover:bg-[#D4AF37]/10 transition-colors"
                  >
                    Notu Aç
                  </button>
                </div>
              )}

              {/* TİP C: ATLAS (PREPARATLAR) */}
              {item.type === 'atlas' && (
                <div className="space-y-4">
                  <h2 className="text-lg font-bold text-white/90 italic uppercase tracking-wide">{item.title}</h2>
                  {item.image_url && (
                    <div className="w-full max-h-[300px] bg-black/20 border border-white/5 p-2 overflow-hidden flex justify-center items-center">
                      <img src={item.image_url} alt={item.title} className="max-w-full max-h-[280px] object-contain opacity-80 group-hover:opacity-100 transition-opacity" />
                    </div>
                  )}
                  {item.description && (
                    <p className="text-xs text-white/40 italic line-clamp-2 border-l border-blue-400/30 pl-3 leading-relaxed">
                      {item.description}
                    </p>
                  )}
                  <button 
                    onClick={() => router.push(`/atlas/${item.id}`)} 
                    className="text-[9px] text-blue-400 border border-blue-400/30 px-3 py-1.5 uppercase font-mono tracking-wider hover:bg-blue-400/10 transition-colors"
                  >
                    Preparata Git
                  </button>
                </div>
              )}

              {/* ORTAK ETİKET BULUTU */}
              {item.tags && item.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-6 border-t border-white/5 pt-4">
                  {item.tags.map((tag: string) => (
                    <span 
                      key={tag} 
                      onClick={() => setSearch(tag)} // Etikete basınca akışı otomatik filtreleme fonksiyonu!
                      className="text-[8px] text-white/30 hover:text-[#D4AF37] uppercase italic cursor-pointer font-mono transition-colors"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </article>
          ))
        )}
      </div>
    </main>
  );
}
