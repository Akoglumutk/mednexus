'use client'
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAssetUpload } from '@/hooks/useAssetUpload';
import DivinePrompt from '@/components/DivinePrompt';

export default function AtlasUnifiedEditor() {
  const { id } = useParams();
  const router = useRouter();
  const { uploadImage } = useAssetUpload();
  
  // Veri Setleri
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [pins, setPins] = useState<any[]>([]);
  const [arrows, setArrows] = useState<any[]>([]);
  
  // UI Kontrolleri
  const [loading, setLoading] = useState(false);
  const [tool, setTool] = useState<'pin' | 'arrow'>('pin');
  
  // window sızıntısı yerine korumalı lokal koordinat takibi
  const [localCoords, setLocalCoords] = useState<{ x: number; y: number } | null>(null);
  const [isPromptOpen, setIsPromptOpen] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (id && id !== 'new') {
      const fetchAsset = async () => {
        const { data } = await supabase.from('atlas_assets').select('*').eq('id', id).single();
        if (data) {
          setTitle(data.title);
          setDescription(data.description || '');
          setTags(data.tags || []);
          setImageUrl(data.image_url);
          setPins(data.pins || []);
          setArrows(data.arrows || []);
        }
      };
      fetchAsset();
    }
  }, [id]);

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const payload = { 
      title, description, tags, pins, arrows, image_url: imageUrl, 
      user_id: user?.id 
    };

    const { error } = id === 'new'
      ? await supabase.from('atlas_assets').insert([payload])
      : await supabase.from('atlas_assets').update(payload).eq('id', id);

    if (!error) router.push('/atlas');
    setLoading(false);
  };

  const handleInteraction = (e: React.MouseEvent) => {
    if (!imageUrl || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (tool === 'pin') {
      setLocalCoords({ x, y });
      setIsPromptOpen(true);
    }
  };

  return (
    <main className="min-h-screen bg-[#010102] p-4 md:p-8 font-serif text-[#E0E0E0] pb-32">
      <DivinePrompt 
        isOpen={isPromptOpen}
        type="input"
        title="Anatomik Yapıyı Kriptola"
        onConfirm={(val) => {
          if (val && localCoords) {
            setPins([...pins, { x: localCoords.x, y: localCoords.y, label: val }]);
          }
          setIsPromptOpen(false);
          setLocalCoords(null);
        }}
        onCancel={() => {
          setIsPromptOpen(false);
          setLocalCoords(null);
        }}
      />

      <header className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-[#D4AF37]/10 pb-6 mb-8">
        <div className="flex-1 w-full">
          <input 
            value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Preparat Adı..."
            className="bg-transparent text-2xl md:text-3xl font-bold text-[#D4AF37] outline-none w-full italic"
          />
          <textarea 
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Klinik ve histolojik veri izlemleri..."
            className="bg-transparent text-xs text-white/40 outline-none w-full mt-2 resize-none h-12 leading-relaxed"
          />
        </div>
        <button onClick={handleSave} className="w-full md:w-auto bg-[#8B0000]/10 border border-[#8B0000]/40 text-[#8B0000] px-8 py-3 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform">
          {loading ? 'Mühürleniyor...' : '[ ARŞİVE KAYDET ]'}
        </button>
      </header>

      <div className="max-w-5xl mx-auto space-y-4">
        <div className="flex gap-2">
          <button onClick={() => setTool('pin')} className={`px-5 py-2 text-[9px] uppercase tracking-widest border transition-all ${tool === 'pin' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/10 text-white/30'}`}>İĞNE</button>
          <button onClick={() => setTool('arrow')} className={`px-5 py-2 text-[9px] uppercase tracking-widest border transition-all ${tool === 'arrow' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/10 text-white/30'}`}>OK</button>
        </div>

        {!imageUrl ? (
          <div className="h-96 border border-dashed border-white/10 flex flex-col items-center justify-center bg-black/10 rounded-sm">
            <input type="file" className="text-xs text-white/40" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setImageUrl(await uploadImage(file));
            }} />
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="relative border border-[#D4AF37]/20 shadow-2xl cursor-crosshair overflow-hidden rounded-sm touch-none select-none"
            onClick={handleInteraction}
          >
            <img src={imageUrl} className="w-full h-auto select-none pointer-events-none display-block" alt="Atlas Külliyatı" />
            {pins.map((p, i) => (
              <div key={i} className="absolute w-3 h-3 bg-[#8B0000] border border-white rounded-full -translate-x-1/2 -translate-y-1/2 shadow-xl" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[9px] text-white/70 font-mono whitespace-nowrap bg-black/70 px-1 border border-white/5">{p.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
