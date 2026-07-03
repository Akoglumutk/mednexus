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
      loading && setLoading(false);
    }
    fetchAtlas();
  }, [loading]);

  const filteredAssets = assets.filter(asset => 
    asset.title?.toLowerCase().includes(search.toLowerCase()) ||
    asset.subject?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] p-4 md:p-12 font-serif pb-32 overflow-x-hidden">
      <header className="max-w-7xl mx-auto mb-10 flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#D4AF37]/10 pb-8">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-[0.2em] text-[#D4AF37] uppercase">Atlas</h1>
          <p className="text-[10px] text-[#D4AF37]/40 uppercase tracking-[0.3em] mt-2 italic">Imago est veritas</p>
        </div>
        <div className="flex gap-4 w-full md:w-auto justify-center">
          <button 
            onClick={() => router.push('/atlas/new')}
            className="bg-[#D4AF37] text-black px-6 md:px-10 py-3 text-[9px] md:text-[10px] font-bold tracking-[0.15em] uppercase active:scale-95 transition-transform rounded-sm shadow-md"
          >
            Yeni Preparat Gir
          </button>
        </div>
      </header>

      <div className="max-w-3xl mx-auto mb-12">
        <SearchGozcu value={search} onChange={setSearch} />
      </div>

      {/* IPAD VE MOBİL DOSTU ESNEK GRID SİSTEMİ */}
      <div className="max-w-7xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-[#D4AF37]/20 uppercase text-xs tracking-[0.3em] col-span-full text-center py-12 animate-pulse">Arşiv taranıyor...</p>
        ) : filteredAssets.length > 0 ? (
          filteredAssets.map((asset) => (
            <Link key={asset.id} href={`/atlas/${asset.id}`}>
              <div className="group relative bg-black/40 border border-[#D4AF37]/10 overflow-hidden rounded-sm transition-all duration-300 hover:border-[#D4AF37]/40 active:scale-[0.99] shadow-lg">
                <div className="aspect-video relative overflow-hidden bg-neutral-900">
                  {asset.image_url ? (
                    <img src={asset.image_url} alt={asset.title} className="w-full h-full object-cover opacity-50 group-hover:opacity-90 transition-opacity duration-500" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[8px] text-white/10 uppercase tracking-widest italic">Boş Matris</div>
                  )}
                  <div className="absolute top-3 right-3 bg-[#8B0000] text-white text-[8px] px-2 py-1 font-mono tracking-widest rounded-sm shadow-md">
                    {asset.pins?.length || 0} İĞNE
                  </div>
                </div>
                <div className="p-4 bg-black/60 backdrop-blur-sm border-t border-white/5">
                  <h2 className="text-[#D4AF37] tracking-wider uppercase text-xs md:text-sm font-bold mb-1 truncate">{asset.title || 'Adsız Preparat'}</h2>
                  <p className="text-[9px] text-[#D4AF37]/40 uppercase tracking-widest font-mono">{asset.subject || 'Genel Tıp'}</p>
                </div>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-white/20 uppercase text-[9px] tracking-widest col-span-full text-center py-12 italic">Aranan kriterde veri bulunamadı.</p>
        )}
      </div>
    </main>
  );
}
