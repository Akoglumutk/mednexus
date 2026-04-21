'use client'
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Stage = 'STAJYER' | 'INTERN' | 'DHY' | 'UZMAN';
interface Log { role: 'system' | 'user'; text: string; }

export default function DivineHospital() {
  const router = useRouter();
  const [view, setView] = useState<'menu' | 'theatre'>('menu');
  const [stage, setStage] = useState<Stage>('STAJYER');
  const [branch, setBranch] = useState('');
  const [activeTab, setActiveTab] = useState<'ANAMNEZ' | 'MUAYENE' | 'TETKİK' | 'TEDAVİ'>('ANAMNEZ');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [logs, setLogs] = useState<Log[]>([]);
  const [vitals, setVitals] = useState({ hr: 72, bp: '120/80', temp: 36.6, spo2: 99 });
  const [options, setOptions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const startCase = async () => {
    setView('theatre');
    handleAction("Vakayı Başlat");
  };

  const handleAction = async (actionName: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/hastane/action', {
        method: 'POST',
        body: JSON.stringify({ action: actionName, stage, branch, vitals, history: logs })
      });
      const data = await res.json();
      
      setLogs(prev => [...prev, { role: 'user', text: actionName }, { role: 'system', text: data.log }]);
      if (data.newVitals) setVitals(data.newVitals);
      if (data.options) setOptions(data.options);
    } catch (error) {
      console.error("Klinik bağlantı hatası:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [logs]);

  if (view === 'menu') {
    return <MenuView stage={stage} setStage={setStage} branch={branch} setBranch={setBranch} onStart={startCase} />;
  }

  return (
    <main className="fixed inset-0 bg-[#010102] flex flex-col font-serif select-none overflow-hidden">
      {/* DIVINE HEADER: Monitör + Navigasyon */}
      <header className="h-20 bg-black/80 border-b border-[#D4AF37]/10 flex justify-between items-center px-8 backdrop-blur-md z-[100] monitor-scan">
        <div className="flex gap-4">
          <button 
            onClick={() => router.push('/')} 
            className="text-[9px] text-[#D4AF37]/40 hover:text-[#D4AF37] border border-[#D4AF37]/10 px-4 py-2 uppercase tracking-widest bg-white/5 transition-all"
          >
            [ ANA KAPI ]
          </button>
          <button 
            onClick={() => setView('menu')} 
            className="text-[9px] text-white/20 hover:text-white border border-white/5 px-4 py-2 uppercase tracking-widest transition-all"
          >
            [ GERİ ]
          </button>
        </div>

        <div className="flex bg-white/[0.02] py-2 rounded-sm px-4">
          <VitalItem label="HR" value={vitals.hr} unit="bpm" status={vitals.hr > 100 ? 'critical' : 'normal'} />
          <VitalItem label="BP" value={vitals.bp} unit="mmHg" />
          <VitalItem label="SpO2" value={vitals.spo2} unit="%" status={vitals.spo2 < 94 ? 'warning' : 'normal'} />
          <VitalItem label="TEMP" value={vitals.temp} unit="°C" />
        </div>

        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-[9px] text-white/40 uppercase tracking-widest border border-white/10 px-4 py-2 hover:bg-white/5 transition-all">
          {isSidebarOpen ? '[ Kapat ]' : '[ Dosya ]'}
        </button>
      </header>

      <section className="flex-1 relative flex overflow-hidden">
        {/* HASTA DOSYASI (Sidebar) */}
        <aside className={`absolute left-0 top-0 bottom-0 z-[60] w-80 bg-black/95 border-r border-[#D4AF37]/20 transform transition-transform duration-500 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} p-8 shadow-2xl overflow-y-auto`}>
          <h2 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.4em] mb-10 opacity-50 underline underline-offset-8">Klinik Arşiv</h2>
          <div className="space-y-8 text-sm italic text-white/60 leading-relaxed font-light">
             <div>
               <span className="text-[8px] block mb-2 text-[#D4AF37]/40 uppercase tracking-widest">Branş Kapsamı</span>
               <p>{branch}</p>
             </div>
             <div>
               <span className="text-[8px] block mb-2 text-[#D4AF37]/40 uppercase tracking-widest">Hekim Kademesi</span>
               <p>{stage}</p>
             </div>
             <p className="text-[10px] opacity-40 border-t border-white/5 pt-4">Bu dosya Kahin tarafından gerçek zamanlı olarak mühürlenmektedir.</p>
          </div>
        </aside>

        {/* AKIŞ ALANI (Logs) */}
        <div className="flex-1 overflow-y-auto scrollbar-hide" ref={scrollRef}>
          <div className="max-w-3xl mx-auto p-12 space-y-10">
            {logs.map((log, i) => (
              <div key={i} className={`flex ${log.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-4 duration-500`}>
                <div className={`max-w-[85%] p-5 border-b border-white/5 ${log.role === 'user' ? 'text-right border-r-2 border-[#D4AF37] pr-6' : 'text-left border-l-2 border-[#8B0000] pl-6 bg-white/[0.01]'}`}>
                  <span className="text-[7px] uppercase tracking-widest block mb-2 opacity-30">{log.role === 'user' ? 'Müdahale' : 'Klinik Durum'}</span>
                  <p className="text-sm italic text-white/70 leading-relaxed">{log.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-center p-4">
                <span className="text-[9px] text-[#D4AF37] animate-pulse uppercase tracking-[0.3em]">Kahin Analiz Ediyor...</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* AKSİYON PANELİ */}
      <footer className="bg-black/80 border-t border-white/5 p-6 pb-12 z-[70] backdrop-blur-xl">
        <div className="max-w-4xl mx-auto space-y-6">
          <div className="flex justify-center gap-8 border-b border-white/5 pb-2">
            {['ANAMNEZ', 'MUAYENE', 'TETKİK', 'TEDAVİ'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)} 
                className={`text-[10px] tracking-[0.3em] uppercase transition-all ${activeTab === tab ? 'text-[#D4AF37] border-b border-[#D4AF37] pb-2' : 'text-white/20'}`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-4">
            {options.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => handleAction(opt)} 
                disabled={isLoading} 
                className="bg-white/[0.02] border border-white/5 hover:border-[#D4AF37]/30 py-5 text-[9px] uppercase tracking-widest text-white/40 hover:text-white transition-all active:scale-95 disabled:opacity-10"
              >
                {opt}
              </button>
            ))}
          </div>
        </div>
      </footer>
    </main>
  );
}

// YARDIMCI BİLEŞENLER
function VitalItem({ label, value, unit, status = 'normal' }: any) {
  const colorMap: any = {
    normal: 'text-[#D4AF37]',
    warning: 'text-orange-500',
    critical: 'text-[#8B0000] vital-pulse'
  };

  return (
    <div className="flex flex-col items-center px-6 border-r border-white/5 last:border-none">
      <span className="text-[7px] text-white/20 uppercase tracking-[0.3em] mb-1">{label}</span>
      <div className={`flex items-baseline gap-1 ${colorMap[status]} vital-glow`}>
        <span className="text-xl font-bold tabular-nums tracking-tighter">{value}</span>
        <span className="text-[8px] opacity-40 font-light lowercase">{unit}</span>
      </div>
    </div>
  );
}

function MenuView({ stage, setStage, branch, setBranch, onStart }: any) {
  const router = useRouter();
  const branches = ['MİKROBİYOLOJİ', 'HEMATOLOJİ', 'RADYOLOJİ', 'GÖĞÜS HASTALIKLARI', 'KARDİYOLOJİ', 'GASTROENTEROLOJİ', 'ENDROKRİNOLOJİ', 'KADIN DOĞUM', 'GENEL CERRAHİ', 'ÜROLOJİ', 'NEFROLOJİ', 'NÖROLOJİ', 'PSİKİYATRİ', 'DERMATOLOJİ', 'ADLİ TIP', 'ROMATOLOJİ', 'FTR', 'PEDİATRİ', 'ACİL', 'ANESTEZİ', 'ÇOCUK CERRAHİ', 'ÇOCUK PSİKİYATRİ', 'OFTALMOLOJİ', 'KBB', 'NÖROŞİRUJİ', 'ORTOPEDİ', 'GERİATRİ', 'KVC', 'PLASTİK CERRAHİ', 'NÜKLEE TIP', 'GENETİK', 'RADYASYON ONKOLOJİSİ', 'GÖĞÜS CERRAHİSİ'];

  return (
    <main className="min-h-screen bg-[#010102] flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-2xl w-full border border-[#D4AF37]/20 bg-black/40 p-12 backdrop-blur-xl my-12">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#D4AF37]/10 pb-8 mb-12">
          <h1 className="text-[#D4AF37] text-2xl font-bold italic tracking-[0.3em] uppercase text-center underline underline-offset-8">Divine Theater</h1>
          <button 
            onClick={() => router.push('/')}
            className="text-[10px] text-[#D4AF37]/50 hover:text-[#D4AF37] transition-all uppercase tracking-widest border border-[#D4AF37]/10 px-4 py-2 bg-white/5"
          >
            [ Ana Kapı ]
          </button>
        </header>

        <div className="space-y-12">
          <section>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] mb-4">Kademeyi Mühürle</p>
            <div className="grid grid-cols-4 gap-2">
              {(['STAJYER', 'INTERN', 'DHY', 'UZMAN'] as Stage[]).map(s => (
                <button key={s} onClick={() => setStage(s)} className={`py-3 text-[8px] border tracking-widest transition-all ${stage === s ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'border-white/10 text-white/40'}`}>{s}</button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] mb-4">Poliklinik Seçimi</p>
            <div className="grid grid-cols-3 gap-3">
              {branches.map(b => (
                <button key={b} onClick={() => setBranch(b)} className={`py-3 text-[8px] border transition-all truncate px-2 ${branch === b ? 'border-[#8B0000] text-[#8B0000]' : 'border-white/5 text-white/20'}`}>{b}</button>
              ))}
            </div>
          </section>

          <button 
            onClick={onStart} 
            disabled={!branch} 
            className="w-full bg-[#D4AF37] text-black py-4 font-bold uppercase text-[10px] tracking-[0.5em] disabled:opacity-10 transition-all hover:bg-[#D4AF37]/90 active:scale-95 shadow-[0_0_20px_rgba(212,175,55,0.1)]"
          >
            SAHNEYİ AÇ
          </button>
        </div>
      </div>
    </main>
  );
}