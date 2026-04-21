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

  // --- KRİTİK: GLOBAL PASTE (Ctrl+V) ÇÖZÜMÜ ---
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
      setPrep({ title: '', subject: 'Anatomi', image_url: '', description: '', pins: [], tags: [] });
      setIsEditing(true);
      setLoading(false);
    } else {
      fetchPreparation();
    }
  }, [id]);

  async function fetchPreparation() {
    const { data, error } = await supabase.from('atlas_assets').select('*').eq('id', id).single();
    if (!error) setPrep(data);
    setLoading(false);
  }

  const handleImageClick = (e: React.MouseEvent) => {
    if (!isEditing || !imageRef.current) return;
    const rect = imageRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    const label = prompt("İğne Etiketi:");
    if (label) {
      setPrep({ ...prep, pins: [...(prep.pins || []), { x, y, label }] });
    }
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('atlas_assets').delete().eq('id', id);
    if (!error) router.push('/atlas');
    setIsDeletePromptOpen(false);
  };

  if (loading) return <div className="min-h-screen bg-[#010102] flex items-center justify-center text-[#D4AF37] animate-pulse uppercase tracking-widest text-[10px]">Arşiv taranıyor...</div>;

  return (
    <main className="min-h-screen bg-[#010102] text-[#E0E0E0] p-4 md:p-8 pb-32 font-serif">
      <DivinePrompt 
        isOpen={isDeletePromptOpen}
        type="confirm"
        title="Bu preparat külliyattan tamamen imha edilecek. Onaylıyor musun?"
        onConfirm={handleDelete}
        onCancel={() => setIsDeletePromptOpen(false)}
      />

      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8">
        
        {/* SOL: GÖRSEL ALANI */}
        <div className="flex-1 space-y-6">
          <header className="flex justify-between items-center border-b border-[#D4AF37]/10 pb-4">
            <button onClick={() => router.push('/atlas')} className="text-[9px] text-[#D4AF37]/40 uppercase tracking-widest">← Atlas Arşivi</button>
            {id !== 'new' && (
              <button onClick={() => setIsDeletePromptOpen(true)} className="text-[9px] text-[#8B0000] uppercase tracking-widest hover:underline">[ İmha Et ]</button>
            )}
          </header>

          <div className="relative border border-[#D4AF37]/10 bg-black/40 overflow-hidden touch-none" onClick={handleImageClick}>
            {prep.image_url ? (
              <div className="relative inline-block w-full">
                <img ref={imageRef} src={prep.image_url} alt={prep.title} className="w-full h-auto select-none pointer-events-none" />
                
                {/* MOBİL UYUMLU İĞNELER */}
                {prep.pins?.map((pin: any, index: number) => (
                  <div 
                    key={index} 
                    className="absolute -translate-x-1/2 -translate-y-1/2" 
                    style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setActivePinIndex(activePinIndex === index ? null : index);
                    }}
                  >
                    <div className={`w-4 h-4 rounded-full border border-white/50 shadow-lg transition-transform ${activePinIndex === index ? 'scale-125 bg-[#D4AF37]' : 'bg-[#8B0000]'}`} />
                    
                    {/* MOBİLDE TIKLAYINCA GÖZÜKEN ETİKET */}
                    {(activePinIndex === index || !isEditing) && (
                      <div className="absolute top-6 left-1/2 -translate-x-1/2 bg-black/90 border border-[#D4AF37]/30 px-3 py-1.5 whitespace-nowrap text-[10px] text-[#D4AF37] z-50">
                        {pin.label}
                        {isEditing && (
                          <button 
                            onClick={() => setPrep({...prep, pins: prep.pins.filter((_:any, i:number) => i !== index)})}
                            className="ml-2 text-white/30 hover:text-red-500"
                          > × </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center p-12 text-center">
                <p className="text-[10px] text-[#D4AF37]/40 uppercase tracking-widest mb-6">Görsel Mührü Gerekli</p>
                <div className="flex gap-4">
                  <button onClick={() => fileInputRef.current?.click()} className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] px-6 py-3 text-[9px] uppercase tracking-widest">Cihazdan Seç</button>
                  <div className="flex items-center text-[8px] text-white/20 uppercase tracking-widest italic">veya Ctrl + V ile yapıştır</div>
                </div>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const url = await uploadImage(file);
                    setPrep({...prep, image_url: url});
                  }
                }} />
              </div>
            )}
          </div>
        </div>

        {/* SAĞ: KONTROL PANELİ */}
        <aside className="w-full lg:w-80 space-y-6">
          <section className="bg-black/20 border border-white/5 p-6">
             {isEditing ? (
               <input 
                 value={prep.title} 
                 onChange={e => setPrep({...prep, title: e.target.value})}
                 className="w-full bg-transparent border-b border-[#D4AF37]/20 pb-2 text-xl text-[#D4AF37] outline-none font-bold italic"
                 placeholder="Preparat Adı..."
               />
             ) : (
               <h2 className="text-xl font-bold text-[#D4AF37] italic">{prep.title}</h2>
             )}
          </section>

          <section>
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-3">Ders Kapsamı</p>
            <select 
              disabled={!isEditing}
              value={prep.subject}
              onChange={e => setPrep({...prep, subject: e.target.value})}
              className="w-full bg-black/40 border border-[#D4AF37]/20 p-3 text-[#D4AF37] text-[10px] uppercase tracking-widest outline-none disabled:opacity-40"
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
               value={prep.description}
               onChange={e => setPrep({...prep, description: e.target.value})}
               className="w-full h-40 bg-black/40 border border-[#D4AF37]/20 p-4 text-xs italic text-white/60 outline-none resize-none disabled:bg-transparent"
               placeholder="Preparat hakkında notlar..."
             />
          </section>

          <section>
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-3">Etiketler</p>
            <DivineTagInput tags={prep.tags || []} onChange={t => setPrep({...prep, tags: t})} />
          </section>
        </aside>
      </div>

      <footer className="fixed bottom-0 left-0 right-0 bg-[#010102]/95 backdrop-blur-md border-t border-[#D4AF37]/10 p-6 z-50">
        <div className="max-w-7xl mx-auto flex justify-end gap-4">
          {isEditing ? (
            <button onClick={async () => {
              const { data: { user } } = await supabase.auth.getUser();
              const payload = { ...prep, user_id: user?.id };
              const { data, error } = id === 'new' 
                ? await supabase.from('atlas_assets').insert([payload]).select().single()
                : await supabase.from('atlas_assets').update(payload).eq('id', id).select().single();
              
              if (!error) {
                if (id === 'new') router.push(`/atlas/${data.id}`);
                else setIsEditing(false);
              }
            }} className="bg-[#D4AF37] text-black px-12 py-3 text-[10px] font-bold uppercase tracking-widest">Mührü Bas</button>
          ) : (
            <button onClick={() => setIsEditing(true)} className="bg-white/5 border border-white/10 text-[#D4AF37] px-12 py-3 text-[10px] font-bold uppercase tracking-widest">Düzenle</button>
          )}
        </div>
      </footer>
    </main>
  );
}