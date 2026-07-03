'use client'
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface CaseQuestion {
  questionText: string;
  options: string[];
  correctIdx: number;
  rebuttal: string; // Neden doğru olduğuna dair textbook açıklaması
}

interface CaseData {
  diagnosisTitle: string; // Sadece vaka bittiğinde gösterilecek
  caseParagraph: string; // Derinlemesine Anamnez + Muayene + Lab bulguları metni
  questions: CaseQuestion[];
}

export default function DivineHospital() {
  const router = useRouter();
  const [view, setView] = useState<'menu' | 'theatre'>('menu');
  const [stage, setStage] = useState('STAJYER');
  const [branch, setBranch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  // Vaka Verileri ve İlerleme State'leri
  const [caseData, setCaseData] = useState<CaseData | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [showExplanation, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const fetchClinicalCase = async () => {
    setIsLoading(true);
    setView('theatre');
    setCaseData(null);
    setCurrentQuestionIdx(0);
    setSelectedIdx(null);
    setShowResult(false);
    setScore(0);
    setIsFinished(false);

    try {
      const res = await fetch('/api/hastane/action', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ branch, stage })
      });
      if (res.ok) {
        const data = await res.json();
        setCaseData(data);
      }
    } catch (err) {
      console.error("Vaka yükleme hatası:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnswerSubmit = (idx: number) => {
    if (showExplanation || !caseData) return;
    setSelectedIdx(idx);
    setShowResult(true);

    if (idx === caseData.questions[currentQuestionIdx].correctIdx) {
      setScore(prev => prev + 1);
    }
  };

  const handleNextAction = () => {
    if (!caseData) return;
    setSelectedIdx(null);
    setShowResult(false);

    if (currentQuestionIdx + 1 < caseData.questions.length) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  if (view === 'menu') {
    return <MenuView stage={stage} setStage={setStage} branch={branch} setBranch={setBranch} onStart={fetchClinicalCase} />;
  }

  return (
    <main className="min-h-screen bg-[#010102] text-[#E0E0E0] font-serif p-4 md:p-12 pb-32 overflow-y-auto select-none">
      <header className="max-w-7xl mx-auto border-b border-[#D4AF37]/10 pb-4 mb-8 flex justify-between items-center font-mono text-[10px] tracking-widest text-white/30 uppercase">
        <div>CLINICUM // {branch} // {stage}</div>
        <button onClick={() => setView('menu')} className="text-[#8B0000] hover:underline">[ VAKADAN ÇEKİL ]</button>
      </header>

      {isLoading && (
        <div className="h-[60vh] flex flex-col items-center justify-center text-[#D4AF37] uppercase text-[10px] tracking-[0.3em] font-mono animate-pulse">
          Vaka hazırlanıyor...
        </div>
      )}

      {caseData && (
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
          
          {/* SOL TARAF: REAKTİF KLİNİK PARAGRAF (TEXTBOOK KALİTESİNDE EPİKRİZ) */}
          <section className="bg-black/30 border border-white/5 p-6 md:p-8 rounded-sm space-y-6 shadow-2xl">
            <h2 className="text-[#D4AF37] text-[10px] font-mono uppercase tracking-[0.4em] border-b border-white/5 pb-3">
              {isFinished ? `✓ ANAMNEZ SONLANDI: ${caseData.diagnosisTitle}` : `• KLİNİK ANAMNEZ & BULGULAR`}
            </h2>
            <p className="text-sm md:text-base leading-loose text-justify tracking-wide text-white/90 whitespace-pre-line font-sans">
              {caseData.caseParagraph}
            </p>
          </section>

          {/* SAĞ TARAF: ARDIŞIK SORU MOTORU */}
          <section className="space-y-6">
            {!isFinished ? (
              <div className="bg-black/40 border border-[#D4AF37]/20 p-6 md:p-8 rounded-sm space-y-6 shadow-xl animate-in fade-in duration-300">
                <div className="flex justify-between items-center font-mono text-[9px] tracking-widest text-[#D4AF37]/50 uppercase">
                  <span>SORU</span>
                  <span>{currentQuestionIdx + 1} / {caseData.questions.length}</span>
                </div>

                <h3 className="text-base md:text-lg italic leading-relaxed text-white/95">
                  "{caseData.questions[currentQuestionIdx].questionText}"
                </h3>

                <div className="grid gap-3">
                  {caseData.questions[currentQuestionIdx].options.map((opt, i) => (
                    <button
                      key={i}
                      disabled={showExplanation}
                      onClick={() => handleAnswerSubmit(i)}
                      className={`w-full text-left py-4 px-5 border transition-all duration-500 rounded-sm flex items-center ${
                        showExplanation
                          ? i === caseData.questions[currentQuestionIdx].correctIdx
                            ? 'border-[#D4AF37] bg-[#D4AF37]/10 text-white'
                            : i === selectedIdx ? 'border-[#8B0000] bg-[#8B0000]/10 text-white/40' : 'border-white/5 opacity-30'
                          : 'border-white/10 hover:border-[#D4AF37]/40 bg-white/[0.01] text-white/80'
                      }`}
                    >
                      <span className="mr-3 text-[#D4AF37]/40 font-mono font-bold text-xs">{String.fromCharCode(65 + i)})</span>
                      <span className="text-xs md:text-sm font-sans">{opt}</span>
                    </button>
                  ))}
                </div>

                {showExplanation && (
                  <div className="space-y-4 animate-in fade-in duration-300 border-t border-white/5 pt-4">
                    <div className={`p-4 border-l-2 ${selectedIdx === caseData.questions[currentQuestionIdx].correctIdx ? 'border-[#D4AF37] bg-[#D4AF37]/5' : 'border-[#8B0000] bg-[#8B0000]/5'}`}>
                      <h4 className="text-[9px] font-mono uppercase tracking-wider mb-2 font-bold text-[#D4AF37]">
                        {selectedIdx === caseData.questions[currentQuestionIdx].correctIdx ? '✓ DOĞRU TEŞHİS REFLEKSİ' : '✗ KLİNİK YANILGI'}
                      </h4>
                      <p className="text-xs md:text-sm font-sans italic text-white/70 leading-relaxed whitespace-pre-line">
                        {caseData.questions[currentQuestionIdx].rebuttal}
                      </p>
                    </div>
                    <button
                      onClick={handleNextAction}
                      className="w-full bg-white/5 border border-white/10 text-white hover:text-[#D4AF37] hover:border-[#D4AF37]/40 py-3 text-[10px] font-mono uppercase tracking-[0.2em] transition-all rounded-sm"
                    >
                      {currentQuestionIdx + 1 === caseData.questions.length ? 'MÜŞAHADEYİ BİTİR' : 'BİR SONRAKI ADIMA GEÇ →'}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              // VAKA BİTİŞ SKOR PANELİ
              <div className="bg-black/50 border border-[#D4AF37]/30 p-8 rounded-sm text-center space-y-6 animate-in zoom-in-95 duration-500">
                <h3 className="text-[#D4AF37] text-xl font-bold tracking-widest uppercase font-mono">Simülasyon Raporu</h3>
                <div className="text-4xl font-mono font-bold text-white py-4 border-y border-white/5">
                  {score} / {caseData.questions.length} BAŞARI
                </div>
                <p className="text-xs italic text-white/60 leading-relaxed max-w-sm mx-auto font-sans">
                  {score === caseData.questions.length 
                    ? "Kusursuz hekimlik refleksi. Tüm patofizyolojik adımları ve kılavuz yaklaşımlarını eksiksiz yönettiniz."
                    : "Vaka tamamlandı. Yanlış kararların patofizyolojik gerekçelerini sol taraftaki epikriz raporu üzerinden tekrar muhakeme edin."}
                </p>
                <button
                  onClick={() => setView('menu')}
                  className="bg-[#D4AF37] text-black px-10 py-3.5 text-[10px] font-mono font-bold uppercase tracking-[0.3em] active:scale-95 transition-all rounded-sm shadow-md"
                >
                  CLINICIUM'A DÖN
                </button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}

// Menu view ve VitalItem aynı kalıyor...
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
    critical: 'text-[#8B0000] animate-pulse'
  };

  return (
    <div className="flex flex-col items-center px-4 border-r border-white/5 last:border-none">
      <span className="text-[7px] text-white/20 uppercase tracking-widest mb-0.5">{label}</span>
      <div className={`flex items-baseline gap-1 ${statusConfig[status]}`}>
        <span className="text-lg font-bold tabular-nums tracking-tighter">{value}</span>
        <span className="text-[8px] opacity-40 font-light lowercase">{unit}</span>
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
    'GÖĞÜS CERRAHİSİ', 'DAHİLİYE', 'GÖĞÜS HASTALIKLARI'
  ].sort();

  return (
    <main className="min-h-screen bg-[#010102] flex items-center justify-center p-4 md:p-6 overflow-y-auto">
      <div className="max-w-2xl w-full border border-[#D4AF37]/20 bg-black/40 p-6 md:p-12 backdrop-blur-xl my-6 md:my-12 shadow-[0_0_50px_rgba(0,0,0,1)] relative overflow-hidden rounded-sm font-serif">
        <header className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-[#D4AF37]/10 pb-6 mb-8 md:mb-12 relative z-10 font-mono">
          <h1 className="text-[#D4AF37] text-xl md:text-2xl font-bold italic tracking-[0.3em] uppercase text-center underline underline-offset-8 decoration-[#D4AF37]/20">
            CLINICIUM
          </h1>
        </header>

        <div className="space-y-8 md:space-y-12 relative z-10 font-mono">
          <section>
            <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] mb-4">Kademe</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {['STAJYER', 'INTERN', 'DHY', 'UZMAN'].map(s => (
                <button 
                  key={s} 
                  type="button"
                  onClick={() => setStage(s)} 
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
            VAKAYA BAŞLA
          </button>
        </div>
      </div>
    </main>
  );
}
