'use client'
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Stage = 'STAJYER' | 'INTERN' | 'DHY' | 'UZMAN';
interface Log { 
  role: 'system' | 'user'; 
  text: string; 
  timestamp: string;
}

interface Vitals {
  hr: number;
  bp: string;
  temp: number;
  spo2: number;
}

export default function DivineHospital() {
  const router = useRouter();
  const [view, setView] = useState<'menu' | 'theatre'>('menu');
  const [stage, setStage] = useState<Stage>('STAJYER');
  const [branch, setBranch] = useState('');
  const [activeTab, setActiveTab] = useState<'ANAMNEZ' | 'MUAYENE' | 'TETKİK' | 'TEDAVİ'>('ANAMNEZ');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const [logs, setLogs] = useState<Log[]>([]);
  const [vitals, setVitals] = useState<Vitals>({ hr: 72, bp: '120/80', temp: 36.6, spo2: 99 });
  const [options, setOptions] = useState<string[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  const startCase = async () => {
    setView('theatre');
    handleAction("Vakayı Başlat");
  };

  const handleAction = async (actionName: string) => {
    if (isLoading) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/hastane/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionName, stage, branch, vitals, history: logs })
      });

      if (!res.ok) throw new Error('Klinik Hatası');
      const data = await res.json();
      
      const timestamp = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      
      setLogs(prev => [
        ...prev, 
        { role: 'user', text: actionName, timestamp }, 
        { role: 'system', text: data.log, timestamp }
      ]);

      if (data.newVitals) setVitals(data.newVitals);
      if (data.options) setOptions(data.options);
    } catch (error) {
      console.error("Bağlantı kesildi:", error);
      setLogs(prev => [...prev, { role: 'system', text: "Sinyal kesildi. Kahin'e ulaşılamıyor...", timestamp: "ERR" }]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [logs]);

  if (view === 'menu') {
    return <MenuView stage={stage} setStage={setStage} branch={branch} setBranch={setBranch} onStart={startCase} />;
  }

  return (
    <main className="fixed inset-0 bg-[#010102] flex flex-col font-serif select-none overflow-hidden text-slate-200">
      {/* MONİTÖR ÜST PANEL */}
      <header className="h-20 bg-black border-b border-[#D4AF37]/20 flex justify-between items-center px-8 z-[100] shadow-[0_0_15px_rgba(212,175,55,0.05)]">
        <div className="flex gap-4">
          <button onClick={() => router.push('/')} className="text-[9px] text-[#D4AF37]/60 hover:text-[#D4AF37] border border-[#D4AF37]/20 px-4 py-2 uppercase tracking-widest transition-all hover:bg-[#D4AF37]/5">
            [ TERMİNAL ]
          </button>
        </div>

        <div className="flex bg-[#D4AF37]/5 py-2 rounded-sm border border-white/5 px-2">
          <VitalItem label="HR" value={vitals.hr} unit="bpm" status={vitals.hr > 100 || vitals.hr < 50 ? 'critical' : 'normal'} />
          <VitalItem label="BP" value={vitals.bp} unit="mmHg" />
          <VitalItem label="SpO2" value={vitals.spo2} unit="%" status={vitals.spo2 < 94 ? 'warning' : 'normal'} />
          <VitalItem label="TEMP" value={vitals.temp} unit="°C" />
        </div>

        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-[9px] text-white/40 uppercase tracking-widest border border-white/10 px-4 py-2 hover:bg-white/5 transition-all">
          {isSidebarOpen ? '[ Kapat ]' : '[ Arşiv ]'}
        </button>
      </header>

      <section className="flex-1 relative flex overflow-hidden">
        {/* SIDEBAR */}
        <aside className={`absolute left-0 top-0 bottom-0 z-[60] w-80 bg-black/95 border-r border-[#D4AF37]/20 transform transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} p-8 shadow-2xl`}>
          <h2 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.4em] mb-10 opacity-50 underline underline-offset-8">Klinik Protokol</h2>
          <div className="space-y-8 text-sm italic text-white/60 leading-relaxed">
             <div>
               <span className="text-[8px] block mb-2 text-[#D4AF37]/40 uppercase tracking-widest">Aktif Branş</span>
               <p className="text-white font-medium">{branch}</p>
             </div>
             <div>
               <span className="text-[8px] block mb-2 text-[#D4AF37]/40 uppercase tracking-widest">Hekim Yetkisi</span>
               <p className="text-white font-medium">{stage}</p>
             </div>
             <div className="pt-4 border-t border-white/5">
                <p className="text-[9px] opacity-30 tracking-tighter">Vaka verileri Kahin mühürüyle kriptolanmıştır. Yanlış müdahale hekim sorumluluğundadır.</p>
             </div>
          </div>
        </aside>

        {/* LOG AKIŞI */}
        <div className="flex-1 overflow-y-auto scrollbar-hide bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#050505] to-[#010102]" ref={scrollRef}>
          <div className="max-w-3xl mx-auto p-12 space-y-12">
            {logs.map((log, i) => (
              <div key={i} className={`flex ${log.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] group ${log.role === 'user' ? 'text-right border-r border-[#D4AF37]/40 pr-6' : 'text-left border-l border-[#8B0000]/40 pl-6'}`}>
                  <div className="flex items-center gap-3 mb-2 opacity-30 group-hover:opacity-100 transition-opacity">
                    <span className="text-[7px] uppercase tracking-widest">{log.role === 'user' ? 'Müdahale' : 'Klinik Durum'}</span>
                    <span className="text-[7px] font-mono">{log.timestamp}</span>
                  </div>
                  <p className="text-[13px] md:text-sm italic text-white/80 leading-relaxed font-light">{log.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-center p-4">
                <span className="text-[9px] text-[#D4AF37] animate-pulse uppercase tracking-[0.4em]">Kahin Analiz Ediyor...</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ALT AKSİYON PANELİ */}
      <footer className="bg-black border-t border-white/10 p-6 z-[70] backdrop-blur-md">
        <div className="max-w-4xl mx-auto space-y-6">
          <nav className="flex justify-center gap-8 border-b border-white/5 pb-2">
            {['ANAMNEZ', 'MUAYENE', 'TETKİK', 'TEDAVİ'].map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab as any)} 
                className={`text-[9px] tracking-[0.3em] uppercase transition-all hover:text-white ${activeTab === tab ? 'text-[#D4AF37] border-b border-[#D4AF37] pb-2' : 'text-white/20'}`}
              >
                {tab}
              </button>
            ))}
          </nav>
          <div className="grid grid-cols-2 gap-3">
            {options.map((opt, i) => (
              <button 
                key={i} 
                onClick={() => handleAction(opt)} 
                disabled={isLoading} 
                className="bg-white/[0.03] border border-white/10 hover:border-[#D4AF37]/50 py-4 text-[9px] uppercase tracking-[0.2em] text-white/50 hover:text-[#D4AF37] transition-all active:scale-95 disabled:opacity-10"
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

// app/hastane/page.tsx içindeki VitalItem bileşeni

interface VitalItemProps {
  label: string;
  value: string | number;
  unit: string;
  status?: 'normal' | 'warning' | 'critical';
}

function VitalItem({ label, value, unit, status = 'normal' }: VitalItemProps) {
  // Nesneyi bir sabit olarak tanımlayıp tipini belirtiyoruz
  const statusConfig: Record<'normal' | 'warning' | 'critical', string> = {
    normal: 'text-[#D4AF37]',
    warning: 'text-orange-500',
    critical: 'text-[#8B0000] animate-pulse'
  };

  const statusClass = statusConfig[status];

  return (
    <div className="flex flex-col items-center px-5 border-r border-white/5 last:border-none">
      <span className="text-[7px] text-white/20 uppercase tracking-widest mb-1">{label}</span>
      <div className={`flex items-baseline gap-1 ${statusClass}`}>
        <span className="text-lg font-bold tabular-nums tracking-tighter">{value}</span>
        <span className="text-[8px] opacity-40 font-light lowercase">{unit}</span>
      </div>
    </div>
  );
}


function MenuView({ stage, setStage, branch, setBranch, onStart }: any) {
  const branches = ['KARDİYOLOJİ', 'GÖĞÜS HASTALIKLARI', 'ACİL TIP', 'DAHİLİYE', 'NÖROLOJİ', 'GENEL CERRAHİ', 'PEDİATRİ', 'KADIN DOĞUM'];

  return (
    <main className="min-h-screen bg-[#010102] flex items-center justify-center p-6">
      <div className="max-w-xl w-full border border-[#D4AF37]/20 bg-black/60 p-10 backdrop-blur-xl shadow-2xl">
        <h1 className="text-[#D4AF37] text-xl font-bold tracking-[0.5em] uppercase text-center mb-12 border-b border-[#D4AF37]/10 pb-6">Divine Theater</h1>
        
        <div className="space-y-10">
          <div>
            <p className="text-[8px] text-white/30 uppercase tracking-[0.3em] mb-4 text-center">Hekimlik Seviyesi</p>
            <div className="grid grid-cols-4 gap-2">
              {['STAJYER', 'INTERN', 'DHY', 'UZMAN'].map(s => (
                <button key={s} onClick={() => setStage(s)} className={`py-3 text-[8px] border tracking-widest transition-all ${stage === s ? 'bg-[#D4AF37] text-black border-[#D4AF37]' : 'border-white/10 text-white/30 hover:border-white/20'}`}>{s}</button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-[8px] text-white/30 uppercase tracking-[0.3em] mb-4 text-center">Poliklinik</p>
            <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
              {branches.map(b => (
                <button key={b} onClick={() => setBranch(b)} className={`py-3 text-[8px] border transition-all ${branch === b ? 'border-[#D4AF37] text-[#D4AF37]' : 'border-white/5 text-white/20 hover:bg-white/5'}`}>{b}</button>
              ))}
            </div>
          </div>

          <button 
            onClick={onStart} 
            disabled={!branch} 
            className="w-full bg-[#D4AF37] text-black py-4 font-bold uppercase text-[10px] tracking-[0.5em] disabled:opacity-20 transition-all hover:tracking-[0.6em]"
          >
            SİMÜLASYONU BAŞLAT
          </button>
        </div>
      </div>
    </main>
  );
}
