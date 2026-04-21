'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import SearchGozcu from '@/components/SearchGozcu';

export default function AtlasArchive() {
  const [assets, setAssets] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    async function fetchAtlas() {
      const { data } = await supabase.from('atlas_assets').select('*').order('created_at', { ascending: false });
      setAssets(data || []);
      setLoading(false);
    }
    fetchAtlas();
  }, []);

  const filteredAssets = assets.filter(asset => 
    asset.title.toLowerCase().includes(search.toLowerCase()) ||
    asset.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] p-4 md:p-12 font-serif pb-24">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#D4AF37]/10 pb-8">
        <div>
          <h1 className="text-4xl font-bold tracking-[0.2em] text-[#D4AF37] uppercase">Atlas</h1>
          <p className="text-[10px] text-[#D4AF37]/40 uppercase tracking-[0.3em] mt-2 italic">Imago est veritas</p>
        </div>
        <button 
          onClick={() => router.push('/')}
          className="text-[10px] text-[#D4AF37]/50 hover:text-[#D4AF37] transition-all uppercase tracking-widest border border-[#D4AF37]/10 px-4 py-2 bg-white/5"
        >
          [ Ana Kapı ]
        </button>
        <button 
          onClick={() => router.push('/atlas/new')}
          className="bg-[#D4AF37] text-black px-10 py-3 text-[10px] font-bold tracking-[0.2em] uppercase active:scale-95"
        >
          Yeni Preparat Mühürle
        </button>
      </header>

      <div className="max-w-4xl mx-auto mb-12">
        <SearchGozcu value={search} onChange={setSearch} />
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-[#D4AF37]/20 uppercase text-xs tracking-widest col-span-full text-center">Gözlemevi taranıyor...</p>
        ) : filteredAssets.map((asset) => (
          <Link key={asset.id} href={`/atlas/${asset.id}`}>
            <div className="group relative bg-black/40 border border-[#D4AF37]/10 overflow-hidden active:border-[#D4AF37]/50 transition-all">
              <div className="aspect-video relative overflow-hidden">
                <img src={asset.image_url} alt={asset.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity duration-700" />
                <div className="absolute top-2 right-2 bg-[#8B0000] text-white text-[8px] px-2 py-1 font-bold">
                  {asset.pins?.length || 0} İĞNE
                </div>
              </div>
              <div className="p-4 bg-black/60 backdrop-blur-sm">
                <h2 className="text-[#D4AF37] tracking-widest uppercase text-sm font-bold mb-1">{asset.title}</h2>
                <p className="text-[9px] text-[#D4AF37]/40 uppercase tracking-tighter">{asset.subject || 'Genel Tıp'}</p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}