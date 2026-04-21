'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Blockquote from '@tiptap/extension-blockquote'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'

// Aynı CustomBlockquote tanımını buraya da ekle
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

const Viewer = ({ content }: { content: any }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ blockquote: false }),
      CustomBlockquote,
      Underline,
      Image, 
    ],
    content: content,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none text-[#E0E0E0] font-serif',
      },
    },
  });
  // ... useEffect kısımları aynı
  return <EditorContent editor={editor} />;
};

export default Viewer;