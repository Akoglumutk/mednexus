'use client'
import { useState } from 'react';

export default function AtlasEditor({ imageUrl }: { imageUrl: string }) {
  const [pins, setPins] = useState<{ x: number, y: number, label: string }[]>([]);

  const addPin = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    const label = prompt("Bu yapıya bir mühür vur:");
    if (label) setPins([...pins, { x, y, label }]);
  };

  return (
    <div className="relative inline-block w-full cursor-crosshair border border-[#D4AF37]/20 overflow-hidden" onClick={addPin}>
      <img src={imageUrl} alt="Atlas Preparat" className="w-full h-auto block select-none" />
      
      {pins.map((pin, index) => (
        <div 
          key={index}
          className="absolute w-4 h-4 bg-[#8B0000] border-2 border-white rounded-full -translate-x-1/2 -translate-y-1/2 group"
          style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
        >
          {/* Label - Hover durumunda değil, her zaman orada ama gizlenebilir olacak */}
          <span className="absolute left-6 top-1/2 -translate-y-1/2 bg-black/80 border border-[#D4AF37]/40 text-[#D4AF37] px-2 py-1 text-[10px] whitespace-nowrap opacity-100 transition-opacity">
            {pin.label}
          </span>
        </div>
      ))}
    </div>
  );
}