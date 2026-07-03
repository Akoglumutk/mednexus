'use client'
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Editor from '@/components/Editor';
import Viewer from '@/components/Viewer';
import DivinePrompt from '@/components/DivinePrompt';
import DivineTagInput from '@/components/DivineTagInput';
import { useAssetUpload } from '@/hooks/useAssetUpload';

export default function NoteDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [note, setNote] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  const { handlePaste } = useAssetUpload();

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

  const handleSave = async () => {
    setLoading(true);
    try {
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
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const executeDelete = async () => {
    const { error } = await supabase.from('notes').delete().eq('id', id);
    if (!error) router.push('/scriptorium');
    setIsPromptOpen(false);
  };

  const onPasteHandler = async (e: React.ClipboardEvent) => {
    if (!isEditing) return;
    const url = await handlePaste(e);
    if (url) {
      const imgMarkdown = `\n![Mühürlü Görsel](${url})\n`;
      setNote((prev: any) => ({ ...prev, content: prev.content + imgMarkdown }));
    }
  };

  if (loading) return <div className="min-h-screen bg-[#010102] flex items-center justify-center text-[#D4AF37] tracking-[0.3em] uppercase animate-pulse italic text-[10px] font-mono">Arşiv taranıyor...</div>;
  if (!note) return <div className="min-h-screen bg-[#010102] flex items-center justify-center text-[#8B0000] uppercase text-[10px] tracking-widest font-mono">Giriş bulunamadı.</div>;

  return (
    <main 
      onPaste={onPasteHandler}
      className="min-h-screen bg-[#010102] text-[#E0E0E0] p-4 md:p-12 pb-44 font-serif relative overflow-x-hidden select-none"
    >
      <DivinePrompt 
        isOpen={isPromptOpen}
        type="confirm"
        title="Bu giriş tamamen silinecek. Onaylıyor musun?"
        onConfirm={executeDelete}
        onCancel={() => setIsPromptOpen(false)}
      />

      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b border-[#D4AF37]/20 pb-6 relative">
          <button 
            onClick={() => router.push('/scriptorium')} 
            className="text-[#D4AF37]/40 text-[9px] uppercase tracking-[0.3em] mb-4 hover:text-[#D4AF37] transition-colors font-mono"
          >
            ← ARŞİVE DÖN
          </button>
          
          {isEditing ? (
            <div className="space-y-4">
              <input 
                value={note.title} 
                onChange={(e) => setNote({...note, title: e.target.value})}
                placeholder="Not Başlığı..."
                className="w-full bg-transparent text-3xl md:text-4xl text-[#D4AF37] border-none focus:outline-none font-bold italic placeholder:opacity-20 focus:ring-0 p-0"
              />
              <DivineTagInput tags={note.tags || []} onChange={(newTags) => setNote({ ...note, tags: newTags })} placeholder="#Etiketler" />
            </div>
          ) : (
            <div className="space-y-4">
              <h1 className="text-3xl md:text-4xl font-bold text-[#D4AF37] leading-tight italic tracking-tight">{note.title || "Adsız Not"}</h1>
              <div className="pointer-events-none opacity-80">
                <DivineTagInput tags={note.tags || []} onChange={() => {}} placeholder="" />
              </div>
            </div>
          )}
        </header>

        {/* 
          OPTIMIZED MEDICAL PROSE: 
          - Gelişmiş satır dikey ritmi (`leading-loose`), kelime/harf izlemi (`tracking-wide`) eklendi.
          - Görselleri ve tabloları ortalayan, callout bloklarını gotikleştiren özel CSS sınıfları giydirildi.
        */}
        <article className="min-h-[50vh] animate-in fade-in duration-500 max-w-none prose prose-invert font-serif text-[15px] md:text-[16px] leading-loose tracking-wide text-white/80 transition-all
          prose-headings:text-[#D4AF37] prose-headings:font-sans prose-headings:tracking-widest prose-headings:uppercase prose-headings:italic
          prose-p:mb-6 prose-p:text-justify
          prose-img:mx-auto prose-img:my-8 prose-img:border prose-img:border-white/5 prose-img:bg-black/20 prose-img:p-2 prose-img:max-h-[500px] prose-img:object-contain
          prose-table:border prose-table:border-white/5 prose-table:bg-black/10
          prose-th:p-3 prose-th:text-[#D4AF37] prose-th:text-[11px] prose-th:uppercase prose-th:tracking-wider prose-th:bg-white/[0.02] prose-th:border-b prose-th:border-white/10
          prose-td:p-3 prose-td:text-xs prose-td:border-b prose-td:border-white/5 font-sans"
        >
          {isEditing ? (
            <Editor 
              content={note.content} 
              onChange={(val: any) => setNote({...note, content: val})} 
            />
          ) : (
            <div className="mednexus-content-grid">
              <Viewer content={note.content} />
            </div>
          )}
        </article>
      </div>

      {/* FIXED FOOTER COMMA MAND CENTER */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#010102]/95 border-t border-t-white/5 p-4 backdrop-blur-md z-40 font-mono">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
          {isEditing ? (
            <div className="flex w-full justify-between items-center px-2">
              <button 
                type="button" 
                onClick={() => id === 'new' ? router.push('/scriptorium') : setIsEditing(false)} 
                className="text-[9px] uppercase tracking-widest text-white/30 hover:text-white transition-colors"
              >
                Vazgeç
              </button>
              <button 
                onClick={handleSave} 
                className="bg-[#D4AF37] text-black px-12 py-3 text-[9px] font-bold tracking-[0.2em] uppercase rounded-sm shadow-md active:scale-95 transition-all"
              >
                {id === 'new' ? 'KAYDET' : 'GÜNCELLE'}
              </button>
            </div>
          ) : (
            <div className="flex w-full justify-between items-center px-2">
              <button 
                onClick={() => setIsPromptOpen(true)} 
                className="text-[9px] uppercase tracking-widest text-[#8B0000]/50 hover:text-[#8B0000] transition-colors"
              >
                Sil
              </button>
                
              <button 
                onClick={() => setIsEditing(true)} 
                className="bg-[#D4AF37] text-black px-10 py-3 text-[9px] font-bold tracking-widest uppercase hover:bg-[#D4AF37]/90 rounded-sm active:scale-95 transition-transform"
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
