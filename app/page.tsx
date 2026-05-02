'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function Dashboard() {
  const [examDates, setExamDates] = useState({
    committee: '2026-06-02',
    final: '2026-06-22'
  });
  const [isEditing, setIsEditing] = useState(false);

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

  // Dark Academia & Latince İsimlendirmeler
  const modules = [
    { title: "CODEX", desc: "Annotationes et summaria lectionum", href: "/scriptorium" },
    { title: "ATLAS", desc: "Exercitationes practicae et examinatio praeparationum", href: "/atlas" },
    { title: "PALIMPSEST", desc: "Opus holisticum in tela infinita", href: "/canvas" },
    { title: "COMPENDIUM", desc: "Celer, utilis, et ubique operatur. ", href: "/pulse" },
    { title: "QUAESTIO", desc: "Archivum quaestionum examinationum praeteritarum", href: "/trials" },
    { title: "CLINICUM", desc: "Simulatio casus clinici et consultationis", href: "/hastane" },
  ];

  return (
    <main className="relative min-h-screen bg-[#050505] text-[#E0E0E0] p-6 md:p-12 font-serif selection:bg-[#8B0000]/50 overflow-x-hidden">
      
      {/* Background Layer: Referans 1 (Gotik Pencere) - Discrete Integration */}
      <div 
        className="fixed inset-0 z-0 pointer-events-none opacity-[0.04] bg-cover bg-center bg-no-repeat grayscale"
        style={{ 
          backgroundImage: "url('/bgimg.jpeg')", // Dosya yolunun doğruluğundan emin ol
          maskImage: 'linear-gradient(to bottom, black 10%, transparent 80%)',
          WebkitMaskImage: 'linear-gradient(to bottom, black 10%, transparent 80%)'
        }}
      />

      {/* Texture & Grain Overlay */}
      <div className="fixed inset-0 z-10 pointer-events-none opacity-[0.03] bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]"></div>

      <div className="relative z-20 max-w-6xl mx-auto">
        {/* Header */}
        <header className="mb-20 border-b border-[#D4AF37]/10 pb-12">
          <div className="flex flex-col md:flex-row justify-between items-center md:items-end gap-10">
            
            <div className="flex flex-col items-center md:items-start group">
              <h1 className="text-5xl md:text-7xl font-bold tracking-[0.25em] text-[#D4AF37] uppercase transition-all duration-700 hover:tracking-[0.3em]">
                MedNexus
              </h1>
              <p className="mt-3 text-[11px] tracking-[0.4em] text-[#D4AF37]/40 uppercase italic">
                Divina Architectura
              </p>
            </div>

            <div className="flex flex-col items-center md:items-end min-w-[200px]">
              <button 
                onClick={() => isEditing ? saveDates() : setIsEditing(true)}
                className="text-[9px] text-[#D4AF37]/30 hover:text-[#D4AF37] uppercase tracking-[0.4em] mb-6 transition-all duration-300"
              >
                {isEditing ? '● Confirma' : '● Editio'}
              </button>
              
              <div className="flex gap-12">
                <div className="flex flex-col items-center group">
                  {isEditing ? (
                    <input type="date" value={examDates.committee} onChange={(e) => setExamDates({...examDates, committee: e.target.value})} className="bg-transparent border-b border-[#8B0000] text-[#8B0000] text-sm focus:outline-none mb-2 font-sans"/>
                  ) : (
                    <span className="text-5xl font-light text-[#8B0000] leading-none transition-transform group-hover:scale-110 duration-500">{getDaysRemaining(examDates.committee)}</span>
                  )}
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#8B0000]/50 mt-2">Comitatus</span>
                </div>
                
                <div className="flex flex-col items-center group">
                  {isEditing ? (
                    <input type="date" value={examDates.final} onChange={(e) => setExamDates({...examDates, final: e.target.value})} className="bg-transparent border-b border-[#D4AF37] text-[#D4AF37] text-sm focus:outline-none mb-2 font-sans"/>
                  ) : (
                    <span className="text-5xl font-light text-[#D4AF37] leading-none transition-transform group-hover:scale-110 duration-500">{getDaysRemaining(examDates.final)}</span>
                  )}
                  <span className="text-[10px] uppercase tracking-[0.3em] text-[#D4AF37]/50 mt-2">Finalis</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Grid System */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((mod) => (
            <Link 
              key={mod.title} 
              href={mod.href} 
              className="group relative p-10 bg-[#0A0A0A]/60 backdrop-blur-sm border border-[#D4AF37]/5 hover:border-[#D4AF37]/30 transition-all duration-700 overflow-hidden"
            >
              {/* Subtle Animated Border Accent */}
              <div className="absolute top-0 left-0 w-[1px] h-0 group-hover:h-full bg-gradient-to-bottom from-transparent via-[#D4AF37]/40 to-transparent transition-all duration-1000"></div>
              
              <h2 className="text-xl font-medium text-[#D4AF37]/80 mb-3 tracking-[0.2em] uppercase group-hover:text-[#D4AF37] group-hover:translate-x-1 transition-all">
                {mod.title}
              </h2>
              <p className="text-[11px] text-[#E0E0E0]/40 leading-relaxed tracking-widest uppercase italic group-hover:text-[#E0E0E0]/70 transition-colors">
                {mod.desc}
              </p>

              {/* Minimalist Decoration */}
              <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-10 transition-opacity duration-700">
                <span className="text-[8px] tracking-[0.5em] text-[#D4AF37]">AD ASTRA</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <footer className="mt-32 pb-12 text-center">
          <div className="w-24 h-px bg-gradient-to-right from-transparent via-[#D4AF37]/20 to-transparent mx-auto mb-8"></div>
          <p className="text-[11px] tracking-[0.6em] uppercase italic text-[#D4AF37]/30 hover:text-[#D4AF37]/60 transition-all duration-1000 cursor-default">
            Memento Mori
          </p>
        </footer>
      </div>
    </main>
  );
}
