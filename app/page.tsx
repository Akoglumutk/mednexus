'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [examDates, setExamDates] = useState({
    committee: '2026-06-02',
    final: '2026-06-22'
  });
  const [isEditing, setIsEditing] = useState(false);

  // Tarihleri tarayıcı hafızasından yükle
  useEffect(() => {
    const saved = localStorage.getItem('mednexus-dates');
    if (saved) setExamDates(JSON.parse(saved));
  }, []);

  const saveDates = () => {
    localStorage.setItem('mednexus-dates', JSON.stringify(examDates));
    setIsEditing(false);
  };

  const getDaysRemaining = (dateStr: string) => {
    const diff = new Date(dateStr).getTime() - new Date().getTime();
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)));
  };

  // İsimler sadeleştirildi, Dark Academia ruhu korundu
  const modules = [
    { title: "MATBAA", desc: "Ders Notları & Mekanizmalar", href: "/scriptorium" },
    { title: "ATLAS", desc: "Anatomi & Preparat Çalışması", href: "/atlas" },
    { title: "KANVAS", desc: "Sonsuz Kanvas Üzerinde Bütüncül Çalışma", href: "/canvas" },
    { title: "NABIZ", desc: "Hızlı, genel ve her yerde okuma", href: "/pulse" },
    { title: "İMTİHAN", desc: "Çıkmış sorular külliyatı", href: "/trials" },
    { title: "HASTANE", desc: "Vakalar ve Konsültasyonlar", href: "/hastane" },
  ];

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#E0E0E0] p-6 md:p-12 font-serif selection:bg-[#8B0000]">
      {/* Texture Overlay */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

      {/* Header - Mobile Responsive Fix */}
      <header className="max-w-6xl mx-auto mb-16 border-b border-[#D4AF37]/20 pb-10">
        <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-8 text-center md:text-left">
          
          <div className="flex flex-col items-center md:items-start">
            <h1 className="text-4xl md:text-6xl font-bold tracking-[0.2em] text-[#D4AF37] uppercase">
              MedNexus
            </h1>
            <p className="mt-2 text-[10px] tracking-[0.3em] text-[#D4AF37]/50 uppercase italic">
              Divina Architectura
            </p>
          </div>

          <div className="flex flex-col items-center md:items-end w-full md:w-auto">
            <button 
              onClick={() => isEditing ? saveDates() : setIsEditing(true)}
              className="text-[10px] text-[#D4AF37]/40 hover:text-[#D4AF37] uppercase tracking-widest mb-4 transition-all"
            >
              {isEditing ? '[ Kaydet ]' : '[ Düzenle ]'}
            </button>
            
            <div className="flex gap-8 md:gap-12">
              <div className="flex flex-col items-center">
                {isEditing ? (
                  <input type="date" value={examDates.committee} onChange={(e) => setExamDates({...examDates, committee: e.target.value})} className="bg-transparent border-b border-[#8B0000] text-[#8B0000] text-sm focus:outline-none mb-2"/>
                ) : (
                  <span className="text-4xl font-light text-[#8B0000] leading-none">{getDaysRemaining(examDates.committee)}</span>
                )}
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#8B0000]/60 mt-1">Komite</span>
              </div>
              
              <div className="flex flex-col items-center">
                {isEditing ? (
                  <input type="date" value={examDates.final} onChange={(e) => setExamDates({...examDates, final: e.target.value})} className="bg-transparent border-b border-[#D4AF37] text-[#D4AF37] text-sm focus:outline-none mb-2"/>
                ) : (
                  <span className="text-4xl font-light text-[#D4AF37] leading-none">{getDaysRemaining(examDates.final)}</span>
                )}
                <span className="text-[9px] uppercase tracking-[0.2em] text-[#D4AF37]/60 mt-1">Final</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Grid */}
      <div className="max-w-6xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10">
        {modules.map((mod) => (
          <Link 
            key={mod.title} 
            href={mod.href} 
            className="group relative p-8 md:p-10 bg-black/40 border border-[#D4AF37]/10 hover:border-[#D4AF37]/40 transition-all duration-500"
          >
            {/* Minimal Corner Accent */}
            <div className="absolute top-0 left-0 w-px h-0 group-hover:h-full bg-[#D4AF37]/50 transition-all duration-700"></div>
            
            <h2 className="text-lg md:text-xl font-medium text-[#D4AF37] mb-2 tracking-[0.15em] uppercase group-hover:translate-x-2 transition-transform">
              {mod.title}
            </h2>
            <p className="text-[11px] text-[#E0E0E0]/50 leading-relaxed tracking-wider uppercase">
              {mod.desc}
            </p>
          </Link>
        ))}
      </div>

      <footer className="max-w-6xl mx-auto mt-20 text-center opacity-20">
        <p className="text-[10px] tracking-[0.5em] uppercase italic text-[#D4AF37]">
          Memento Mori
        </p>
      </footer>
    </main>
  );
}