'use client'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Blockquote from '@tiptap/extension-blockquote'
import Underline from '@tiptap/extension-underline'
import Image from '@tiptap/extension-image'
import TextAlign from '@tiptap/extension-text-align'
import Paragraph from '@tiptap/extension-paragraph' // Sütun okuma güvencesi

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

const CustomParagraph = Paragraph.extend({
  addAttributes() {
    return {
      class: {
        default: null,
        parseHTML: element => element.getAttribute('class'),
        renderHTML: attributes => attributes.class ? { class: attributes.class } : {},
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

const Viewer = ({ content }: { content: any }) => {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({ blockquote: false, paragraph: false }),
      CustomParagraph,
      CustomBlockquote,
      Underline,
      CustomImage, 
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: content,
    editable: false,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: 'prose prose-invert max-w-none text-[#E0E0E0] font-serif leading-loose tracking-wide mednexus-content-grid pb-32',
      },
    },
  });

  return <EditorContent editor={editor} />;
};

export default Viewer;
