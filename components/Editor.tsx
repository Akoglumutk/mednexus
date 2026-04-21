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

// Görsel genişliğini destekleyen Image uzantısı
const CustomImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: '100%',
        renderHTML: attributes => ({
          style: `width: ${attributes.width};`,
        }),
      },
      textAlign: {
        default: 'center',
        renderHTML: attributes => ({
          style: `display: block; margin-left: ${attributes.textAlign === 'left' ? '0' : attributes.textAlign === 'right' ? 'auto' : 'auto'}; margin-right: ${attributes.textAlign === 'right' ? '0' : attributes.textAlign === 'left' ? 'auto' : 'auto'};`,
        }),
      },
    };
  },
  addOptions() {
    return {
      ...this.parent?.(),
      inline: false,
      allowBase64: true,
      HTMLAttributes: {},
      // Eğer resize kullanmıyorsan false, kullanıyorsan ayar objeni gir
      resize: false, 
      // TypeScript'in beklediği kesin boolean değerini veriyoruz
    } as any; // KRİTİK MÜDAHALE: Tip uyuşmazlığını by-pass ediyoruz
  },
});

const Editor = ({ content, onChange }: { content: any, onChange: (val: any) => void }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        // Blockquote'u data-type ile çalışacak şekilde esnetiyoruz
        blockquote: false,
        heading: { levels: [1, 2, 3] },
      }),
      Underline,
      CustomImage.configure({
        HTMLAttributes: {
          class: 'mx-auto rounded-lg border border-[#D4AF37]/20 transition-all duration-300 block',
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph', 'image'] }),
      Link.configure({ openOnClick: false }),
      CustomBlockquote,
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
    editorProps: {
      attributes: {
        class: 'prose prose-invert tiptap max-w-none focus:outline-none min-h-[50vh] text-[#E0E0E0] font-serif p-6 md:p-10',
      },
    },
  });

  if (!editor) return null;

  // Görsel Resize Fonksiyonu
  const setWidth = (width: string) => {
    editor.chain().focus().updateAttributes('image', { width }).run();
  };

  // Spot/Callout Belirleme
  const setCallout = (type: 'spot' | 'klinik' | 'dikkat') => {
    // Eğer zaten o tipteyse kapat, değilse aç ve tipi ayarla
    if (editor.isActive('blockquote', { 'data-type': type })) {
        editor.chain().focus().toggleBlockquote().run();
    } else {
        editor.chain().focus().setBlockquote().updateAttributes('blockquote', { 'data-type': type }).run();
    }
  };

  return (
    <div className="w-full bg-black/40 border border-[#D4AF37]/10 shadow-2xl">
      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={async (e) => {
        const file = e.target.files?.[0];
        if (file) {
          const url = await uploadImage(file);
          editor.chain().focus().setImage({ src: url }).run();
        }
      }} />

      {/* TOOLBAR - Asil & Fonksiyonel */}
      <div className="sticky top-0 z-30 flex flex-wrap gap-1.5 p-3 bg-[#0A0A0A]/95 backdrop-blur-md border-b border-[#D4AF37]/20 overflow-x-auto no-scrollbar items-center">
        
        {/* Hiyerarşi (Geri Geldi) */}
        <div className="flex flex-wrap gap-1.5 p-3 bg-[#0A0A0A]/95 items-center">
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 1 }) ? 'text-[#D4AF37] border-[#D4AF37]' : ''}`}>H1</button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 2 }) ? 'text-[#D4AF37] border-[#D4AF37]' : ''}`}>H2</button>
          <button onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} className={`toolbar-btn ${editor.isActive('heading', { level: 3 }) ? 'text-[#D4AF37] border-[#D4AF37]' : ''}`}>H3</button>
        </div>
        
        <div className="divider" />

        {/* Temel Stil */}
        <div className="flex flex-wrap gap-1.5 p-3 bg-[#0A0A0A]/95 items-center">
          <button onClick={() => editor.chain().focus().toggleBold().run()} className="toolbar-btn">B</button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className="toolbar-btn">I</button>
          <button onClick={() => editor.chain().focus().toggleUnderline().run()} className="toolbar-btn">U</button>
        </div>

        <div className="divider" />
        <div className="flex flex-wrap gap-1.5 p-3 bg-[#0A0A0A]/95 items-center">

          {/* Listeler (UL/OL) */}
          <button 
            onClick={() => editor.chain().focus().toggleBulletList().run()} 
            className={`toolbar-btn ${editor.isActive('bulletList') ? 'text-[#D4AF37] border-[#D4AF37]' : ''}`}
          >
            • 
          </button>
          <button 
            onClick={() => editor.chain().focus().toggleOrderedList().run()} 
            className={`toolbar-btn ${editor.isActive('orderedList') ? 'text-[#D4AF37] border-[#D4AF37]' : ''}`}
          >
            1.
          </button>

          <div className="divider" />

          {/* Metin Hizalama (Text Alignment) */}
          <button 
            onClick={() => {
              if (editor.isActive('image')) {
                editor.chain().focus().updateAttributes('image', { textAlign: 'left' }).run();
              } else {
                editor.chain().focus().setTextAlign('left').run();
              }
            }} 
            className="toolbar-btn"
          >
            Sol
          </button>
          <button 
            onClick={() => {
              if (editor.isActive('image')) {
                editor.chain().focus().updateAttributes('image', { textAlign: 'center' }).run();
              } else {
                editor.chain().focus().setTextAlign('center').run();
              }
            }} 
            className="toolbar-btn"
          >
            Orta
          </button>
          <button 
            onClick={() => {
              if (editor.isActive('image')) {
                editor.chain().focus().updateAttributes('image', { textAlign: 'right' }).run();
              } else {
                editor.chain().focus().setTextAlign('right').run();
              }
            }} 
            className="toolbar-btn"
          >
            Sağ
          </button>
        </div>

        <div className="divider" />
        
        <div className="flex flex-wrap gap-1.5 p-3 bg-[#0A0A0A]/95 items-center">
        {/* Callout Sistemi (Farklılaşmış) */}
          <button onClick={() => setCallout('spot')} className={`px-2 py-1 border text-[9px] font-bold uppercase transition-all ${editor.isActive('blockquote', { 'data-type': 'spot' }) ? 'bg-[#8B0000] text-white' : 'border-[#8B0000] text-[#8B0000]'}`}>Spot</button>
          <button onClick={() => setCallout('klinik')} className={`px-2 py-1 border text-[9px] font-bold uppercase transition-all ${editor.isActive('blockquote', { 'data-type': 'klinik' }) ? 'bg-[#008B8B] text-white' : 'border-[#008B8B] text-[#008B8B]'}`}>Klinik</button>
          <button onClick={() => setCallout('dikkat')} className={`px-2 py-1 border text-[9px] font-bold uppercase transition-all ${editor.isActive('blockquote', { 'data-type': 'dikkat' }) ? 'bg-[#D4AF37] text-black' : 'border-[#D4AF37] text-[#D4AF37]'}`}>Dikkat</button>
        </div>

        <div className="divider" />

        <div className="flex flex-wrap gap-1.5 p-3 bg-[#0A0A0A]/95 items-center">
        <button onClick={() => fileInputRef.current?.click()} className="toolbar-btn">📷 +</button>
        {/* Görsel Yönetimi */}
          <div className="flex bg-[#8B0000]/10 border border-[#8B0000]/30 rounded px-1 gap-1">
            <button onClick={() => setWidth('25%')} className="toolbar-btn !border-none text-[8px]">S</button>
            <button onClick={() => setWidth('50%')} className="toolbar-btn !border-none text-[8px]">M</button>
            <button onClick={() => setWidth('100%')} className="toolbar-btn !border-none text-[8px]">L</button>
          </div>
        </div>

        <div className="divider" />

        <div className="flex flex-wrap gap-1.5 p-3 bg-[#0A0A0A]/95 items-center">
        {/* Undo/Redo */}
          <button onClick={() => editor.chain().focus().undo().run()} className="toolbar-btn">↶</button>
          <button onClick={() => editor.chain().focus().redo().run()} className="toolbar-btn">↷</button>
        </div>
      </div>

      <EditorContent editor={editor} />
    </div>
  );
};

export default Editor;