'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Link from '@tiptap/extension-link'
import Paragraph from '@tiptap/extension-paragraph' // KRİTİK EKLEME
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

// Sınıf (class) attribute'unu filtrelemeden koruyan Gelişmiş Paragraph Uzantısı
const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      class: {
        default: null,
        // HTML'den okurken class'ı yakala
        parseHTML: element => element.getAttribute('class'),
        // HTML'e basarken class'ı aynen aktar (2 SÜTUNUN ÇALIŞMAMA SEBEBİ BUYDU)
        renderHTML: attributes => {
          if (!attributes.class) return {};
          return { class: attributes.class };
        },
      },
    }
  },
})

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
        paragraph: false, // Standart paragrafı kapatıp özel uzantımızı açıyoruz
        heading: { levels: [1, 2, 3] },
      }),
      CustomParagraph, // Özel paragraf devreye girdi
      Underline,
      CustomImage.configure({
        HTMLAttributes: {
          class: 'mx-auto rounded-lg border border-[#D4AF37]/20 transition-all duration-300 block',
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: false }),
      CustomBlockquote,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: {
      attributes: {
        // h-[calc(100vh-280px)] -> Editörün kendi scroll'u olacak, dışarı taşmayacak!
        class: 'prose prose-invert tiptap max-w-none focus:outline-none h-[calc(100vh-280px)] overflow-y-auto text-[#E0E0E0] font-serif p-6 md:p-10 no-scrollbar',
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

  const toggleTwoColumns = () => {
    if (editor.isActive('paragraph', { class: 'tus-two-columns' })) {
      editor.chain().focus().updateAttributes('paragraph', { class: null }).run();
    } else {
      editor.chain().focus().updateAttributes('paragraph', { class: 'tus-two-columns' }).run();
    }
  };

  return (
    // h-[calc(100vh-200px)] -> Editör kutusunu ekrana sabitleyerek taşmayı engelliyoruz
    <div className="w-full bg-black/40 border border-[#D4AF37]/10 shadow-2xl h-[calc(100vh-200px)] flex flex-col overflow-hidden relative mb-10">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const url = await uploadImage(file);
          editor.chain().focus().setImage({ src: url }).run();
        }
      }} />

      {/* TOOLBAR - KESİN FLOATING / STICKY GARANTİSİ */}
      <div className="sticky top-0 z-40 flex flex-wrap gap-2 p-3 bg-[#0A0A0A] border-b border-[#D4AF37]/20 items-center w-full select-none shrink-0">
        <div className="flex gap-1">
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'text-[#D4AF37] border-[#D4AF37]' : ''}`}>H1</button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'text-[#D4AF37] border-[#D4AF37]' : ''}`}>H2</button>
          <button type="button" onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'text-[#D4AF37] border-[#D4AF37]' : ''}`}>H3</button>
        </div>
        
        <div className="w-[1px] h-4 bg-white/10" />

        <div className="flex gap-1">
          <button type="button" onClick={() => editor.chain().focus().toggleBold().run()} className={`toolbar-btn ${editor.isActive('bold') ? 'text-[#D4AF37]' : ''}`}>B</button>
          <button type="button" onClick={() => editor.chain().focus().toggleItalic().run()} className={`toolbar-btn ${editor.isActive('italic') ? 'text-[#D4AF37]' : ''}`}>I</button>
          <button type="button" onClick={() => editor.chain().focus().toggleUnderline().run()} className={`toolbar-btn ${editor.isActive('underline') ? 'text-[#D4AF37]' : ''}`}>U</button>
        </div>

        <div className="w-[1px] h-4 bg-white/10" />

        <div className="flex gap-1">
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`toolbar-btn ${editor.isActive({ textAlign: 'left' }) ? 'text-[#D4AF37]' : ''}`}>Sol</button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`toolbar-btn ${editor.isActive({ textAlign: 'center' }) ? 'text-[#D4AF37]' : ''}`}>Orta</button>
          <button type="button" onClick={() => editor.chain().focus().setTextAlign('justify').run()} className={`toolbar-btn ${editor.isActive({ textAlign: 'justify' }) ? 'text-[#D4AF37]' : ''}`}>İki Yana</button>
        </div>

        <div className="w-[1px] h-4 bg-white/10" />

        <button 
          type="button"
          onClick={toggleTwoColumns} 
          className={`px-2 py-1 border text-[9px] font-mono font-bold uppercase transition-all ${editor.isActive('paragraph', { class: 'tus-two-columns' }) ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'border-white/20 text-white/40 hover:border-[#D4AF37]/40'}`}
        >
          [ 2 Sütun Modu ]
        </button>

        <div className="w-[1px] h-4 bg-white/10" />

        <div className="flex gap-1">
          <button type="button" onClick={() => setCallout('spot')} className={`px-2 py-1 border text-[9px] font-bold uppercase transition-all ${editor.isActive('blockquote', { 'data-type': 'spot' }) ? 'bg-[#8B0000] text-white' : 'border-[#8B0000] text-[#8B0000]'}`}>Spot</button>
          <button type="button" onClick={() => setCallout('klinik')} className={`px-2 py-1 border text-[9px] font-bold uppercase transition-all ${editor.isActive('blockquote', { 'data-type': 'klinik' }) ? 'bg-[#008B8B] text-white' : 'border-[#008B8B] text-[#008B8B]'}`}>Klinik</button>
          <button type="button" onClick={() => setCallout('dikkat')} className={`px-2 py-1 border text-[9px] font-bold uppercase transition-all ${editor.isActive('blockquote', { 'data-type': 'dikkat' }) ? 'bg-[#D4AF37] text-black' : 'border-[#D4AF37] text-[#D4AF37]'}`}>Dikkat</button>
        </div>

        <div className="w-[1px] h-4 bg-white/10" />

        <div className="flex gap-1.5 items-center">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="toolbar-btn">📷 +</button>
          <div className="flex bg-white/5 border border-white/10 rounded px-1 gap-1">
            <button type="button" onClick={() => setWidth('30%')} className="toolbar-btn !border-none text-[8px]">S</button>
            <button type="button" onClick={() => setWidth('60%')} className="toolbar-btn !border-none text-[8px]">M</button>
            <button type="button" onClick={() => setWidth('100%')} className="toolbar-btn !border-none text-[8px]">L</button>
          </div>
        </div>

        <div className="w-[1px] h-4 bg-white/10" />

        <div className="flex gap-1">
          <button type="button" onClick={() => editor.chain().focus().undo().run()} className="toolbar-btn">↶</button>
          <button type="button" onClick={() => editor.chain().focus().redo().run()} className="toolbar-btn">↷</button>
        </div>
      </div>

      {/* Editör Metin Alanı Kapsayıcısı */}
      <div className="flex-1 overflow-hidden relative">
        <EditorContent editor={editor} className="h-full" />
      </div>
    </div>
  );
};

export default Editor;
