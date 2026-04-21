'use client'
import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { uploadImage } from '@/lib/upload';
import DivinePrompt from '@/components/DivinePrompt';

export default function AtlasUnifiedEditor() {
  const { id } = useParams();
  const router = useRouter();
  
  // Data States
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [imageUrl, setImageUrl] = useState('');
  const [pins, setPins] = useState<any[]>([]);
  const [arrows, setArrows] = useState<any[]>([]);
  
  // UI States
  const [loading, setLoading] = useState(false);
  const [tool, setTool] = useState<'pin' | 'arrow'>('pin');
  const [promptConfig, setPromptConfig] = useState<{isOpen: boolean, type: 'confirm' | 'input', title: string, context?: 'pin' | 'delete'}>({
    isOpen: false, type: 'confirm', title: ''
  });
  
  const containerRef = useRef<HTMLDivElement>(null);

  // Mevcut Veriyi Yükle (Düzenleme Modu)
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
    else alert("Mühürleme hatası: " + error.message);
    setLoading(false);
  };

  const handleInteraction = (e: React.MouseEvent) => {
    if (!imageUrl) return;
    const rect = containerRef.current!.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    if (tool === 'pin') {
      // Yerel Prompt yerine DivinePrompt tetikle
      setPromptConfig({ 
        isOpen: true, 
        type: 'input', 
        title: 'Yapı İsmini Mühürle', 
        context: 'pin' 
      });
      // Geçici koordinatları saklamak için bir ref veya ek state gerekebilir
      (window as any)._tempCoords = { x, y };
    }
  };

  return (
    <main className="min-h-screen bg-[#010102] p-6 font-serif text-[#E0E0E0]">
      <DivinePrompt 
        isOpen={promptConfig.isOpen}
        type={promptConfig.type}
        title={promptConfig.title}
        onConfirm={(val) => {
          if (promptConfig.context === 'pin' && val) {
            setPins([...pins, { ... (window as any)._tempCoords, label: val }]);
          }
          if (promptConfig.context === 'delete') handleSave(); // Örnek silme onayı
          setPromptConfig({ ...promptConfig, isOpen: false });
        }}
        onCancel={() => setPromptConfig({ ...promptConfig, isOpen: false })}
      />

      <header className="max-w-6xl mx-auto flex justify-between items-center border-b border-[#D4AF37]/10 pb-6 mb-8">
        <div className="flex-1">
          <input 
            value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder="Preparat Adı..."
            className="bg-transparent text-3xl font-bold text-[#D4AF37] outline-none w-full italic"
          />
          <textarea 
            value={description} onChange={(e) => setDescription(e.target.value)}
            placeholder="Klinik notlar..."
            className="bg-transparent text-xs text-white/40 outline-none w-full mt-2 resize-none h-12"
          />
        </div>
        <button onClick={handleSave} className="bg-[#8B0000]/20 border border-[#8B0000]/40 text-[#8B0000] px-8 py-2 text-[10px] font-bold uppercase tracking-widest">
          {loading ? 'Mühürleniyor...' : 'KAYDET'}
        </button>
      </header>

      <div className="max-w-5xl mx-auto">
        <div className="mb-4 flex gap-2">
          <button onClick={() => setTool('pin')} className={`px-4 py-2 text-[10px] border ${tool === 'pin' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-white/10 text-white/20'}`}>İĞNE</button>
          <button onClick={() => setTool('arrow')} className={`px-4 py-2 text-[10px] border ${tool === 'arrow' ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-white/10 text-white/20'}`}>OK</button>
        </div>

        {!imageUrl ? (
          <div className="h-96 border-2 border-dashed border-white/5 flex items-center justify-center">
            <input type="file" onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setImageUrl(await uploadImage(file));
            }} />
          </div>
        ) : (
          <div 
            ref={containerRef}
            className="relative border border-[#D4AF37]/20 shadow-2xl cursor-crosshair overflow-hidden"
            onClick={handleInteraction}
          >
            <img src={imageUrl} className="w-full h-auto select-none" alt="Atlas" />
            {pins.map((p, i) => (
              <div key={i} className="absolute w-3 h-3 bg-[#8B0000] border border-white rounded-full -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.x}%`, top: `${p.y}%` }}>
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[9px] text-white/60 whitespace-nowrap">{p.label}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}