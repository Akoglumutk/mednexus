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

  // --- AI-FREE MANUEL RECALL (WORD STİLİ YORUM) STATE'LERİ ---
  const [isRecallMode, setIsRecallMode] = useState(false);
  const [showTextbookReference, setShowTextbookReference] = useState(false);

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

  if (loading) return <div className="min-h-screen bg-[#010102] flex items-center justify-center text-[#D4AF37] tracking-[0.3em] uppercase animate-pulse italic text-[10px]">Arşiv taranıyor...</div>;
  if (!note) return <div className="min-h-screen bg-[#010102] flex items-center justify-center text-[#8B0000] uppercase text-[10px] tracking-widest">Bilgi bulunamadı.</div>;

  return (
    <main 
      onPaste={onPasteHandler}
      className="min-h-screen bg-[#010102] text-[#E0E0E0] p-4 md:p-12 pb-32 font-serif relative overflow-x-hidden select-none"
    >
      <DivinePrompt 
        isOpen={isPromptOpen}
        type="confirm"
        title="Bu bilgi külliyattan tamamen silinecek. Onaylıyor musun?"
        onConfirm={executeDelete}
        onCancel={() => setIsPromptOpen(false)}
      />

      <div className="max-w-4xl mx-auto">
        <header className="mb-12 border-b border-[#D4AF37]/20 pb-6 relative">
          <button 
            onClick={() => { if(isRecallMode) { setIsRecallMode(false); setShowTextbookReference(false); } else { router.push('/scriptorium'); } }} 
            className="text-[#D4AF37]/40 text-[9px] uppercase tracking-[0.3em] mb-4 hover:text-[#D4AF37] transition-colors"
          >
            {isRecallMode ? '← AKTİF HAFIZADAN ÇIK' : '← ARŞİVE DÖN'}
          </button>
          
          {isEditing ? (
            <>
              <input 
                value={note.title} 
                onChange={(e) => setNote({...note, title: e.target.value})}
                placeholder="Not Başlığı..."
                className="w-full bg-transparent text-3xl md:text-4xl text-[#D4AF37] border-none focus:outline-none font-bold italic placeholder:opacity-20"
              />
              <DivineTagInput tags={note.tags || []} onChange={(newTags) => setNote({ ...note, tags: newTags })} placeholder="#Etiketler" />
            </>
          ) : (
            <>
              <h1 className="text-3xl md:text-4xl font-bold text-[#D4AF37] leading-tight italic tracking-tight">{note.title || "Adsız Not"}</h1>
              <DivineTagInput tags={note.tags || []} onChange={(newTags) => setNote({ ...note, tags: newTags })} placeholder="#Etiketler" />
            </>
          )}
        </header>

        {/* --- AKTİF RECALL (MANUEL KONTROL) ODASI --- */}
        {isRecallMode ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* iPad Yan Yana Ekran Çalışma Bilgilendirm
