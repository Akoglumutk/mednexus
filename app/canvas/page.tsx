'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function CanvasArchive() {
  const [drawings, setDrawings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchDrawings() {
      const { data } = await supabase.from('canvas_storage').select('*').order('created_at', { ascending: false });
      setDrawings(data || []);
      setLoading(false);
    }
    fetchDrawings();
  }, []);

  return (
    <main className="min-h-screen bg-[#010102] text-[#E0E0E0] p-6 font-serif">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#8B0000]/20 pb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-[0.2em] text-[#D4AF37] uppercase italic">Parşömen</h1>
          <p className="text-[10px] text-[#D4AF37]/40 uppercase tracking-[0.3em] mt-2 tracking-widest">Görsel, zihnin haritasıdır</p>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="text-[10px] text-[#D4AF37]/50 hover:text-[#D4AF37] transition-all uppercase tracking-widest border border-[#D4AF37]/10 px-4 py-2 bg-white/5"
        >
          [ Ana Kapı ]
        </button>
        <button 
          onClick={() => router.push('/canvas/editor/new')}
          className="bg-[#D4AF37] text-white px-10 py-3 text-[10px] font-bold tracking-[0.2em] uppercase active:scale-95"
        >
          Yeni çizim oluştur
        </button>
      </header>


      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-20 animate-pulse text-[#D4AF37]/20 uppercase text-[10px] tracking-widest">Mürekkep Hazırlanıyor...</div>
        ) : drawings.map((doc) => (
          <div 
            key={doc.id}
            onClick={() => router.push(`/canvas/editor/${doc.id}`)}
            className="group border border-white/5 bg-white/[0.02] p-6 cursor-pointer hover:border-[#8B0000]/40 transition-all relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[8px] text-[#D4AF37]">DÜZENLE →</span>
            </div>
            <h3 className="text-[#D4AF37] text-lg font-bold mb-2 italic">#{doc.name}</h3>
            <p className="text-[9px] text-white/20 uppercase tracking-widest">
              {new Date(doc.created_at).toLocaleDateString('tr-TR')}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}