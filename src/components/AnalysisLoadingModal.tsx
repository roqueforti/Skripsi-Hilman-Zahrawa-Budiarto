import { useState, useEffect, useRef } from 'react';
import { Loader2, FileText, Sparkles, Target, Zap, CheckCircle2, ArrowLeft, Award, Timer, AlertCircle } from 'lucide-react';

const LOADING_STEPS = [
  { id: 'INGESTION', label: 'Data Ingestion', description: 'Membaca data input profil klien...', icon: <FileText size={22} /> },
  { id: 'TRANSLATION', label: 'Translation', description: 'Translating content to English (id -> en)...', icon: <Sparkles size={22} /> },
  { id: 'PREPROCESSING', label: 'Preprocessing', description: 'Cleaning text & Lemmatization process...', icon: <Loader2 size={22} className="animate-spin" /> },
  { id: 'TFIDF_VECTOR', label: 'TF-IDF Extraction', description: 'Numeric feature engineering (TF-IDF)...', icon: <Target size={22} /> },
  { id: 'TFIDF_SIM', label: 'Numeric Similarity', description: 'Computing Cosine Similarity (Numeric)...', icon: <Zap size={22} /> },
  { id: 'SEMANTIC_EMBED', label: 'Semantic Embedding', description: 'Encoding with Sentence-Transformers...', icon: <ArrowLeft size={22} className="rotate-180" /> },
  { id: 'SEMANTIC_SIM', label: 'Semantic Similarity', description: 'Computing Cosine Similarity (Semantic)...', icon: <Target size={22} /> },
  { id: 'WEIGHTING', label: 'Score Integration', description: 'Merging results (Weighted Scoring)...', icon: <CheckCircle2 size={22} /> },
  { id: 'RANKING', label: 'Ranking Output', description: 'Sorting & final recommendations...', icon: <Award size={22} /> },
];

interface AnalysisLoadingModalProps {
  isOpen: boolean;
  profileText: string;
  fileName?: string;
  onComplete: (results: any[]) => void;
  onCancel: () => void;
}

export function AnalysisLoadingModal({ isOpen, profileText, fileName, onComplete, onCancel }: AnalysisLoadingModalProps) {
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<{message: string; details?: string} | null>(null);
  const analysisStarted = useRef(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isOpen && !error) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isOpen, error]);

  useEffect(() => {
    if (isOpen && !analysisStarted.current) {
      analysisStarted.current = true;
      startAnalysis();
    }
    if (!isOpen) {
      analysisStarted.current = false;
      setSeconds(0);
      setCurrentStepId(null);
      setCompletedSteps([]);
      setError(null);
    }
  }, [isOpen]);

  const startAnalysis = async () => {
    try {
      setError(null);
      setCompletedSteps([]);
      setCurrentStepId('INGESTION');

      const stepSimulation = async (id: string, duration: number) => {
        setCurrentStepId(id);
        await new Promise(resolve => setTimeout(resolve, duration));
        setCompletedSteps(prev => [...prev, id]);
      };

      const apiPromise = fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileText, clientName: fileName || 'Manual Input' }),
      });

      await stepSimulation('INGESTION', 1000);
      await stepSimulation('TRANSLATION', 2000);
      await stepSimulation('PREPROCESSING', 1500);
      setCurrentStepId('TFIDF_VECTOR');

      const response = await apiPromise;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Gagal menganalisis profil' }));
        const err = new Error(errorData.error || 'Server error');
        (err as any).details = errorData.details;
        throw err;
      }

      const data = await response.json();
      
      await stepSimulation('TFIDF_VECTOR', 500);
      await stepSimulation('TFIDF_SIM', 500);
      await stepSimulation('SEMANTIC_EMBED', 500);
      await stepSimulation('SEMANTIC_SIM', 500);
      await stepSimulation('WEIGHTING', 500);
      await stepSimulation('RANKING', 500);

      if (data.results) {
        const mappedResults = data.results.map((item: any, index: number) => ({
          rank: index + 1,
          name: item.name,
          matchScore: item.matchScore,
          semanticScore: item.semanticScore,
          numericScore: item.numericScore,
          institution: item.institution,
          category: item.category
        }));
        onComplete(mappedResults);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError({ 
        message: err.message || 'Terjadi kesalahan sistem', 
        details: err.details 
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 font-sans animate-in fade-in duration-300">
      <div className="bg-[#030213] w-full max-w-4xl rounded-3xl overflow-hidden shadow-2xl border border-white/10 flex flex-col relative animate-in zoom-in-95 duration-300">
        {/* Background Effects */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-10%] w-[300px] h-[300px] bg-[#0084A1]/20 rounded-full blur-[100px] animate-pulse"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[300px] h-[300px] bg-emerald-500/20 rounded-full blur-[100px] animate-pulse"></div>
        </div>

        {error ? (
          <div className="relative z-10 p-12 flex flex-col items-center text-center">
             <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center text-red-500 mb-6">
                <AlertCircle size={40} />
             </div>
             <h2 className="text-2xl font-bold text-white mb-3">Gagal Menganalisis</h2>
             <p className="text-red-400 mb-8 max-w-md">{error.message}</p>
             <button 
               onClick={onCancel} 
               className="px-8 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold transition-all active:scale-[0.98]"
             >
               Tutup & Coba Lagi
             </button>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-[#0084A1] rounded-xl flex items-center justify-center shadow-lg shadow-[#0084A1]/20">
                  <Award className="text-white" size={20} />
                </div>
                <div>
                  <h2 className="text-white text-lg font-bold">Menganalisis Profil</h2>
                  <p className="text-gray-400 text-xs font-medium">Sinkronisasi AI & Database Sertifikasi</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 bg-black/40 border border-white/10 px-4 py-2 rounded-xl">
                <Timer className="text-[#0084A1] animate-pulse" size={16} />
                <span className="text-white font-mono text-base tabular-nums">{seconds}<span className="text-[#0084A1] ml-1 text-[10px] uppercase font-bold">dtk</span></span>
              </div>
            </div>

            {/* Content */}
            <div className="relative z-10 p-8">
              <div className="grid grid-cols-3 gap-3">
                {LOADING_STEPS.map((step) => {
                  const isActive = step.id === currentStepId;
                  const isCompleted = completedSteps.includes(step.id);
                  
                  return (
                    <div 
                      key={step.id}
                      className={`relative p-4 rounded-2xl border transition-all duration-500 flex items-start gap-3 overflow-hidden ${
                        isActive 
                          ? 'bg-white/10 border-[#0084A1] shadow-[0_0_30px_-5px_rgba(0,132,161,0.4)] scale-[1.02] z-30 ring-1 ring-[#0084A1]/30' 
                          : isCompleted
                            ? 'bg-emerald-500/10 border-emerald-500/20'
                            : 'bg-white/[0.02] border-white/5 opacity-40'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                        isActive 
                          ? 'bg-[#0084A1] text-white shadow-lg' 
                          : isCompleted 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-white/10 text-gray-600'
                      }`}>
                        {isCompleted ? <CheckCircle2 size={18} /> : isActive ? <Loader2 size={18} className="animate-spin" /> : step.icon}
                      </div>

                      <div className="relative z-10 min-w-0 flex-1">
                        <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-0.5 transition-colors ${isActive ? 'text-[#00d6ff]' : isCompleted ? 'text-emerald-400' : 'text-gray-500'}`}>
                          {step.label}
                        </h3>
                        <p className={`text-[10px] leading-snug transition-all ${isActive ? 'text-gray-400' : isCompleted ? 'text-emerald-600/50' : 'text-gray-600'}`}>
                          {step.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer Progress */}
            <div className="relative z-10 px-8 py-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
              <div className="flex items-center gap-1.5 flex-1">
                {LOADING_STEPS.map((s) => (
                  <div 
                    key={s.id} 
                    className={`h-1.5 rounded-full transition-all duration-500 flex-1 ${
                      currentStepId === s.id ? 'bg-[#0084A1] animate-pulse' : completedSteps.includes(s.id) ? 'bg-emerald-500' : 'bg-white/10'
                    }`} 
                  />
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
