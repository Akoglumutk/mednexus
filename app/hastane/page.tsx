'use client'
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Stage = 'STAJYER' | 'INTERN' | 'DHY' | 'UZMAN';
type GameStatus = 'CONTINUE' | 'SUCCESS' | 'FATAL_ERROR' | 'DEATH';

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

interface TabbedOptions {
  ANAMNEZ: string[];
  MUAYENE: string[];
  TETKİK: string[];
  TEDAVİ: string[];
}

export default function DivineHospital() {
  const router = useRouter();
  const [view, setView] = useState<'menu' | 'theatre'>('menu');
  const [stage, setStage] = useState<Stage>('STAJYER');
  const [branch, setBranch] = useState('');
  const [activeTab, setActiveTab] = useState<keyof TabbedOptions>('ANAMNEZ');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Yeni Oyun Durumu ve Seçenek State'leri
  const [status, setStatus] = useState<GameStatus>('CONTINUE');
  const [logs, setLogs] = useState<Log[]>([]);
  const [vitals, setVitals] = useState<Vitals>({ hr: 72, bp: '120/80', temp: 36.6, spo2: 99 });
  const [options, setOptions] = useState<TabbedOptions>({ ANAMNEZ: [], MUAYENE: [], TETKİK: [], TEDAVİ: [] });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const startCase = async () => {
    setView('theatre');
    handleAction("Vakayı Başlat");
  };

  const handleAction = async (actionName: string) => {
    if (isLoading || status !== 'CONTINUE') return;
    setIsLoading(true);

    try {
      console.log("Gönderilen veri:", { action: actionName, stage, branch, vitals });
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
        { role: 'system', text: data.log || "Klinik veri işlendi.", timestamp }
      ]);

      // Kahin'den gelen yeni yapıyı State'e işliyoruz
      if (data.newVitals) setVitals(data.newVitals);
      if (data.options) setOptions(data.options);
      if (data.status) setStatus(data.status);

    } catch (error) {
      console.error("Bağlantı kesildi:", error);
      setLogs(prev => [...prev, { 
        role: 'system', 
        text: "Sinyal kesildi. Kahin'e ulaşılamıyor...", 
        timestamp: "ERR" 
      }]);
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
      
      {/* OYUN BİTİŞ (END STATE) OVERLAY */}
      {status !== 'CONTINUE' && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center p-12 backdrop-blur-md bg-black/80 transition-all duration-1000 animate-in fade-in">
          <h1 className={`text-4xl md:text-6xl font-bold uppercase tracking-[0.3em] mb-6 text-center ${
            status === 'SUCCESS' ? 'text-[#D4AF37] drop-shadow-[0_0_20px_rgba(212,175,55,0.5)]' : 
            'text-[#8B0000] drop-shadow-[0_0_20px_rgba(139,0,0,0.5)]'
          }`}>
            {status === 'SUCCESS' ? 'VAKA ÇÖZÜLDÜ' : status === 'DEATH' ? 'HASTA EX' : 'KLİNİK İHLAL'}
          </h1>
          <p className="text-white/80 text-center max-w-xl text-sm md:text-base leading-relaxed mb-12 italic border-y border-white/10 py-6">
            {logs[logs.length - 1]?.text}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-[10px] text-white/50 border border-white/20 px-8 py-3 uppercase tracking-[0.4em] hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition-all"
          >
            [ YENİ VAKA ]
          </button>
        </div>
      )}

      {/* MONİTÖR ÜST PANEL */}
      <header className="h-20 bg-black border-b border-[#D4AF37]/20 flex justify-between items-center px-8 z-[100] shadow-[0_0_15px_rgba(212,175,55,0.05)]">
        <div className="flex gap-4">
          <button onClick={() => router.push('/')} className="text-[9px] text-[#D4AF37]/60 hover:text-[#D4AF37] border border-[#D4AF37]/20 px-4 py-2 uppercase tracking-widest transition-all hover:bg-[#D4AF37]/5">
            [ TERMİNAL ]
          </button>
        </div>

        <div className="flex bg-[#D4AF37]/5 py-2 rounded-sm border border-white/5 px-2">
          <VitalItem label="HR" value={vitals.hr} unit="bpm" status={vitals.hr > 100 || vitals.hr < 50 ? 'critical' : 'normal'} />
          <VitalItem label="BP" value={vitals.bp} unit="mmHg" status={parseInt(vitals.bp.split('/')[0]) < 90 || parseInt(vitals.bp.split('/')[0]) > 140 ? 'warning' : 'normal'} />
          <VitalItem label="SpO2" value={vitals.spo2} unit="%" status={vitals.spo2 < 94 ? 'critical' : 'normal'} />
          <VitalItem label="TEMP" value={vitals.temp} unit="°C" status={vitals.temp > 38 ? 'warning' : 'normal'} />
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
          <div className="max-w-3xl mx-auto p-12 space-y-12 pb-32">
            {logs.map((log, i) => (
              <div key={i} className={`flex ${log.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[85%] group ${log.role === 'user' ? 'text-right border-r border-[#D4AF37]/40 pr-6' : 'text-left border-l border-[#8B0000]/40 pl-6'}`}>
                  <div className="flex items-center gap-3 mb-2 opacity-30 group-hover:opacity-100 transition-opacity">
                    <span className="text-[7px] uppercase tracking-widest">{log.role === 'user' ? 'Müdahale' : 'Klinik Durum'}</span>
                    <span className="text-[7px] font-mono">{log.timestamp}</span>
                  </div>
                  <p className={`text-[13px] md:text-sm italic leading-relaxed font-light ${log.role === 'system' && status !== 'CONTINUE' && i === logs.length -1 ? 'text-[#8B0000] font-medium' : 'text-white/80'}`}>
                    {log.text}
                  </p>
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
      <footer className={`bg-black border-t border-white/10 p-6 z-[70] backdrop-blur-md transition-opacity duration-500 ${status !== 'CONTINUE' ? 'opacity-20 pointer-events-none' : ''}`}>
        <div className="max-w-4xl mx-auto space-y-6">
          <nav className="flex justify-center gap-8 border-b border-white/5 pb-2">
            {(Object.keys(options) as Array<keyof TabbedOptions>).map((tab) => (
              <button 
                key={tab} 
                onClick={() => setActiveTab(tab)} 
                className={`text-[9px] tracking-[0.3em] uppercase transition-all hover:text-white ${activeTab === tab ? 'text-[#D4AF37] border-b border-[#D4AF37] pb-2' : 'text-white/20'}`}
              >
                {tab}
              </button>
            ))}
          </nav>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 min-h-[100px]">
            {options[activeTab] && options[activeTab].length > 0 ? (
              options[activeTab].map((opt, i) => (
                <button 
                  key={i} 
                  onClick={() => handleAction(opt)} 
                  disabled={isLoading} 
                  className="bg-white/[0.03] border border-white/10 hover:border-[#D4AF37]/50 py-3 px-2 text-[9px] uppercase tracking-[0.1em] text-white/60 hover:text-[#D4AF37] transition-all active:scale-95 disabled:opacity-10 truncate"
                  title={opt}
                >
                  {opt}
                </button>
              ))
            ) : (
              <div className="col-span-full flex items-center justify-center h-full">
                <span className="text-[9px] text-white/20 uppercase tracking-widest italic">Bekleniyor...</span>
              </div>
            )}
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
  const statusConfig: Record<'normal' | 'warning' | 'critical', string> = {
    normal: 'text-[#D4AF37]',
    warning: 'text-orange-500',
    critical: 'text-[#8B0000] animate-pulse drop-shadow-[0_0_8px_rgba(139,0,0,0.8)]'
  };

  const statusClass = statusConfig[status];

  return (
    <div className="flex flex-col items-center px-5 border-r border-white/5 last:border-none transition-colors duration-300">
      <span className="text-[7px] text-white/20 uppercase tracking-widest mb-1">{label}</span>
      <div className={`flex items-baseline gap-1 ${statusClass}`}>
        <span className="text-lg font-bold tabular-nums tracking-tighter">{value}</span>
        <span className="text-[8px] opacity-40 font-light lowercase">{unit}</span>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function MenuView({ stage, setStage, branch, setBranch, onStart }: any) {
  const branches = [
    'MİKROBİYOLOJİ', 'HEMATOLOJİ', 'RADYOLOJİ', 'GÖĞÜS HASTALIKLARI', 
    'KARDİYOLOJİ', 'GASTROENTEROLOJİ', 'ENDOKRİNOLOJİ', 'KADIN DOĞUM', 
    'GENEL CERRAHİ', 'ÜROLOJİ', 'NEFROLOJİ', 'NÖROLOJİ', 'PSİKİYATRİ', 
    'DERMATOLOJİ', 'ADLİ TIP', 'ROMATOLOJİ', 'FTR', 'PEDİATRİ', 'ACİL', 
    'ANESTEZİ', 'ÇOCUK CERRAHİ', 'ÇOCUK PSİKİYATRİ', 'OFTALMOLOJİ', 
    'KBB', 'NÖROŞİRUJİ', 'ORTOPEDİ', 'GERİATRİ', 'KVC', 
    'PLASTİK CERRAHİ', 'NÜKLEER TIP', 'GENETİK', 'RADYASYON ONKOLOJİSİ', 
    'GÖĞÜS CERRAHİSİ', 'DAHİLİYE'
  ];

  return (
    <main className="min-h-screen bg-[#010102] flex items-center justify-center p-6 overflow-y-auto">
      <div className="max-w-2xl w-full border border-[#D4AF37]/20 bg-black/40 p-12 backdrop-blur-xl my-12 shadow-[0_0_50px_rgba(0,0,0,1)] relative overflow-hidden">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#D4AF37]/10 pb-8 mb-12 relative z-10">
          <h1 className="text-[#D4AF37] text-2xl font-bold italic tracking-[0.3em] uppercase text-center underline underline-offset-8 decoration-[#D4AF37]/20">
            Divine Theater
          </h1>
        </header>

        <div className="space-y-12 relative z-10">
          {/* KADEME SEÇİMİ */}
          <section>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] mb-4">Kademeyi Mühürle</p>
            <div className="grid grid-cols-4 gap-2">
              {['STAJYER', 'INTERN', 'DHY', 'UZMAN'].map(s => (
                <button 
                  key={s} 
                  onClick={() => setStage(s)} 
                  className={`py-3 text-[8px] border tracking-widest transition-all ${stage === s ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'border-white/10 text-white/40 hover:border-white/30'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          {/* POLİKLİNİK SEÇİMİ */}
          <section>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] mb-4">Poliklinik Seçimi</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-[350px] overflow-y-auto pr-4 custom-scrollbar">
              {branches.map(b => (
                <button 
                  key={b} 
                  onClick={() => setBranch(b)} 
                  className={`py-3 text-[8px] border transition-all truncate px-2 tracking-tighter ${branch === b ? 'border-[#8B0000] text-[#8B0000] bg-[#8B0000]/5 shadow-[inset_0_0_10px_rgba(139,0,0,0.2)]' : 'border-white/5 text-white/20 hover:text-white/50 hover:border-white/10'}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </section>

          <button 
            onClick={onStart} 
            disabled={!branch} 
            className="w-full bg-[#D4AF37] text-black py-5 font-bold uppercase text-[10px] tracking-[0.5em] disabled:opacity-10 transition-all hover:bg-[#D4AF37]/90 active:scale-95 shadow-[0_0_30px_rgba(212,175,55,0.15)]"
          >
            SAHNEYİ AÇ
          </button>
        </div>
      </div>
    </main>
  );
}
