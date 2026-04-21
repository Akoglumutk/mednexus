'use client'

interface SearchProps {
  value: string;
  onChange: (val: string) => void;
}

export default function SearchGozcu({ value, onChange }: SearchProps) {
  return (
    <div className="relative w-full max-w-2xl mx-auto group">
      {/* İnce Altın Çizgi Efekti */}
      <div className="absolute -inset-0.5 bg-[#D4AF37]/20 blur opacity-0 group-hover:opacity-100 transition duration-1000"></div>
      
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Arşivde iz sür... (Konu, etiket veya mühür)"
          className="w-full bg-black/60 border border-[#D4AF37]/20 p-5 pl-14 text-[#D4AF37] focus:outline-none focus:border-[#8B0000] transition-all font-serif italic text-sm placeholder:text-[#D4AF37]/20"
        />
        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-[#D4AF37]/40">
          <span className="text-xl">🔍</span>
        </div>
        
        {value && (
          <button 
            onClick={() => onChange('')}
            className="absolute right-5 top-1/2 -translate-y-1/2 text-[#8B0000] text-[10px] font-bold tracking-widest hover:text-white transition-colors"
          >
            [ TEMİZLE ]
          </button>
        )}
      </div>
    </div>
  );
}