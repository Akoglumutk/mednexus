'use client'
import { useState, useEffect } from 'react';

interface DivinePromptProps {
  isOpen: boolean;
  type: 'confirm' | 'input';
  title: string;
  placeholder?: string;
  onConfirm: (value?: string) => void;
  onCancel: () => void;
}

export default function DivinePrompt({ isOpen, type, title, placeholder, onConfirm, onCancel }: DivinePromptProps) {
  const [input, setInput] = useState('');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] bg-[#010102]/80 backdrop-blur-md flex items-center justify-center p-6 animate-in fade-in duration-300">
      <div className="w-full max-w-sm border border-[#D4AF37]/20 bg-[#010102] p-8 shadow-[0_0_50px_rgba(139,0,0,0.1)] relative">
        {/* Dekoratif Köşeler (HSR Estetiği) */}
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-[#D4AF37]" />
        <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-[#D4AF37]" />

        <h3 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.4em] mb-6 text-center italic">{title}</h3>
        
        {type === 'input' && (
          <input 
            autoFocus
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && onConfirm(input)}
            placeholder={placeholder}
            className="w-full bg-transparent border-b border-[#D4AF37]/30 text-white text-center text-lg outline-none focus:border-[#D4AF37] mb-8 py-2 placeholder:text-white/10"
          />
        )}

        <div className="flex gap-4">
          <button onClick={onCancel} className="flex-1 text-[9px] text-white/40 uppercase tracking-widest py-3 hover:text-white transition-colors">Vazgeç</button>
          <button 
            onClick={() => onConfirm(type === 'input' ? input : undefined)} 
            className="flex-1 bg-[#8B0000]/20 text-[#8B0000] border border-[#8B0000]/40 text-[9px] font-bold uppercase tracking-widest py-3 hover:bg-[#8B0000] hover:text-white transition-all shadow-[0_0_15px_rgba(139,0,0,0.1)]"
          >
            Mührü Bas
          </button>
        </div>
      </div>
    </div>
  );
}