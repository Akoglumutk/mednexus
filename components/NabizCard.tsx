// components/NabizCard.tsx
import React from 'react';

interface NabizCardProps {
  item: {
    type: 'ATLAS' | 'NOT' | 'SORU';
    title?: string;
    text?: string;
    description?: string;
    content?: string;
    tags?: string[];
    created_at: string;
  };
}

export default function NabizCard({ item }: NabizCardProps) {
  // Tip bazlı stil ve ikon eşleşmeleri
  const meta = {
    ATLAS: { label: 'Atlas Preparatı', icon: '🔬', border: 'border-[#8B0000]/30', bg: 'bg-[#8B0000]/5' },
    NOT: { label: 'Scriptorium Notu', icon: '📜', border: 'border-[#D4AF37]/30', bg: 'bg-[#D4AF37]/5' },
    SORU: { label: 'İmtihan Vakası', icon: '⚖️', border: 'border-white/10', bg: 'bg-white/5' }
  }[item.type];

  // İçerik özeti temizliği (HTML taglerinden arındırma)
  const getSnippet = () => {
    const raw = item.description || item.content || item.text || "";
    return raw.replace(/<[^>]*>/g, '').substring(0, 120) + "...";
  };

  return (
    <div className={`group relative p-5 mb-4 border ${meta.border} bg-black/40 backdrop-blur-md transition-all hover:bg-white/[0.02]`}>
      <header className="flex justify-between items-start mb-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px]">{meta.icon}</span>
            <span className="text-[7px] text-white/30 uppercase tracking-[0.3em] font-bold">
              {meta.label}
            </span>
          </div>
          <h3 className="text-[#D4AF37] text-md font-bold italic tracking-wide group-hover:translate-x-1 transition-transform">
            {item.title || "Adsız Vaka"}
          </h3>
        </div>
        <span className="text-[8px] text-white/20 tabular-nums italic">
          {new Date(item.created_at).toLocaleDateString('tr-TR')}
        </span>
      </header>

      {/* Dinamik İçerik Parçacığı */}
      <p className="text-[11px] text-white/50 italic leading-relaxed mb-5 line-clamp-2 border-l border-white/5 pl-4">
        {getSnippet()}
      </p>

      {/* Etiket Bulutu */}
      <div className="flex flex-wrap gap-2">
        {item.tags?.map((tag) => (
          <span 
            key={tag} 
            className="px-2 py-0.5 bg-black/60 border border-white/10 text-[#D4AF37]/60 text-[8px] uppercase tracking-widest italic"
          >
            #{tag}
          </span>
        ))}
        {(!item.tags || item.tags.length === 0) && (
          <span className="text-[7px] text-white/10 uppercase tracking-widest">Etiketsiz Arşiv</span>
        )}
      </div>

      {/* Sağ Alt Dekoratif Köşe */}
      <div className="absolute bottom-0 right-0 w-8 h-8 bg-gradient-to-br from-transparent to-white/[0.02] pointer-events-none" />
    </div>
  );
}