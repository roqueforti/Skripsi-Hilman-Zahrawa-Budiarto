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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 font-sans animate-in fade-in duration-300">
      <div className="w-full max-w-4xl flex flex-col relative animate-in zoom-in-95 duration-300">
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
          <div className="relative z-10 p-12 flex flex-col items-center justify-center text-center">
            <div className="mb-10">
              <Loader2 size={64} className="text-[#0084A1] animate-spin" />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4 tracking-tight">Menganalisis Profil...</h2>
            <p className="text-gray-300 mb-10 max-w-sm text-lg leading-relaxed">Mencocokkan profil klien dengan sertifikasi di Certiport.</p>
            <div className="flex items-center gap-2.5 bg-black/40 border border-white/10 px-6 py-3 rounded-full shadow-lg">
               <Timer className="text-[#0084A1] animate-pulse" size={20} />
               <span className="text-lg font-mono text-white font-bold">{seconds} <span className="text-gray-400 text-sm font-medium uppercase tracking-wider ml-1">detik</span></span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
