'use client'
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAssetUpload } from '@/hooks/useAssetUpload';
import DivineTagInput from '@/components/DivineTagInput';
import DivinePrompt from '@/components/DivinePrompt';

export default function AtlasDetail() {
  const [selectedPins, setSelectedPins] = useState<number[]>([]);
  
  const { id } = useParams();
  const router = useRouter();
  const { uploadImage } = useAssetUpload();
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [prep, setPrep] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isDeletePromptOpen, setIsDeletePromptOpen] = useState(false);
  
  // İzleme Modu UX Şalterleri
  const [activePinIndex, setActivePinIndex] = useState<number | null>(null);
  const [showAllLabels, setShowAllLabels] = useState(true); // Küresel Etiket Aç/Kapa Şalteri!
  const [tool, setTool] = useState<'pin' | 'arrow'>('pin');

  const [isPinPromptOpen, setIsPinPromptOpen] = useState(false);
  const [tempCoords, setTempCoords] = useState<{ x: number; y: number } | null>(null);

  useEffect(() => {
    if (id === 'new') {
      setPrep({ title: '', subject: 'Anatomi', image_url: '', description: '', pins: [], tags: [] });
      setIsEditing(true);
      setLoading(false);
    } else {
      fetchPreparation();
    }
  }, [id]);

  useEffect(() => {
    setSelectedPins([]);
    setActivePinIndex(null);
  }, [showAllLabels]);

  async function fetchPreparation() {
    const { data } = await supabase.from('atlas_assets').select('*').eq('id', id).single();
    if (data) setPrep({ ...data, pins: data.pins || [], tags: data.tags || [] });
    setLoading(false);
  }

  // iPadOS Touch / Mouse Koordinat Hesaplama
  const handleImageInteraction = (e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) => {
    if (!isEditing || !imageRef.current) return;
    
    const rect = imageRef.current.getBoundingClientRect();
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

    setTempCoords({ x, y });
    setIsPinPromptOpen(true);
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('atlas_assets').delete().eq('id', id);
    if (!error) router.push('/atlas');
    setIsDeletePromptOpen(false);
  };

  if (loading || !prep) return <div className="min-h-screen bg-[#010102] flex items-center justify-center text-[#D4AF37] animate-pulse uppercase tracking-[0.3em] text-[10px] font-mono">Arşiv taranıyor...</div>;

  return (
    <main className="min-h-screen bg-[#010102] text-[#E0E0E0] p-4 md:p-8 pb-40 font-serif select-none overflow-x-hidden">
      
      <DivinePrompt 
        isOpen={isDeletePromptOpen}
        type="confirm"
        title="Bu preparat arşivden tamamen silinecek. Onaylıyor musun?"
        onConfirm={handleDelete}
        onCancel={() => setIsDeletePromptOpen(false)}
      />

      <DivinePrompt
        isOpen={isPinPromptOpen}
        type="input"
        title={tool === 'pin' ? "Toplu İğne İsmini Gir" : "Ok İşareti İsmini Gir"}
        onConfirm={(val) => {
          if (val && tempCoords) {
            setPrep({ ...prep, pins: [...(prep.pins || []), { x: tempCoords.x, y: tempCoords.y, label: val, markerType: tool }] });
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
        
        {/* SOL PANEL: PREPARAT CANVAS ALANI */}
        <div className="flex-1 space-y-6">
          <header className="flex justify-between items-center border-b border-[#D4AF37]/10 pb-4 font-mono">
            <button onClick={() => router.push('/atlas')} className="text-[9px] text-[#D4AF37]/40 uppercase tracking-widest transition-colors hover:text-[#D4AF37]">← Atlas Arşivi</button>
            
            {/* KÜRESEL ŞALTER: Etiketleri İzleme Modunda Göster/Gizle */}
            {!isEditing && prep.pins?.length > 0 && (
              <button 
                onClick={() => setShowAllLabels(!showAllLabels)}
                className={`text-[9px] uppercase tracking-widest px-3 py-1 border transition-all ${showAllLabels ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/10 text-white/30'}`}
              >
                {showAllLabels ? '[ Etiketleri Gizle ]' : '[ Tüm Etiketleri Aç ]'}
              </button>
            )}

            {id !== 'new' && (
              <button onClick={() => setIsDeletePromptOpen(true)} className="text-[9px] text-[#8B0000] uppercase tracking-widest hover:underline">[ Sil ]</button>
            )}
          </header>

          {/* Enstrüman Seçimi (Yalnızca Düzenleme Modunda Görünür) */}
          {isEditing && (
            <div className="flex gap-2 font-mono">
              <button type="button" onClick={() => setTool('pin')} className={`px-4 py-1.5 text-[9px] uppercase tracking-widest border ${tool === 'pin' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/10 text-white/30'}`}>📌 İğne Modu</button>
              <button type="button" onClick={() => setTool('arrow')} className={`px-4 py-1.5 text-[9px] uppercase tracking-widest border ${tool === 'arrow' ? 'border-[#D4AF37] text-[#D4AF37] bg-[#D4AF37]/5' : 'border-white/10 text-white/30'}`}>🏹 Ok Modu</button>
            </div>
          )}

          <div 
            ref={containerRef}
            className={`relative border border-[#D4AF37]/10 bg-neutral-950 overflow-hidden rounded-sm select-none shadow-2xl ${isEditing ? 'cursor-crosshair' : 'cursor-default'}`}
            onClick={handleImageInteraction}
          >
            {prep.image_url ? (
              <div className="relative inline-block w-full touch-none">
                <img 
                  ref={imageRef} 
                  src={prep.image_url} 
                  alt={prep.title} 
                  className="w-full h-auto select-none pointer-events-none block" 
                />
                
                {/* Vektörel İşaretleyiciler */}
                
{/* MOBİL VE IPAD UYUMLU DOKUNMATİK İĞNELER & OK VEKTÖRLERİ */}
{prep.pins?.map((pin: any, index: number) => {
  const isPinSelected = selectedPins.includes(index);
  // Bir etiket ya küresel şalter açıksa YA DA bu iğne tek başına seçildiyse görünür olmalı!
  const isLabelVisible = showAllLabels || isPinSelected;

  return (
    <div 
      key={index} 
      className="absolute -translate-x-1/2 -translate-y-1/2 z-40 cursor-pointer p-4"
      style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
      onClick={(e) => {
        e.stopPropagation();
        if (showAllLabels) {
          // Eğer şalter açıksa, tıklama iğneyi sadece seçili kılmak için dizide tutsun
          if (selectedPins.includes(index)) {
            setSelectedPins([]);
          } else {
            setSelectedPins([index]);
          }
        } else {
          // Eğer şalter kapalıysa (Self-Test modu), tıklanan iğneyi listeye ekle/çıkar (Tek tek aç/kapa!)
          if (selectedPins.includes(index)) {
            setSelectedPins(selectedPins.filter(i => i !== index));
          } else {
            setSelectedPins([...selectedPins, index]);
          }
        }
      }}
    >
      {/* Vektörel Marker Tasarımları (Ok veya İğne) */}
      {pin.markerType === 'arrow' ? (
        <div className="flex flex-col items-center">
          <span className={`text-base font-bold font-sans leading-none drop-shadow-[0_2px_5px_rgba(0,0,0,0.9)] transition-all duration-300 ${isPinSelected ? 'text-[#D4AF37] scale-125' : 'text-red-500'}`}>↓</span>
          <div className={`w-1 h-1 rotate-45 -mt-0.5 ${isPinSelected ? 'bg-[#D4AF37]' : 'bg-red-500'}`} />
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <div className={`w-3 h-3 rounded-full border border-white/30 shadow-[0_0_8px_rgba(0,0,0,0.8)] transition-all duration-300 ${
            isPinSelected ? 'scale-125 bg-[#D4AF37] ring-4 ring-[#D4AF37]/20' : 'bg-[#8B0000]'
          }`} />
          <div className="w-[1px] h-2 bg-white/40 shadow-sm" />
        </div>
      )}
      
      {/* Dinamik Şaltere ve Seçime Göre Gösterilen Etiket Baloncuğu */}
      {isLabelVisible && (
        <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/95 border border-[#D4AF37]/30 px-2 py-1 whitespace-nowrap text-[9px] text-[#D4AF37] font-mono shadow-2xl z-50 animate-in fade-in zoom-in-95 rounded-sm">
          <span>{pin.label}</span>
          {isEditing && (
            <button 
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setPrep({ ...prep, pins: prep.pins.filter((_: any, i: number) => i !== index) });
                setSelectedPins(selectedPins.filter(i => i !== index));
              }}
              className="ml-2 text-white/20 hover:text-red-500 text-[10px] transition-colors font-bold"
            >
              ×
            </button>
          )}
        </div>
      )}
    </div>
  );
})}
                
              </div>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center p-12 bg-black/20 font-mono">
                <button onClick={() => fileInputRef.current?.click()} className="bg-[#D4AF37]/10 border border-[#D4AF37]/30 text-[#D4AF37] px-6 py-3 text-[9px] uppercase tracking-widest active:scale-95 transition-transform">Görsel Enjekte Et</button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) setPrep({ ...prep, image_url: await uploadImage(file) });
                }} />
              </div>
            )}
          </div>
        </div>

        {/* SAĞ PANEL: METADATA */}
        <aside className="w-full lg:w-80 space-y-6">
          <section className="bg-black/20 border border-white/5 p-5 rounded-sm">
             {isEditing ? (
               <input 
                 value={prep?.title || ''} 
                 onChange={e => setPrep({...prep, title: e.target.value})}
                 className="w-full bg-transparent border-b border-[#D4AF37]/20 pb-2 text-lg text-[#D4AF37] outline-none font-bold italic focus:border-[#D4AF37]"
                 placeholder="Preparat Adı..."
               />
             ) : (
               <h2 className="text-xl font-bold text-[#D4AF37] italic tracking-wide uppercase">{prep?.title || 'Adsız Preparat'}</h2>
             )}
          </section>

          <section>
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-3 font-mono">Branş</p>
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
             <p className="text-[9px] text-white/30 uppercase tracking-widest mb-3 font-mono">Notlar</p>
             <textarea 
               disabled={!isEditing}
               value={prep?.description || ''}
               onChange={e => setPrep({...prep, description: e.target.value})}
               className="w-full h-44 bg-black/40 border border-[#D4AF37]/20 p-4 text-xs italic text-white/70 outline-none resize-none disabled:bg-transparent rounded-sm leading-relaxed font-sans"
               placeholder="Preparata dair histolojik/anatomik katmanları mühürleyin..."
             />
          </section>

          <section>
            <p className="text-[9px] text-white/30 uppercase tracking-widest mb-3 font-mono">Etiketler</p>
            <DivineTagInput tags={prep?.tags || []} onChange={t => setPrep({...prep, tags: t})} />
          </section>
        </aside>
      </div>

      {/* FOOTER AKSİYON BARBARI */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#010102]/95 backdrop-blur-md border-t border-[#D4AF37]/10 p-4 md:p-6 z-50 font-mono">
        <div className="max-w-7xl mx-auto flex justify-end gap-4">
          {isEditing ? (
            <>
              {id !== 'new' && (
                <button type="button" onClick={() => setIsEditing(false)} className="text-[9px] uppercase tracking-widest text-white/30 hover:text-white transition-colors mr-auto">[ Değişiklikleri Reddet ]</button>
              )}
              <button 
                onClick={async () => {
                  setLoading(true);
                  const { data: { user } } = await supabase.auth.getUser();
                  const payload = { ...prep, user_id: user?.id };
                  const { data, error } = id === 'new' 
                    ? await supabase.from('atlas_assets').insert([payload]).select().single()
                    : await supabase.from('atlas_assets').update(payload).eq('id', id).select().single();
                  
                  if (!error) {
                    if (id === 'new') router.push(`/atlas/${data.id}`);
                    else setIsEditing(false);
                  }
                  setLoading(false);
                }} 
                className="bg-[#D4AF37] text-black px-10 py-3 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform shadow-lg rounded-sm"
              >
                Mührü Kaydet
              </button>
            </>
          ) : (
            <button 
              onClick={() => setIsEditing(true)} 
              className="bg-white/5 border border-white/10 text-[#D4AF37] px-10 py-3 text-[10px] font-bold uppercase tracking-widest active:scale-95 transition-transform hover:bg-white/10 rounded-sm"
            >
              Düzenle
            </button>
          )}
        </div>
      </footer>
    </main>
  );
}
