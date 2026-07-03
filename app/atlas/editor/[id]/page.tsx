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
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [pins, setPins] = useState<any[]>([]); // Tipi 'pin' veya 'arrow' olan ortak işaret matrisi
  
  const [loading, setLoading] = useState(false);
  const [tool, setTool] = useState<'pin' | 'arrow'>('pin');
  
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
        }
      };
      fetchAsset();
    }
  }, [id]);

  const handleSave = async () => {
    if (!title.trim() || !imageUrl) {
      alert("Hata: Başlık ve görsel girilmek zorundadır.");
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    
    const payload = { 
      title, description, tags, pins, image_url: imageUrl, 
      user_id: user?.id 
    };

    const { error } = id === 'new'
      ? await supabase.from('atlas_assets').insert([payload])
      : await supabase.from('atlas_assets').update(payload).eq('id', id);

    if (!error) router.push('/atlas');
    setLoading(false);
  };

  // iPadOS ve Dokunmatik Ekranlar İçin Hassas Koordinat Hesaplama Motoru
  const handleInteraction = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!imageUrl || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    
    // Touch veya Mouse event ayrıştırması (iPad Uyumu)
    let clientX = 0;
    let clientY = 0;
    
    if ('touches' in e) {
      if (e.touches.length === 0) return;
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setLocalCoords({ x, y });
    setIsPromptOpen(true);
  };

  return (
    <main className="min-h-screen bg-[#010102] p-4 md:p-8 font-serif text-[#E0E0E0] pb-40">
      <DivinePrompt 
        isOpen={isPromptOpen}
        type="input"
        title={tool === 'pin' ? "Toplu İğne Noktasını Etiketle" : "Vektörel Ok Yapısını Etiketle"}
        onConfirm={(val) => {
          if (val && localCoords) {
            setPins([...pins, { x: localCoords.x, y: localCoords.y, label: val, markerType: tool }]);
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
            className="bg-transparent text-2xl md:text-3xl font-bold text-[#D4AF37] outline-none w-full italic font-serif"
          />
          <textarea 
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Klinik ve histolojik veri izlemleri..."
            className="bg-transparent text-xs text-white/40 outline-none w-full mt-2 resize-none h-12 leading-relaxed font-sans"
          />
        </div>
        <button onClick={handleSave} disabled={loading} className="w-full md:w-auto bg-[#8B0000]/10 border border-[#8B0000]/40 text-[#8B0000] px-8 py-3 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform font-mono">
          {loading ? 'Kaydediliyor...' : '[ ARŞİVE KAYDET ]'}
        </button>
      </header>

      <div className="max-w-5xl mx-auto space-y-4">
        {/* İşaretleme Enstrüman Paneli */}
        <div className="flex gap-2 font-mono">
          <button type="button" onClick={() => setTool('pin')} className={`px-5 py-2 text-[9px] uppercase tracking-widest border transition-all rounded-sm ${tool === 'pin' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/10 text-white/30'}`}>📌 Toplu İğne</button>
          <button type="button" onClick={() => setTool('arrow')} className={`px-5 py-2 text-[9px] uppercase tracking-widest border transition-all rounded-sm ${tool === 'arrow' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/10 text-white/30'}`}>🏹 Ok İşareti</button>
        </div>

        {!imageUrl ? (
          <div className="h-96 border border-dashed border-white/10 flex flex-col items-center justify-center bg-black/10 rounded-sm">
            <input type="file" className="text-xs text-white/40 font-mono" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setImageUrl(await uploadImage(file));
            }} />
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="relative border border-[#D4AF37]/20 shadow-2xl cursor-crosshair overflow-hidden rounded-sm touch-none select-none bg-neutral-950"
            onClick={handleInteraction}
          >
            <img src={imageUrl} className="w-full h-auto select-none pointer-events-none display-block opacity-90" alt="Atlas Külliyatı" />
            
            {pins.map((p, i) => (
              <div 
                key={i} 
                className="absolute -translate-x-1/2 -translate-y-1/2 z-40 flex flex-col items-center pointer-events-none" 
                style={{ left: `${p.x}%`, top: `${p.y}%` }}
              >
                {/* Dinamik Geometri: Ok mu İğne mi? */}
                {p.markerType === 'arrow' ? (
                  <div className="animate-bounce flex flex-col items-center">
                    <span className="text-[#D4AF37] text-base font-sans font-bold leading-none">↓</span>
                    <div className="w-1.5 h-1.5 bg-[#D4AF37] rotate-45 border border-black shadow-md -mt-1" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-2.5 h-2.5 bg-[#8B0000] rounded-full border border-white shadow-[0_0_8px_rgba(0,0,0,1)]" />
                    <div className="w-[1px] h-3 bg-white/70 shadow-sm" />
                  </div>
                )}
                <span className="text-[8px] text-white/90 font-mono bg-black/90 px-1.5 py-0.5 border border-white/10 shadow-md mt-0.5 max-w-[120px] truncate">{p.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
