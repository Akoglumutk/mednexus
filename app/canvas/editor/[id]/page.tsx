'use client'
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabase';
import DivinePrompt from '@/components/DivinePrompt';
import "@excalidraw/excalidraw/index.css";

const Excalidraw = dynamic(
  async () => (await import("@excalidraw/excalidraw")).Excalidraw,
  { ssr: false, loading: () => <div className="h-screen bg-[#010102]" /> }
);

export default function CanvasEditor() {
  const { id } = useParams();
  const router = useRouter();
  const [api, setApi] = useState<any>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [canvasName, setCanvasName] = useState('');
  
  const [promptConfig, setPromptConfig] = useState({
    isOpen: false, type: 'input' as 'input' | 'confirm', title: '', context: '' as 'save' | 'delete'
  });

  useEffect(() => {
    if (id && id !== 'new') {
      const fetchCanvas = async () => {
        const { data } = await supabase.from('canvas_storage').select('*').eq('id', id).single();
        if (data && data.data) {
          setCanvasName(data.name); // Mevcut ismi state'e al
          // KRİTİK: appState'i temizle ve veriyi hazırla
          const { collaborators, ...cleanAppState } = data.data.appState || {};
          setInitialData({
            elements: data.data.elements || [],
            appState: { ...cleanAppState, collaborators: new Map() },
            files: data.data.files || {}, // GÖRSELLER İÇİN BU SATIR ŞART
            scrollToContent: true
          });
        }
        setLoading(false);
      };
      fetchCanvas();
    } else { setLoading(false); }
  }, [id]);

  const handleSave = async (name?: string) => {
    if (!api) return;
    setLoading(true);

    const elements = api.getSceneElements();
    const appState = api.getAppState();
    const files = api.getFiles(); // KRİTİK: Görsel verilerini çekiyoruz

    const { data: { user } } = await supabase.auth.getUser();

    const payload = {
      // Eğer id 'new' ise name parametresini kullan, değilse eski ismi koru (veya state'ten al)
      name: name || canvasName || "Adsız Parşömen",
      data: { elements, appState, files }, // Artık görseller de paketin içinde
      user_id: user?.id
    };

    const { error } = id === 'new'
      ? await supabase.from('canvas_storage').insert([payload])
      : await supabase.from('canvas_storage').update(payload).eq('id', id);

    if (error) {
      alert("Hata: " + error.message);
    } else {
      router.push('/canvas');
    }
    setLoading(false);
  };

  const handleDelete = async () => {
    const { error } = await supabase.from('canvas_storage').delete().eq('id', id);
    if (!error) router.push('/canvas');
    setPromptConfig({ ...promptConfig, isOpen: false });
  };

  if (loading) return <div className="h-screen bg-[#010102] flex items-center justify-center text-[#D4AF37] italic uppercase text-[10px] tracking-widest">Mühürler Kontrol Ediliyor...</div>;

  return (
    <main className="fixed inset-0 bg-[#010102] z-50 overflow-hidden">
      <DivinePrompt 
        isOpen={promptConfig.isOpen}
        type={promptConfig.type}
        title={promptConfig.title}
        onConfirm={(val) => {
          if (promptConfig.context === 'save') handleSave(val);
          if (promptConfig.context === 'delete') handleDelete();
        }}
        onCancel={() => setPromptConfig({ ...promptConfig, isOpen: false })}
      />

      {/* Kontrol Paneli */}
      <div className="absolute top-4 left-4 z-[60] flex gap-3">
        <button onClick={() => router.push('/canvas')} className="bg-black/50 border border-white/10 text-white/50 px-4 py-2 text-[9px] uppercase tracking-widest">← GERİ</button>
        {id !== 'new' && (
          <button 
            onClick={() => setPromptConfig({ isOpen: true, type: 'confirm', title: 'Bu parşömen yakılsın mı?', context: 'delete' })}
            className="bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] px-4 py-2 text-[9px] uppercase tracking-widest"
          >
            İmha Et
          </button>
        )}
      </div>

      <div className="h-full w-full">
        <Excalidraw 
          excalidrawAPI={(excaliApi) => setApi(excaliApi)}
          theme="dark"
          initialData={initialData}
          UIOptions={{ canvasActions: { loadScene: false, export: false, saveAsImage: false } }}
          renderTopRightUI={() => (
            <button 
              onClick={() => id === 'new' ? setPromptConfig({ isOpen: true, type: 'input', title: 'Parşömen İsmi', context: 'save' }) : handleSave()}
              className="bg-[#D4AF37] text-black px-6 py-2 text-[10px] font-bold uppercase tracking-widest shadow-xl mr-4 mt-2 active:scale-95"
            >
              {id === 'new' ? 'MÜHÜRLE' : 'GÜNCELLE'}
            </button>
          )}
        />
      </div>
    </main>
  );
}