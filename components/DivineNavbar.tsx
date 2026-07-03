'use client'
import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';

export default function DivineNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Mobil cihazlarda klavye açıldığında navbarın yukarı fırlayıp 
  // form alanlarını kapatmasını engellemek için akıllı kontrol mekanizması
  useEffect(() => {
    const handleResize = () => {
      if (window.innerHeight < 600) {
        setIsKeyboardOpen(true);
      } else {
        setIsKeyboardOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Eğer klavye açıksa ekran alanından çalmamak için navbarı tamamen gizle
  if (isKeyboardOpen) return null;

  const menuItems = [
    { label: '[ ANA KAPI ]', path: '/' },
    { label: '[ KÜLLİYAT ]', path: '/trials' },
    { label: '[ YENİ MÜHÜR ]', path: '/trials/editor/new' },
  ];

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 font-mono select-none">
      {/* Genişleyen Menü Katmanı */}
      <div className={`absolute bottom-16 left-1/2 -translate-x-1/2 bg-[#010102]/95 border border-[#D4AF37]/20 p-2 backdrop-blur-md transition-all duration-300 rounded-sm shadow-[0_0_30px_rgba(0,0,0,0.8)] flex flex-col gap-2 min-w-[160px] ${
        isOpen ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-4 pointer-events-none'
      }`}>
        {/* Sayfa Geri Tuşu (Terminal Mantığı) */}
        <button 
          onClick={() => { router.back(); setIsOpen(false); }}
          className="text-left text-[9px] uppercase tracking-widest text-[#8B0000] hover:bg-[#8B0000]/10 p-2.5 transition-all border-b border-white/5"
        >
          ← [ GERİ ADIM ]
        </button>

        {/* Dinamik Sayfa Linkleri */}
        {menuItems.map((item) => (
          <button
            key={item.path}
            onClick={() => { router.push(item.path); setIsOpen(false); }}
            className={`text-left text-[9px] uppercase tracking-widest p-2.5 transition-all rounded-sm ${
              pathname === item.path 
                ? 'text-[#D4AF37] bg-[#D4AF37]/10 font-bold' 
                : 'text-white/60 hover:text-white hover:bg-white/5'
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* Ana Tetikleyici Buton (Külliyat Mührü) */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`bg-[#010102]/90 border border-[#D4AF37]/30 px-6 py-3 text-[10px] tracking-[0.3em] uppercase rounded-sm backdrop-blur-sm shadow-[0_0_20px_rgba(212,175,55,0.1)] transition-all duration-300 active:scale-95 ${
          isOpen ? 'text-[#D4AF37] border-[#D4AF37] shadow-[0_0_25px_rgba(212,175,55,0.2)]' : 'text-white/40 hover:text-[#D4AF37]/80'
        }`}
      >
        {isOpen ? '/// KAPAT' : '/// TERMİNAL'}
      </button>
    </div>
  );
}
