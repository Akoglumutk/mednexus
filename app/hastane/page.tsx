'use client'
import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';

type Stage = 'STAJYER' | 'INTERN' | 'DHY' | 'UZMAN';
type GameStatus = 'CONTINUE' | 'SUCCESS' | 'FATAL_ERROR' | 'DEATH' | 'FAILED';

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
  
  // Konsültasyon Modalı State'leri
  const [isConsultOpen, setIsConsultOpen] = useState(false);
  const [targetConsult, setTargetConsult] = useState('');
  const [consultantNote, setConsultantNote] = useState<string | null>(null);
  const [isConsultLoading, setIsConsultLoading] = useState(false);

  const [showDecisionMenu, setShowDecisionMenu] = useState(false);

  // Gelişmiş İptal Onay State'i (DivinePrompt İçin)
  const [isCancelPromptOpen, setIsCancelPromptOpen] = useState(false);

  // GOTİK POMODORO TIMER STATE'LERİ
  const [seconds, setSeconds] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(true);

  // Gated Checklist State'i
  const [checklist, setChecklist] = useState({
    hasEKG: false,
    hasAspirin: false,
    hasBypass: false
  });
  
  const [status, setStatus] = useState<GameStatus>('CONTINUE');
  const [logs, setLogs] = useState<Log[]>([]);
  const [vitals, setVitals] = useState<Vitals>({ hr: 72, bp: '120/80', temp: 36.6, spo2: 99 });
  const [options, setOptions] = useState<TabbedOptions>({ ANAMNEZ: [], MUAYENE: [], TETKİK: [], TEDAVİ: [] });
  
  const scrollRef = useRef<HTMLDivElement>(null);

  // Pomodoro Akış Motoru
  useEffect(() => {
    let interval: any = null;
    if (isTimerActive && view === 'theatre' && status === 'CONTINUE') {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerActive, view, status]);

  const formatTime = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startCase = async () => {
    setView('theatre');
    setSeconds(0);
    setIsTimerActive(true);
    handleAction("Vakayı Başlat");
  };

  const handleAction = async (actionName: string) => {
    if (isLoading || status !== 'CONTINUE') return;
    setIsLoading(true);

    let updatedChecklist = { ...checklist };
    if (actionName === "EKG") updatedChecklist.hasEKG = true;
    if (actionName === "Aspirin") updatedChecklist.hasAspirin = true;
    if (actionName === "Koroner bypass ameliyatı") updatedChecklist.hasBypass = true;
    setChecklist(updatedChecklist);

    const checklistProgress = {
      step1Done: updatedChecklist.hasEKG,
      step2Done: updatedChecklist.hasEKG && updatedChecklist.hasAspirin && updatedChecklist.hasBypass
    };

    const formattedHistory = logs.map(l => ({
      role: l.role,
      text: l.text
    }));

    try {
      const res = await fetch('/api/hastane/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: actionName, 
          stage, 
          branch, 
          vitals, 
          history: formattedHistory, 
          turnCount: logs.length + 1,
          checklistProgress
        })
      });

      if (!res.ok) throw new Error('Klinik Hatası');
      const data = await res.json();
      
      const timestamp = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      
      setLogs(prev => [
        ...prev, 
        { role: 'user', text: actionName, timestamp }, 
        { role: 'system', text: data.log || "Klinik veri işlendi.", timestamp }
      ]);

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

  const handleConsultRequest = async () => {
    if (!targetConsult || isConsultLoading) return;
    setIsConsultLoading(true);
    setConsultantNote(null);

    try {
      const res = await fetch('/api/hastane/consult', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branch,
          targetConsult,
          vitals,
          history: logs.slice(-4).map(l => l.text),
          currentLog: logs[logs.length - 1]?.text || ""
        })
      });

      const data = await res.json();
      const noteFromApi = data.consultantNote || data.note || data.message || "Vakayı daha derinlemesine incelemeniz gerekiyor.";
      setConsultantNote(noteFromApi);
      
      const timestamp = new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
      
      setLogs(prev => [
        ...prev,
        { role: 'user', text: `[Konsültasyon Talebi: ${targetConsult}]`, timestamp },
        { role: 'system', text: `Hoca Notu (${targetConsult}): "${noteFromApi}"`, timestamp }
      ]);

    } catch (error) {
      console.error("Konsültasyon hatası:", error);
      setConsultantNote("Bağlantı hatası: Kıdemli hekime ulaşılamıyor.");
    } finally {
      setIsConsultLoading(false);
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
      
      {/* İPTAL ET / GERİ ÇEKİL DİNAMİK PROMPT KATMANI */}
      <DivinePrompt 
        isOpen={isCancelPromptOpen}
        type="confirm"
        title="Klinik simülasyon yarıda kesilecek ve nöbet odasına dönülecektir. Emin misin hekim?"
        onConfirm={() => {
          setIsCancelPromptOpen(false);
          setView('menu');
          setLogs([]);
          setStatus('CONTINUE');
        }}
        onCancel={() => setIsCancelPromptOpen(false)}
      />

      {/* OYUN BİTİŞ (END STATE) OVERLAY */}
      {status !== 'CONTINUE' && (
        <div className="absolute inset-0 z-[200] flex flex-col items-center justify-center p-6 md:p-12 backdrop-blur-md bg-black/85 transition-all duration-1000 animate-in fade-in">
          <h1 className={`text-3xl md:text-6xl font-bold uppercase tracking-[0.2em] md:tracking-[0.3em] mb-6 text-center ${
            status === 'SUCCESS' ? 'text-[#D4AF37] drop-shadow-[0_0_20px_rgba(212,175,55,0.5)]' : 
            status === 'FAILED' ? 'text-amber-600 drop-shadow-[0_0_20px_rgba(217,119,6,0.4)]' :
            'text-[#8B0000] drop-shadow-[0_0_20px_rgba(139,0,0,0.5)]'
          }`}>
            {status === 'SUCCESS' ? 'VAKA ÇÖZÜLDÜ' : status === 'FAILED' ? 'YETERSİZ KLİNİK TAKİP' : status === 'DEATH' ? 'HASTA EX' : 'KLİNİK İHLAL'}
          </h1>
          <p className="text-white/80 text-center max-w-xl text-xs md:text-base leading-relaxed mb-12 italic border-y border-white/10 py-6 px-2 font-sans">
            {logs[logs.length - 1]?.text}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="text-[10px] text-white/50 border border-white/20 px-8 py-3 uppercase tracking-[0.4em] hover:bg-[#D4AF37] hover:text-black hover:border-[#D4AF37] transition-all font-mono rounded-sm"
          >
            [ YENİ VAKA ]
          </button>
        </div>
      )}

      {/* KONSÜLTASYON MODAL OVERLAY */}
      {isConsultOpen && (
        <div className="absolute inset-0 z-[150] flex items-center justify-center p-4 md:p-0 backdrop-blur-sm bg-black/70 animate-in fade-in">
          <div className="w-full max-w-md bg-[#050505] border border-[#D4AF37]/30 p-6 md:p-8 shadow-2xl relative rounded-sm">
            <button 
              onClick={() => { setIsConsultOpen(false); setConsultantNote(null); }} 
              className="absolute top-4 right-4 text-[10px] text-white/30 hover:text-white transition-colors font-mono"
            >
              [X] CLOSE
            </button>
            <h3 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.3em] mb-6 border-b border-white/5 pb-2 font-mono">Kıdemli Konsültasyon</h3>
            
            <p className="text-[9px] text-white/40 uppercase tracking-widest mb-2 font-mono">Uzman Branş Seç</p>
            <select 
              value={targetConsult} 
              onChange={(e) => setTargetConsult(e.target.value)}
              className="w-full bg-black border border-white/10 p-3 text-xs text-white/80 focus:border-[#D4AF37] outline-none mb-6 font-mono rounded-sm"
            >
              <option value="">-- SEÇİNİZ --</option>
              <option value="KARDİYOLOJİ">KARDİYOLOJİ HOCASI</option>
              <option value="KVC">KVC (KALP DAMAR CERRAHİSİ)</option>
              <option value="GENEL CERRAHİ">GENEL CERRAHİ</option>
              <option value="ACİL TIP">ACİL TIP ANABİLİM DALI</option>
              <option value="RADYOLOJİ">RADYOLOJİ UZMANI</option>
            </select>

            <button
              onClick={handleConsultRequest}
              disabled={!targetConsult || isConsultLoading}
              className="w-full bg-[#8B0000] text-white text-[9px] tracking-[0.3em] py-3 uppercase font-bold hover:bg-[#8B0000]/80 disabled:opacity-20 transition-all mb-4 font-mono rounded-sm"
            >
              {isConsultLoading ? 'KRİPTO SİNYAL GÖNDERİLİYOR...' : 'KONSÜLTASYON ÇAĞRISI AT'}
            </button>

            {consultantNote && (
              <div className="mt-4 p-4 bg-[#8B0000]/5 border border-[#8B0000]/20 rounded-sm">
                <span className="text-[7px] block text-[#8B0000] uppercase tracking-widest mb-1 font-mono">Gelen Yanıt:</span>
                <p className="text-xs italic text-white/80 font-light leading-relaxed font-sans">"{consultantNote}"</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MONİTÖR ÜST PANEL */}
      <header className="h-20 bg-black border-b border-white/5 flex justify-between items-center px-4 md:px-8 z-[100] shadow-[0_0_15px_rgba(212,175,55,0.05)]">
        <div className="flex gap-2 font-mono">
          <button onClick={() => setIsCancelPromptOpen(true)} className="text-[8px] md:text-[9px] text-[#8B0000] border border-[#8B0000]/20 px-3 py-2 uppercase tracking-widest transition-all hover:bg-[#8B0000]/10 rounded-sm">
            [ İPTAL / ACİL ÇIKIŞ ]
          </button>
          <button 
            onClick={() => setIsConsultOpen(true)} 
            className="text-[8px] md:text-[9px] text-[#D4AF37] hover:text-amber-400 border border-[#D4AF37]/20 px-3 py-2 uppercase tracking-widest transition-all bg-[#D4AF37]/5 hover:bg-[#D4AF37]/10 rounded-sm"
          >
            [ KONSÜLTAN ]
          </button>
        </div>

        {/* VİTAL PANEL */}
        <div className="flex bg-white/[0.02] py-1 md:py-1.5 rounded-sm border border-white/5 px-1 md:px-2 font-mono">
          <VitalItem label="HR" value={vitals.hr} unit="bpm" status={vitals.hr > 100 || vitals.hr < 50 ? 'critical' : 'normal'} />
          <VitalItem label="BP" value={vitals.bp} unit="mmHg" status={parseInt(vitals.bp.split('/')[0]) < 90 || parseInt(vitals.bp.split('/')[0]) > 140 ? 'warning' : 'normal'} />
          <VitalItem label="SpO2" value={vitals.spo2} unit="%" status={vitals.spo2 < 94 ? 'critical' : 'normal'} />
          <VitalItem label="TEMP" value={vitals.temp} unit="°C" status={vitals.temp > 38 ? 'warning' : 'normal'} />
          
          {/* GOTİK KUM SAATİ (WIDGET INTEGRATION) */}
          <div className="flex flex-col items-center px-3 md:px-4 ml-2 border-l border-white/10 select-none">
            <span className="text-[6px] text-[#D4AF37]/40 uppercase tracking-widest mb-0.5">KUM SAATİ</span>
            <div className="flex items-center gap-1.5 text-[#D4AF37] font-bold text-xs md:text-sm">
              <span className={`w-1 h-1 rounded-full bg-[#D4AF37] ${isTimerActive && status === 'CONTINUE' ? 'animate-ping' : 'opacity-40'}`} />
              <span className="tabular-nums">{formatTime(seconds)}</span>
            </div>
          </div>
        </div>

        <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="text-[8px] md:text-[9px] text-white/40 uppercase tracking-widest border border-white/10 px-3 py-2 hover:bg-white/5 transition-all font-mono rounded-sm">
          {isSidebarOpen ? '[ Kpt ]' : '[ Protokol ]'}
        </button>
      </header>

      {/* KLİNİK TİYATRO AKIŞ SAHNESİ */}
      <section className="flex-1 relative flex overflow-hidden h-[calc(100vh-160px)]">
        {/* SIDEBAR */}
        <aside className={`absolute left-0 top-0 bottom-0 z-[60] w-72 md:w-80 bg-black/95 border-r border-white/5 transform transition-transform duration-500 ease-in-out ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} p-6 md:p-8 shadow-2xl font-mono`}>
          <h2 className="text-[#D4AF37] text-[10px] uppercase tracking-[0.4em] mb-10 opacity-50 underline underline-offset-8">Klinik Protokol</h2>
          <div className="space-y-8 text-sm italic text-white/60 leading-relaxed font-serif">
             <div>
               <span className="text-[8px] block mb-2 text-[#D4AF37]/40 uppercase tracking-widest font-mono">Aktif Branş</span>
               <p className="text-white font-medium text-xs md:text-sm">{branch}</p>
             </div>
             <div>
               <span className="text-[8px] block mb-2 text-[#D4AF37]/40 uppercase tracking-widest font-mono">Hekim Yetkisi</span>
               <p className="text-white font-medium text-xs md:text-sm">{stage}</p>
             </div>
             <div className="pt-4 border-t border-white/5 font-mono">
                <p className="text-[8px] opacity-30 tracking-tight">Vaka verileri Kahin mühürüyle kriptolanmıştır. Yanlış müdahale tamamen hekim sorumluluğundadır.</p>
             </div>
          </div>
        </aside>

        {/* LOG AKIŞI (Bağımsız Kaydırma Alanı Kilitlendi) */}
        <div className="flex-1 overflow-y-auto bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-[#050505] to-[#010102] h-full" ref={scrollRef}>
          <div className="max-w-3xl mx-auto p-6 md:p-12 space-y-8 md:space-y-12 pb-36 font-serif">
            {logs.map((log, i) => (
              <div key={i} className={`flex ${log.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                <div className={`max-w-[90%] md:max-w-[85%] group ${log.role === 'user' ? 'text-right border-r border-[#D4AF37]/40 pr-4 md:pr-6' : 'text-left border-l border-[#8B0000]/40 pl-4 md:pl-6'}`}>
                  <div className="flex items-center gap-3 mb-2 opacity-30 group-hover:opacity-100 transition-opacity justify-start group-[.text-right]:justify-end font-mono">
                    <span className="text-[7px] uppercase tracking-widest">{log.role === 'user' ? 'Müdahale' : 'Klinik Durum'}</span>
                    <span className="text-[7px] font-mono">{log.timestamp}</span>
                  </div>
                  <p className={`text-xs md:text-sm italic leading-relaxed font-light ${log.role === 'system' && status !== 'CONTINUE' && i === logs.length -1 ? 'text-[#8B0000] font-medium' : 'text-white/80'}`}>
                    {log.text}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-center p-4 font-mono">
                <span className="text-[9px] text-[#D4AF37] animate-pulse uppercase tracking-[0.4em]">Kahin Analiz Ediyor...</span>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ALT AKSİYON PANELİ */}
      <footer className={`bg-black border-t border-white/5 p-4 md:p-6 z-[70] backdrop-blur-md shrink-0 ${status !== 'CONTINUE' ? 'opacity-20 pointer-events-none' : ''}`}>
        <div className="max-w-4xl mx-auto space-y-4">
    
          <div className="flex justify-between items-center border-b border-white/5 pb-2 font-mono">
             <nav className="flex gap-4 overflow-x-auto scrollbar-hide">
              {(Object.keys(options) as Array<keyof TabbedOptions>).map((tab) => (
                <button 
                  key={tab} 
                  type="button"
                  onClick={() => { setActiveTab(tab); setShowDecisionMenu(false); }} 
                  className={`text-[8px] md:text-[9px] tracking-[0.2em] uppercase transition-all whitespace-nowrap ${!showDecisionMenu && activeTab === tab ? 'text-[#D4AF37] border-b border-[#D4AF37] pb-1' : 'text-white/20'}`}
                >
                  {tab}
                </button>
              ))}
            </nav>

            <button
              type="button"
              onClick={() => setShowDecisionMenu(!showDecisionMenu)}
              className={`text-[8px] md:text-[9px] tracking-[0.2em] uppercase px-3 py-1.5 border transition-all ${showDecisionMenu ? 'bg-[#8B0000] border-[#8B0000] text-white animate-pulse' : 'border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/5'}`}
            >
              [ KARAR VER ]
            </button>
          </div>

          {/* SEÇENEKLER BUTON MATRİSİ */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 min-h-[100px]">
            {showDecisionMenu ? (
              <>
                <button 
                  type="button"
                  onClick={() => handleAction("[KARAR] TABURCU")}
                  className="bg-emerald-950/20 border border-emerald-500/30 hover:border-emerald-500 py-4 px-3 text-[9px] uppercase tracking-widest text-emerald-400 transition-all rounded-sm font-bold font-mono"
                >
                  Semptomatik Şifa / Reçeteli Taburcu
                </button>
                <button 
                  type="button"
                  onClick={() => handleAction("[KARAR] SEVK")}
                  className="bg-amber-950/20 border border-amber-500/30 hover:border-amber-500 py-4 px-3 text-[9px] uppercase tracking-widest text-amber-400 transition-all rounded-sm font-bold font-mono"
                >
                  Üst Merkeze / İleri Tetkike Sevk
                </button>
                <button 
                  type="button"
                  onClick={() => handleAction("[KARAR] YATIŞ")}
                  className="bg-blue-950/20 border border-blue-500/30 hover:border-blue-500 py-4 px-3 text-[9px] uppercase tracking-widest text-blue-400 transition-all rounded-sm font-bold font-mono"
                >
                  Klinik/Servis Takibi İçin Yatış
                </button>
              </>
            ) : (
              options[activeTab]?.map((opt, i) => (
                <button 
                  key={i} 
                  type="button"
                  onClick={() => handleAction(opt)} 
                  disabled={isLoading} 
                  className="bg-white/[0.02] border border-white/10 hover:border-[#D4AF37]/50 py-3 px-3 text-[9px] uppercase text-white/70 hover:text-[#D4AF37] transition-all truncate rounded-sm font-sans"
                >
                  {opt}
                </button>
              ))
            )}
          </div>
        </div>
      </footer>
    </main>
  );
}

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

  return (
    <div className="flex flex-col items-center px-2 md:px-5 border-r border-white/5 last:border-none transition-colors duration-300">
      <span className="text-[6px] md:text-[7px] text-white/20 uppercase tracking-widest mb-0.5">{label}</span>
      <div className={`flex items-baseline gap-0.5 md:gap-1 ${statusConfig[status]}`}>
        <span className="text-xs md:text-lg font-bold tabular-nums tracking-tighter">{value}</span>
        <span className="text-[6px] md:text-[8px] opacity-40 font-light lowercase">{unit}</span>
      </div>
    </div>
  );
}

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
  ].sort();

  return (
    <main className="min-h-screen bg-[#010102] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="max-w-2xl w-full border border-[#D4AF37]/20 bg-black/40 p-6 md:p-12 backdrop-blur-xl my-6 md:my-12 shadow-[0_0_50px_rgba(0,0,0,1)] relative overflow-hidden rounded-sm font-serif">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#D4AF37]/10 pb-6 mb-8 md:mb-12 relative z-10 font-mono">
          <h1 className="text-[#D4AF37] text-xl md:text-2xl font-bold italic tracking-[0.3em] uppercase text-center underline underline-offset-8 decoration-[#D4AF37]/20">
            Divine Theater
          </h1>
        </header>

        <div className="space-y-8 md:space-y-12 relative z-10 font-mono">
          <section>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] mb-4">Kademeyi Mühürle</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['STAJYER', 'INTERN', 'DHY', 'UZMAN'].map(s => (
                <button 
                  key={s} 
                  type="button"
                  onClick={() => setStage(s as Stage)} 
                  className={`py-3 text-[8px] border tracking-widest transition-all rounded-sm ${stage === s ? 'bg-[#D4AF37] text-black border-[#D4AF37] shadow-[0_0_15px_rgba(212,175,55,0.3)]' : 'border-white/10 text-white/40 hover:border-white/30'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </section>

          <section>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] mb-4">Poliklinik Seçimi</p>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3 max-h-[250px] md:max-h-[350px] overflow-y-auto pr-2 custom-scrollbar">
              {branches.map(b => (
                <button 
                  key={b} 
                  type="button"
                  onClick={() => setBranch(b)} 
                  className={`py-3 text-[8px] border transition-all truncate px-2 tracking-tighter rounded-sm ${branch === b ? 'border-[#8B0000] text-[#8B0000] bg-[#8B0000]/5 shadow-[inset_0_0_10px_rgba(139,0,0,0.2)]' : 'border-white/5 text-white/20 hover:text-white/50 hover:border-white/10'}`}
                >
                  {b}
                </button>
              ))}
            </div>
          </section>

          <button 
            type="button"
            onClick={onStart} 
            disabled={!branch} 
            className="w-full bg-[#D4AF37] text-black py-4 md:py-5 font-bold uppercase text-[10px] tracking-[0.5em] disabled:opacity-10 transition-all hover:bg-[#D4AF37]/90 active:scale-95 shadow-[0_0_30px_rgba(212,175,55,0.15)] rounded-sm"
          >
            SAHNEYİ AÇ
          </button>
        </div>
      </div>
    </main>
  );
}
