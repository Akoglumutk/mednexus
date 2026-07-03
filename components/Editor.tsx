'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import { uploadImage } from '@/lib/upload'
import { useRef } from 'react'
import Blockquote from '@tiptap/extension-blockquote'

// Blockquote uzantısını data-type'ı tanıyacak şekilde genişletiyoruz
const CustomBlockquote = Blockquote.extend({
  addAttributes() {
    return {
      'data-type': {
        default: 'spot',
        parseHTML: element => element.getAttribute('data-type'),
        renderHTML: attributes => ({ 'data-type': attributes['data-type'] }),
      },
    }
  },
})

// Görsel genişliğini destekleyen ve HER ZAMAN ORTALAYAN Image uzantısı
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: attributes => ({
          style: `width: ${attributes.width}; display: block; margin-left: auto; margin-right: auto;`,
        }),
      },
    };
  },
});

const Editor = ({ content, onChange }: { content: any, onChange: (val: any) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      CustomImage.configure({
        HTMLAttributes: {
          class: 'mx-auto rounded-lg border border-[#D4AF37]/20 transition-all duration-300 block',
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }), // Görsel hizalamasını buradan çıkarıp sabitledik
      Link.configure({ openOnClick: false }),
      CustomBlockquote,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: {
      attributes: {
        class: 'prose prose-invert tiptap max-w-none focus:outline-none min-h-[60vh] text-[#E0E0E0] font-serif p-6 md:p-10 pb-40',
      },
    },
  });

  if (!editor) return null;

  const setWidth = (width: string) => {
    editor.chain().focus().updateAttributes('image', { width }).run();
  };

  const setCallout = (type: 'spot' | 'klinik' | 'dikkat') => {
    if (editor.isActive('blockquote', { 'data-type': type })) {
        editor.chain().focus().toggleBlockquote().run();
    } else {
        editor.chain().focus().setBlockquote().updateAttributes('blockquote', { 'data-type': type }).run();
    }
  };

  // TUS Kitabı Tarzı Seçili Alanı İki Sütun Yapma / Normal Akışa Döndürme
  const toggleTwoColumns = () => {
    if (editor.isActive('paragraph', { class: 'tus-two-columns' })) {
      editor.chain().focus().updateAttributes('paragraph', { class: null }).run();
    } else {
      editor.chain().focus().updateAttributes('paragraph', { class: 'tus-two-columns' }).run();
    }
  };

  return (
    <div className="w-full bg-black/40 border border-[#D4AF37]/10 shadow-2xl relative">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const url = await uploadImage(file);
          editor.chain().focus().setImage({ src: url }).run();
        }
      }} />

      {/* FLOATING TOOLBAR OPTIMIZATION: 
        `sticky top-16` veya `top-0` Next.js navbar yerleşimine göre ayarlanır. 
        `z-40` seviyesine çekilerek metin kayarken hep üstte sabit kalır.
      */}
      <div className="sticky top-0 z-40 flex flex-wrap gap-2 p-3 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#D4AF37]/20 items-center w-full select-none">
        
        {/* Hiyerarşi */}
        <div className="flex gap-1">
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'text-[#D4AF37] border-[#D4AF37]' : ''}`}>H1</button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'text-[#D4AF37] border-[#D4AF37]' : ''}`}>H2</button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'text-[#D4AF37] border-[#D4AF37]' : ''}`}>H3</button>
        </div>
        
        <div className="w-[1px] h-4 bg-white/10" />

        {/* Temel Stil */}
        <div className="flex gap-1">
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`toolbar-btn ${editor.isActive('bold') ? 'text-[#D4AF37]' : ''}`}>B</button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`toolbar-btn ${editor.isActive('italic') ? 'text-[#D4AF37]' : ''}`}>I</button>
          <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`toolbar-btn ${editor.isActive('underline') ? 'text-[#D4AF37]' : ''}`}>U</button>
        </div>

        <div className="w-[1px] h-4 bg-white/10" />

        {/* Metin Hizalama (Sadece Metinleri Bağlar) */}
        <div className="flex gap-1">
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'text-[#D4AF37]' : ''}`}>Sol</button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'text-[#D4AF37]' : ''}`}>Orta</button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`toolbar-btn ${editor.isActive({ textAlign: 'justify' }) ? 'text-[#D4AF37]' : ''}`}>İkİ Yana</button>
        </div>

        <div className="w-[1px] h-4 bg-white/10" />

        {/* TUS Kitabı Düzeni: 2 Sütun Mührü */}
        <button 
          type="button"
          onClick={toggleTwoColumns} 
          className={`px-2 py-1 border text-[9px] font-mono font-bold uppercase transition-all ${editor.isActive('paragraph', { class: 'tus-two-columns' }) ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'border-white/20 text-white/40 hover:border-[#D4AF37]/40'}`}
        >
          [ 2 Sütun Modu ]
        </button>

        <div className="w-[1px] h-4 bg-white/10" />

        {/* Callout Sistemi */}
        <div className="flex gap-1">
          <button type="button" onClick={() => setCallout('spot')} className={`px-2 py-1 border text-[9px] font-bold uppercase transition-all ${editor.isActive('blockquote', { 'data-type': 'spot' }) ? 'bg-[#8B0000] text-white' : 'border-[#8B0000] text-[#8B0000]'}`}>Spot</button>
          <button type="button" onClick={() => setCallout('klinik')} className={`px-2 py-1 border text-[9px] font-bold uppercase transition-all ${editor.isActive('blockquote', { 'data-type': 'klinik' }) ? 'bg-[#008B8B] text-white' : 'border-[#008B8B] text-[#008B8B]'}`}>Klinik</button>
          <button type="button" onClick={() => setCallout('dikkat')} className={`px-2 py-1 border text-[9px] font-bold uppercase transition-all ${editor.isActive('blockquote', { 'data-type': 'dikkat' }) ? 'bg-[#D4AF37] text-black' : 'border-[#D4AF37] text-[#D4AF37]'}`}>Dikkat</button>
        </div>

        <div className="w-[1px] h-4 bg-white/10" />

        {/* Görsel Yönetimi (Sadece Ölçekleme Kalacak Şekilde Arındırıldı) */}
        <div className="flex gap-1.5 items-center">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="toolbar-btn">📷 +</button>
          <div className="flex bg-white/5 border border-white/10 rounded px-1 gap-1">
            <button type="button" onClick={() => setWidth('30%')} className="toolbar-btn !border-none text-[8px]">S</button>
            <button type="button" onClick={() => setWidth('60%')} className="toolbar-btn !border-none text-[8px]">M</button>
            <button type="button" onClick={() => setWidth('100%')} className="toolbar-btn !border-none text-[8px]">L</button>
          </div>
        </div>

        <div className="w-[1px] h-4 bg-white/10" />

        {/* Geri / İleri */}
        <div className="flex gap-1">
          <button type="button" onClick={() => editor.chain().focus().undo().run()} className="toolbar-btn">↶</button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()} className="toolbar-btn">↷</button>
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};

export default Editor;
