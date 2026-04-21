'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import SearchGozcu from '@/components/SearchGozcu';

export default function Scriptorium() {
  const router = useRouter();
  const [notes, setNotes] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotes();
  }, []);

  async function fetchNotes() {
    setLoading(true);
    const { data, error } = await supabase
      .from('notes')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error) setNotes(data || []);
    setLoading(false);
  }

  // Arama filtresi (Başlık veya Etiket içinde arar)
  const filteredNotes = notes.filter(note => 
    note.title.toLowerCase().includes(search.toLowerCase()) ||
    note.tags.some((tag: string) => tag.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] p-4 md:p-12 font-serif">
      <header className="max-w-4xl mx-auto mb-10 border-b border-[#D4AF37]/20 pb-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 text-center md:text-left">
          <div>
            <h1 className="text-4xl font-bold tracking-[0.2em] text-[#D4AF37] uppercase">Matbaa</h1>
            <p className="text-[10px] text-[#D4AF37]/40 tracking-[0.3em] uppercase italic mt-1">
              Scripta manent, verba volant
            </p>
          </div>
          <button 
            onClick={() => router.push('/')}
            className="text-[10px] text-[#D4AF37]/50 hover:text-[#D4AF37] transition-all uppercase tracking-widest border border-[#D4AF37]/10 px-4 py-2 bg-white/5"
          >
            [ Ana Kapı ]
          </button>
          <Link href="/scriptorium/new" 
            className="w-full md:w-auto bg-[#D4AF37] text-black px-10 py-3 text-[10px] font-bold tracking-[0.2em] uppercase active:scale-95 transition-transform">
            Yeni Giriş
          </Link>
        </div>

        {/* Arama Barı - Touch Friendly */}
        <div className="mt-10 relative">
          <SearchGozcu value={search} onChange={setSearch} />
        </div>
      </header>

      <div className="max-w-4xl mx-auto space-y-4">
        {loading ? (
          <p className="text-center text-[#D4AF37]/20 animate-pulse uppercase tracking-widest text-xs">Arşiv taranıyor...</p>
        ) : filteredNotes.length > 0 ? (
          filteredNotes.map((note) => (
            <Link key={note.id} href={`/scriptorium/${note.id}`} className="block">
              <div className="p-6 bg-black/40 border border-[#D4AF37]/10 active:bg-[#8B0000]/5 active:border-[#8B0000]/30 transition-all">
                <div className="flex justify-between items-start">
                  <h2 className="text-xl text-[#D4AF37] tracking-wide mb-2">{note.title}</h2>
                  <span className="text-[9px] text-[#D4AF37]/20 uppercase">
                    {new Date(note.created_at).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                
                <div className="flex flex-wrap gap-2 mt-2">
                  {note.tags?.map((tag: string) => (
                    <span key={tag} className="text-[9px] bg-[#8B0000]/10 text-[#8B0000] px-2 py-0.5 border border-[#8B0000]/20 lowercase">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-center text-[#D4AF37]/20 text-xs py-20 italic">Aranılan bilgi bu çağda mevcut değil.</p>
        )}
      </div>
    </main>
  );
}