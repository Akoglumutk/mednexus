'use client'
import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import Editor from '@/components/Editor';
import Viewer from '@/components/Viewer';
import DivinePrompt from '@/components/DivinePrompt';
import "@excalidraw/excalidraw/index.css"; 
import DivineTagInput from '@/components/DivineTagInput';
import { useAssetUpload } from '@/hooks/useAssetUpload';

export default function NoteDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [note, setNote] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isPromptOpen, setIsPromptOpen] = useState(false);

  // --- BLURTING (HAFIZA BOŞALTMA) DURUMLARI ---
  const [isBlurtingMode, setIsBlurtingMode] = useState(false);
  const [blurtInput, setBlurtInput] = useState('');
  const [blurtResult, setBlurtResult] = useState<{ found: string[]; missing: string[] } | null>(null);

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

  // iPad split-screen kopyalama/yapıştırma akışı için entegrasyonu güçlendirilmiş handler
  const onPasteHandler = async (e: React.ClipboardEvent) => {
    const url = await handlePaste(e);
    if (url && isEditing) {
      // Editörün içine Markdown görsel kodu olarak gömme prototipi
      const imgMarkdown = `\n![Mühürlü Görsel](${url})\n`;
      setNote((prev: any) => ({ ...prev, content: prev.content + imgMarkdown }));
    }
  };

  // --- TEMİZ VE ÇEVRECİ BLURTING ALGORİTMASI (CLIENT-SIDE) ---
  // Bu fonksiyon ileride Trials modülündeki toplu soru ayrıştırıcısının (parser) regex temelini oluşturacak.
  const evaluateBlurting = () => {
  if (!note?.content || !blurtInput) return;

  // 1. Tarayıcının kendi DOM parser'ını kullanarak HTML etiketlerini kusursuz temizliyoruz
  const parser = new DOMParser();
  const doc = parser.parseFromString(note.content, 'text/html');
  const cleanOriginal = (doc.body.textContent || doc.body.innerText || '').toLowerCase();
  const cleanUser = blurtInput.toLowerCase();

  // 2. Tıbbi metindeki terimleri yakalamak için daha esnek bir Regex (Türkçe karakter ve tire uyumlu)
  // 3 harften uzun kelimeleri de alalım ki "gfr", "akt", "cap" gibi kısaltmalar kaçmasın!
  const originalWords = Array.from(
    new Set(cleanOriginal.match(/[a-zA-ZçğıöşüÇĞİÖŞÜ/-]{3,}/g) || [])
  );
  
  const found: string[] = [];
  const missing: string[] = [];

  originalWords.forEach((word: any) => {
    // Kelimenin tam eşleşmesini kontrol etmek için sınır kontrolü yapıyoruz
    if (cleanUser.includes(word)) {
      found.push(word);
    } else {
      missing.push(word);
    }
  });

  setBlurtResult({ found, missing });
};

  if (loading) return <div className="min-h-screen bg-[#010102] flex items-center justify-center text-[#D4AF37] tracking-[0.3em] uppercase animate-pulse italic text-[10px]">Arşiv taranıyor...</div>;
  if (!note) return <div className="min-h-screen bg-[#010102] flex items-center justify-center text-[#8B0000] uppercase text-[10px] tracking-widest">Bilgi bulunamadı.</div>;

  return (
    <main 
      onPaste={onPasteHandler} // iPadOS kopyala-yapıştır sızıntılarını yakalayan tetikleyici
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
          <button onClick={() => { if(isBlurtingMode) { setIsBlurtingMode(false); setBlurtResult(null); } else { router.push('/scriptorium'); } }} className="text-[#D4AF37]/40 text-[9px] uppercase tracking-[0.3em] mb-4 hover:text-[#D4AF37] transition-colors">
            {isBlurtingMode ? '← BLURTINGDEN ÇIK' : '← ARŞİVE DÖN'}
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

        {/* INTERACTIVE BLURTING MATRIX PANEL */}
        {isBlurtingMode ? (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div className="p-4 bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-sm">
              <span className="text-[8px] block text-[#D4AF37] uppercase tracking-widest mb-1">Mekanizma Analiz Laboratuvarı</span>
              <p className="text-xs italic text-white/60">Aklınızda kalan tüm fizyolojik mekanizmaları, histolojik katmanları ve textbook verilerini aşağıdaki parşömene dökün.</p>
            </div>

            <textarea
              value={blurtInput}
              onChange={(e) => setBlurtInput(e.target.value)}
              placeholder="Zihninizdeki bilgileri buraya özgürce boşaltın..."
              className="w-full h-64 bg-black/40 border border-white/10 p-4 text-xs italic text-white/80 outline-none focus:border-[#D4AF37] resize-none leading-relaxed rounded-sm font-sans"
            />

            <button
              onClick={evaluateBlurting}
              className="bg-[#D4AF37] text-black text-[9px] font-bold uppercase tracking-[0.2em] px-8 py-3 rounded-sm active:scale-95 transition-transform"
            >
              Matrisi Hesapla
            </button>

            {blurtResult && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-6 border-t border-white/5 animate-in slide-in-from-bottom-3">
                {/* BAŞARILI KELİMELER (GOLD) */}
                <div className="p-4 bg-emerald-950/10 border border-emerald-500/20 rounded-sm">
                  <span className="text-[8px] block text-emerald-400 uppercase tracking-widest mb-3 font-mono">Hatırlanan Tıbbi Odaklar ({blurtResult.found.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {blurtResult.found.map(w => (
                      <span key={w} className="text-[10px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded-sm font-mono">
                        {w}
                      </span>
                    ))}
                    {blurtResult.found.length === 0 && <span className="text-[10px] text-white/20 italic">Henüz eşleşme yok.</span>}
                  </div>
                </div>

                {/* EKSİK KELİMELER (AEON RED) */}
                <div className="p-4 bg-red-950/10 border border-red-500/20 rounded-sm">
                  <span className="text-[8px] block text-[#8B0000] uppercase tracking-widest mb-3 font-mono">Gözden Kaçan Hücre/Mekanizmalar ({blurtResult.missing.length})</span>
                  <div className="flex flex-wrap gap-1.5">
                    {blurtResult.missing.map(w => (
                      <span key={w} className="text-[10px] bg-red-500/10 text-red-400 px-2 py-0.5 rounded-sm font-mono">
                        {w}
                      </span>
                    ))}
                    {blurtResult.missing.length === 0 && <span className="text-[10px] text-emerald-400 italic">Kusursuz hafıza!</span>}
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* NORMAL NOT GÖRÜNÜMÜ VEYA EDİTÖR */
          <article className="min-h-[50vh] animate-in fade-in duration-500">
            {isEditing ? (
              <Editor 
                content={note.content} 
                onChange={(val: any) => setNote({...note, content: val})} 
              />
            ) : (
              <Viewer content={note.content} />
            )}
          </article>
        )}
      </div>

      {/* --- GÜVENLİ FOOTER (Divine Bar - iPad Klavye Optimize) --- */}
      <footer className="fixed bottom-0 left-0 right-0 bg-[#010102]/95 border-t border-t-white/5 p-4 backdrop-blur-md z-50">
        <div className="max-w-4xl mx-auto flex justify-between items-center gap-4">
          {isEditing ? (
            <div className="flex w-full justify-between items-center px-2">
              {id !== 'new' && (
                <button onClick={() => setIsEditing(false)} className="text-[9px] uppercase tracking-widest text-white/30 hover:text-white">Vazgeç</button>
              )}
              <button 
                onClick={handleSave} 
                className="bg-[#D4AF37] text-black px-12 py-3 text-[9px] font-bold tracking-[0.2em] uppercase rounded-sm shadow-md active:scale-95 transition-all"
              >
                {id === 'new' ? 'MÜHRÜ BAS' : 'MÜHRÜ GÜNCELLE'}
              </button>
            </div>
          ) : (
            <div className="flex w-full justify-between items-center px-2">
              <button 
                onClick={() => setIsPromptOpen(true)} 
                className="text-[9px] uppercase tracking-widest text-[#8B0000]/50 hover:text-[#8B0000] transition-colors"
              >
                İmha Et
              </button>

              {/* LOKAL BLURTING AKTİVASYON BUTONU */}
              {!isBlurtingMode && (
                <button
                  onClick={() => { setIsBlurtingMode(true); setBlurtInput(''); setBlurtResult(null); }}
                  className="bg-[#8B0000]/10 border border-[#8B0000]/30 text-red-400 px-6 py-3 text-[9px] font-bold tracking-widest uppercase hover:bg-[#8B0000]/20 rounded-sm"
                >
                  [ BLURTING Sınavı ]
                </button>
              )}
                
              <button 
                onClick={() => { setIsEditing(true); setIsBlurtingMode(false); }} 
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
