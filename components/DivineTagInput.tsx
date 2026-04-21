// components/DivineTagInput.tsx
import { useState, KeyboardEvent } from 'react';

interface Props {
    tags: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
}

export default function DivineTagInput({ tags, onChange, placeholder = "Etiket ekle..." }: Props) {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const tag = inputValue.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        onChange([...tags, tag]);
        setInputValue('');
      }
    } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (indexToRemove: number) => {
    onChange(tags.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="flex flex-wrap gap-2 p-2 bg-black/40 border border-[#D4AF37]/20 rounded-sm min-h-[44px] transition-all focus-within:border-[#D4AF37]/50">
      {tags.map((tag, index) => (
        <span key={index} className="flex items-center gap-1 px-2 py-1 bg-[#8B0000]/10 border border-[#8B0000]/30 text-[#8B0000] text-[10px] uppercase tracking-widest italic">
          #{tag}
          <button onClick={() => removeTag(index)} className="hover:text-white ml-1">×</button>
        </span>
      ))}
      <input
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={tags.length === 0 ? placeholder : ""}
        className="flex-1 bg-transparent border-none outline-none text-[10px] uppercase tracking-widest text-white/60 placeholder:text-white/20 min-w-[120px]"
      />
    </div>
  );
}