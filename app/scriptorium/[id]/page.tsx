'use client'
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Editor from '@/components/Editor';
import Viewer from '@/components/Viewer';
import DivinePrompt from '@/components/DivinePrompt';
import "@excalidraw/excalidraw/index.css"; // CSS bütünlüğü için
import DivineTagInput from '@/components/DivineTagInput';
import { useAssetUpload } from '@/hooks/useAssetUpload';

export default function NoteDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [note, setNote] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isOracleLoading, setIsOracleLoading] = useState(false);
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  const { uploadImage, handlePaste } = useAssetUpload();

  useEffect(() => {
    if (id === 'new') {
      setNote({ title: '', content: '', tags: [] });
      setIsEditing(true);
      setLoading(false);
    } else {
      fetchNote();
    }
  }, [id]);

  async function fetchNote() {
    const { data, error } = await supabase.from('notes').select('*').eq('id', id).single();
    if (!error) setNote(data);
    setLoading(false);
  }

  // --- KRİTİK DÜZELTME: Oracle Veri İşleme ---
const handleInvokeOracle = async () => {
  // 1. Güvenlik Kontrolü: Editördeki metni temiz al
  const currentContent = note.content;
  
  if (!currentContent || currentContent.includes("[object Object]")) {
    alert("Lütfen önce editördeki hata metnini temizleyip gerçek notunuzu girin.");
    return;
  }

  setIsOracleLoading(true);
  try {
    const res = await fetch('/api/oracle', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: currentContent })
    });

    const data = await res.json();

    if (data.result) {
      // 2. Temizlik: Kahin bazen gereksiz markdown işaretleri koyar
      const cleanedHTML = data.result.replace(/```html|```/g, '').trim();
      
      // 3. Mühürleme: Sadece metni aktar
      setNote({ ...note, content: cleanedHTML });
      setIsEditing(true);
    }
  } catch (error) {
    console.error("Mühürleme Hatası:", error);
  } finally {
    setIsOracleLoading(false);
  }
};

  const handleSave = async () => {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
  
    const payload = {
      title: note.title || "Adsız Not",
      content: note.content,
      tags: Array.isArray(note.tags) ? note.tags : [],
      user_id: user?.id
    };
  
    const { data, error } = id === 'new'
      ? await supabase.from('notes').insert([payload]).select().single()
      : await supabase.from('notes').update(payload).eq('id', id).select().single();
  
    if (!error) {
      if (id === 'new') router.push(`/scriptorium/${data.id}`);
      else setIsEditing(false);
    } else {
      alert("Mühürleme başarısız: " + error.message);
    }
    setLoading(false);
  };

  const executeDelete = async () => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (!error) router.push('/scriptorium');
    else alert("İmha işlemi başarısız.");
    setIsPromptOpen(false);
  };

  const onPasteHandler = async (e: React.ClipboardEvent) => {
    const url = await handlePaste(e);
    if (url) {
      console.log('Görsel yüklendi:', url);
    }
  };

  if (loading) return <div className="min-h-screen bg-[#010102] flex items-center justify-center text-[#D4AF37] tracking-[0.3em] uppercase animate-pulse italic text-[10px]">Arşiv taranıyor...</div>;
  if (!note) return <div className="min-h-screen bg-[#010102] flex items-center justify-center text-[#8B0000] uppercase text-[10px] tracking-widest">Bilgi bulunamadı.</div>;

  return (
    <main className="min-h-screen bg-[#010102] text-[#E0E0E0] p-4 md:p-12 pb-32 font-serif relative">
      <DivinePrompt 
        isOpen={isPromptOpen}
        type="confirm"
        title="Bu bilgi külliyattan tamamen silinecek. Onaylıyor musun?"
        onConfirm={executeDelete}
        onCancel={() => setIsPromptOpen(false)}
      />

      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b border-[#D4AF37]/20 pb-6 relative">
          <button onClick={() => router.push('/scriptorium')} className="text-[#D4AF37]/40 text-[9px] uppercase tracking-[0.3em] mb-4 hover:text-[#D4AF37] transition-colors">← ARŞİVE DÖN</button>
          
          {isEditing ? (
            <>
              <input 
                value={note.title} 
                onChange={(e) => setNote({...note, title: e.target.value})}
                placeholder="Not Başlığı..."
                className="w-full bg-transparent text-4xl text-[#D4AF37] border-none focus:outline-none font-bold italic placeholder:opacity-20"
              />
              <DivineTagInput tags={note.tags || []} onChange={ (newTags) => setNote({ ...note, tags: newTags }) } placeholder="#Etiketler" />
            </>
          ) : (
            <>
              <h1 className="text-4xl font-bold text-[#D4AF37] leading-tight italic tracking-tight">{note.title || "Adsız Not"}</h1>
              <DivineTagInput tags={note.tags || []} onChange={ (newTags) => setNote({ ...note, tags: newTags }) } placeholder="#Etiketler" />
            </>
          )}
        </header>

        <article className="min-h-[50vh] animate-in fade-in duration-1000">
          {isEditing ? (
            <Editor 
              content={note.content} 
              onChange={(val: any) => setNote({...note, content: val})} 
            />
          ) : (
            <Viewer content={note.content} />
          )}
        </article>
      </div>

      {/* --- GÜVENLİ FOOTER (Divine Bar) --- */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#010102]/90 border-t border-[#D4AF37]/10 p-4 backdrop-blur-md z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">

          {isEditing ? (
            <div className="flex w-full justify-between items-center px-2">
              {id !== 'new' && (
                <button onClick={() => setIsEditing(false)} className="text-[10px] uppercase tracking-widest text-white/30 hover:text-white">Vazgeç</button>
              )}
              <button 
                onClick={handleSave} 
                className="bg-[#D4AF37] text-black px-12 py-3 text-[10px] font-bold tracking-[0.2em] uppercase shadow-[0_0_20px_rgba(212,175,55,0.2)] hover:scale-105 transition-all"
              >
                {id === 'new' ? 'MÜHRÜ BAS' : 'MÜHRÜ GÜNCELLE'}
              </button>
            </div>
          ) : (
            <div className="flex w-full justify-around items-center">
                
              <button 
                onClick={() => setIsPromptOpen(true)} 
                className="text-[10px] uppercase tracking-widest text-[#8B0000]/40 hover:text-[#8B0000] transition-colors"
              >
                İmha Et
              </button>
                
              <button 
                onClick={() => setIsEditing(true)} 
                className="bg-[#D4AF37] text-black px-10 py-3 text-[10px] font-bold tracking-widest uppercase hover:bg-[#D4AF37]/80"
              >
                Düzenle
              </button>
            </div>
          )}

        </div>
      </footer>
    </main>
  );
}