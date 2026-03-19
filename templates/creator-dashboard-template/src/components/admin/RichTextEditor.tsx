import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import { Bold, Italic, List, ListOrdered, Image as ImageIcon, Heading2, Quote } from 'lucide-react';
import { useState } from 'react';
import ImageUpload from './ImageUpload';

type RichTextEditorProps = {
  value: string;
  onChange: (value: string) => void;
};

export default function RichTextEditor({ value, onChange }: RichTextEditorProps) {
  const [showImageUpload, setShowImageUpload] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Image,
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-stone max-w-none w-full min-h-[200px] px-4 py-3 bg-soft-cream/30 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20',
      },
    },
  });

  if (!editor) {
    return null;
  }

  const handleImageInsert = (url: string) => {
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
    setShowImageUpload(false);
  };

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-1 p-2 bg-soft-cream/50 rounded-xl border border-primary/10">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-2 rounded hover:bg-white/50 transition-colors ${editor.isActive('bold') ? 'bg-white shadow-sm text-primary' : 'text-taupe'}`}
          title="Bold"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-2 rounded hover:bg-white/50 transition-colors ${editor.isActive('italic') ? 'bg-white shadow-sm text-primary' : 'text-taupe'}`}
          title="Italic"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={`p-2 rounded hover:bg-white/50 transition-colors ${editor.isActive('heading', { level: 2 }) ? 'bg-white shadow-sm text-primary' : 'text-taupe'}`}
          title="Heading"
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-2 rounded hover:bg-white/50 transition-colors ${editor.isActive('bulletList') ? 'bg-white shadow-sm text-primary' : 'text-taupe'}`}
          title="Bullet List"
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-2 rounded hover:bg-white/50 transition-colors ${editor.isActive('orderedList') ? 'bg-white shadow-sm text-primary' : 'text-taupe'}`}
          title="Ordered List"
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={`p-2 rounded hover:bg-white/50 transition-colors ${editor.isActive('blockquote') ? 'bg-white shadow-sm text-primary' : 'text-taupe'}`}
          title="Quote"
        >
          <Quote size={16} />
        </button>
        <div className="w-px h-6 bg-primary/10 mx-1"></div>
        <button
          type="button"
          onClick={() => setShowImageUpload(!showImageUpload)}
          className={`p-2 rounded hover:bg-white/50 transition-colors ${showImageUpload ? 'bg-white shadow-sm text-primary' : 'text-taupe'}`}
          title="Insert Image"
        >
          <ImageIcon size={16} />
        </button>
      </div>

      {showImageUpload && (
        <div className="p-4 bg-soft-cream/50 rounded-xl border border-primary/10">
          <ImageUpload
            label="Insert Image"
            value=""
            onChange={handleImageInsert}
          />
        </div>
      )}

      <EditorContent editor={editor} />
    </div>
  );
}
