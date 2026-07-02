'use client'
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAssetUpload } from '@/hooks/useAssetUpload';
import DivineTagInput from '@/components/DivineTagInput';
import DivinePrompt from '@/components/DivinePrompt';

export default function AtlasDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { uploadImage } = useAssetUpload();
  const imageRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prep, setPrep] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeletePromptOpen, setIsDeletePromptOpen] = useState(false);
  const [activePinIndex, setActivePinIndex] = useState<number | null>(null);
  
  // İğne ismi için yerel prompt yerine DivinePrompt kontrolü
  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false);
  const [tempCoords, setTempCoords] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const handleGlobalPaste = async (e: ClipboardEvent) => {
      if (!isEditing) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            const url = await uploadImage(file);
            setPrep((prev: any) => ({ ...prev, image_url: url }));
          }
        }
      }
    };

    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, [isEditing, uploadImage]);

  useEffect(() => {
    if (id === 'new') {
      setPrep({ title: '', subject: 'Anatomi', image_url: '', description: '', pins: [], tags: [], arrows: [] });
      setIsEditing(true);
      setLoading(false);
    } else {
      fetchPreparation();
    }
  }, [id]);

  async function fetchPreparation() {
    const { data, error } = await supabase.from('atlas_assets').select('*').eq('id', id).single();
    if (!error && data) setPrep(data);
    setLoading(false);
  }

  const handleImageInteraction = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isEditing || !imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
    // iPadOS dokunmatik ve click event koordinat hassasiyeti optimizasyonu
    const clientX = e.clientX;
    const clientY = e.clientY;
    
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    setTempCoords({ x, y });
    setIsPinPromptOpen(true);
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('atlas_assets').delete().eq('id', id);
    if (!error) router.push('/atlas');
    setIsDeletePromptOpen(false);
  };

  if (loading) return <div className="min-h-screen bg-[#010102] flex items-center justify-center text-[#D4AF37] animate-pulse uppercase tracking-[0.3em] text-[10px]">Arşiv taranıyor...</div>;

  return (
    <main className="min-h-screen bg-[#010102] text-[#E0E0E0] p-4 md:p-8 pb-32 font-serif select-none overflow-x-hidden">
      
      {/* İMHA ONAY PROMPTU */}
      <DivinePrompt 
        isOpen={isDeletePromptOpen}
        type="confirm"
        title="Bu preparat külliyattan tamamen imha edilecek. Onaylıyor musun?"
        onConfirm={handleDelete}
        onCancel={() => setIsDeletePromptOpen(false)}
      />

      {/* İĞNE ETİKETLEME PROMPTU (iPad Klavye Dostu) */}
      <DivinePrompt
        isOpen={isPinPromptOpen}
        type="input"
        title="Yapı İsmini Mühürle (İğne Etiketi)"
        onConfirm={(val) => {
          if (val && tempCoords) {
            setPrep({ ...prep, pins: [...(prep.pins || []), { x: tempCoords.x, y: tempCoords.y, label: val }] });
          }
          setIsPinPromptOpen(false);
          setTempCoords(null);
        }}
        onCancel={() => {
          setIsPinPromptOpen(false);
          setTempCoords(null);
        }}
      />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* SOL: GÖRSEL ALANI (iPad Pinch-Zoom Dostu Kapsayıcı) */}
        <div className="flex-1 space-y-6">
          <header className="flex justify-between items-center border-b border-[#D4AF37]/10 pb-4">
            <button onClick={() => router.push('/atlas')} className="text-[9px] text-[#D4AF37]/40 uppercase tracking-widest transition-colors hover:text-[#D4AF37]">← Atlas Arşivi</button>
            {id !== 'new' && (
              <button onClick={() => setIsDeletePromptOpen(true)} className="text-[9px] text-[#8B0000] uppercase tracking-widest hover:underline">[ İmha Et ]</button>
            )}
          </header>

          <div 
            className="relative border border-[#D4AF37]/10 bg-black/40 overflow-hidden rounded-sm select-none shadow-2xl"
            onClick={handleImageInteraction}
          >
            {prep.image_url ? (
              <div className="relative inline-block w-full overflow-auto max-w-full touch-pan-x touch-pan-y">
                <img 
                  ref={imageRef} 
                  src={prep.image_url} 
                  alt={prep.title} 
                  className="w-full h-auto select-none pointer-events-none display-block" 
                />
                
                {/* MOBİL VE IPAD UYUMLU DOKUNMATİK İĞNELER */}
                {prep.pins?.map((pin: any, index: number) => (
                  <div 
                    key={index} 
                    className="absolute -translate-x-1/2 -translate-y-1/2 z-40 cursor-pointer p-3" // Parmak basma alanı p-3 ile genişletildi
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePinIndex(activePinIndex === index ? null : index);
                    }}
                  >
                    {/* İğne Çekirdeği (Glow Efektli Aeon Red & Gold) */}
                    <div className={`w-4 h-4 rounded-full border border-white/40 shadow-[0_0_10px_rgba(0,0,0,0.8)] transition-all duration-300 ${
                      activePinIndex === index ? 'scale-125 bg-[#D4AF37] ring-4 ring-[#D4AF37]/20' : 'bg-[#8B0000] ring-2 ring-[#8B0000]/30'
                    }`} />
                    
                    {/* IPAD ETİKET BALONCUĞU */}
                    {(activePinIndex === index || !isEditing) && (
                      <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/95 border border-[#D4AF37]/30 px-3 py-2 whitespace-nowrap text-[10px] text-[#D4AF37] font-mono shadow-2xl z-50 animate-in fade-in zoom-in-95">
                        <span className="tracking-wide">{pin.label}</span>
                        {isEditing && (
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setPrep({...prep, pins: prep.pins.filter((_: any, i: number) => i !== index)});
                              setActivePinIndex(null);
                            }}
                            className="ml-3 text-white/30 hover:text-red-500 text-xs transition-colors align-middle"
                          >
                            ×
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center p-12 text-center bg-black/20">
                <p className="text-[10px] text-[#D4AF37]/40 uppercase tracking-[0.3em] mb-6">Görsel Mührü Gerekli</p>
                <div className="flex flex-col sm:flex-row gap-4 items-center">
                  <button 
                    onClick={() => fileInputRef.current?.click()} 
                    className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] px-6 py-3 text-[9px] uppercase tracking-widest active:scale-95 transition-transform"
                  >
                    Cihazdan Seç
                  </button>
                  <div className="text-[8px] text-white/20 uppercase tracking-widest italic hidden sm:block">veya Ctrl + V ile yapıştır</div>
                </div>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*" 
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const url = await uploadImage(file);
                      setPrep((prev: any) => ({ ...prev, image_url: url }));
                    }
                  }} 
                />
              </div>
            )}
          </div>
        </div>

        {/* SAĞ: KONTROL PANELİ */}
        <aside className="w-full lg:w-80 space-y-6">
          <section className="bg-black/20 border border-white/5 p-5 rounded-sm">
             {isEditing ? (
               <input 
                 value={prep?.title || ''} 
                 onChange={e => setPrep({...prep, title: e.target.value})}
                 className="w-full bg-transparent border-b border-[#D4AF37]/20 pb-2 text-lg text-[#D4AF37] outline-none font-bold italic font-serif focus:border-[#D4AF37]"
                 placeholder="Preparat Adı..."
               />
             ) : (
               <h2 className="text-xl font-bold text-[#D4AF37] italic tracking-wide">{prep?.title}</h2>
             )}
          </section>

          <section>
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-3">Ders Kapsamı</p>
            <select 
              disabled={!isEditing}
              value={prep?.subject || 'Anatomi'}
              onChange={e => setPrep({...prep, subject: e.target.value})}
              className="w-full bg-black/40 border border-[#D4AF37]/20 p-3 text-[#D4AF37] text-[10px] uppercase tracking-widest outline-none disabled:opacity-40 rounded-sm font-mono"
            >
              <option value="Anatomi">Anatomi</option>
              <option value="Histoloji">Histoloji</option>
              <option value="Mikrobiyoloji">Mikrobiyoloji</option>
              <option value="Patoloji">Patoloji</option>
            </select>
          </section>

          <section>
             <p className="text-[9px] text-white/30 uppercase tracking-widest mb-3">Açıklama & Klinik Not</p>
             <textarea 
               disabled={!isEditing}
               value={prep?.description || ''}
               onChange={e => setPrep({...prep, description: e.target.value})}
               className="w-full h-44 bg-black/40 border border-[#D4AF37]/20 p-4 text-xs italic text-white/70 outline-none resize-none disabled:bg-transparent rounded-sm leading-relaxed"
               placeholder="Preparat altındaki patofizyolojik mekanizmalar veya klinik korelasyonlar..."
             />
          </section>

          <section>
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-3">Etiketler</p>
            <DivineTagInput tags={prep?.tags || []} onChange={t => setPrep({...prep, tags: t})} />
          </section>
        </aside>
      </div>

      {/* FOOTER AKSİYON BARBARI */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#010102]/95 backdrop-blur-md border-t border-[#D4AF37]/10 p-4 md:p-6 z-50">
        <div className="max-w-7xl mx-auto flex justify-end gap-4">
          {isEditing ? (
            <button 
              onClick={async () => {
                const { data: { user } } = await supabase.auth.getUser();
                const payload = { ...prep, user_id: user?.id };
                const { data, error } = id === 'new' 
                  ? await supabase.from('atlas_assets').insert([payload]).select().single()
                  : await supabase.from('atlas_assets').update(payload).eq('id', id).select().single();
                
                if (!error) {
                  if (id === 'new') router.push(`/atlas/${data.id}`);
                  else setIsEditing(false);
                }
              }} 
              className="bg-[#D4AF37] text-black px-10 py-3 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform shadow-lg"
            >
              Mührü Bas
            </button>
          ) : (
            <button 
              onClick={() => setIsEditing(true)} 
              className="bg-white/5 border border-white/10 text-[#D4AF37] px-10 py-3 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform hover:bg-white/10"
            >
              Düzenle
            </button>
          )}
        </div>
      </footer>
    </main>
  );
}
