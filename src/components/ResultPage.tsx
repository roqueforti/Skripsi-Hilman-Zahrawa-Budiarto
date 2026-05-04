"use client";

import { useState, useEffect, useRef } from 'react';
import { ArrowLeft, Download, Award, FileText, Loader2, Sparkles, Target, Zap, CheckCircle2, AlertCircle, Timer, ChevronRight, ChevronDown } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface Recommendation {
  rank: number;
  name: string;
  matchScore: number;
  semanticScore: number;
  numericScore: number;
  institution: string;
  category: string;
}

interface ResultPageProps {
  onBack: () => void;
  profileText: string;
  fileName: string;
}

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

export function ResultPage({ onBack, profileText, fileName }: ResultPageProps) {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentStepId, setCurrentStepId] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<string[]>([]);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<{message: string; details?: string} | null>(null);
  const [showOthers, setShowOthers] = useState(false);
  const analysisStarted = useRef(false);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading) {
      interval = setInterval(() => {
        setSeconds(s => s + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [loading]);

  useEffect(() => {
    if (!analysisStarted.current) {
      analysisStarted.current = true;
      startAnalysis();
    }
  }, []);

  const startAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      setCompletedSteps([]);
      setCurrentStepId('INGESTION');

      // Simulate step-by-step loading for UI feedback
      const stepSimulation = async (id: string, duration: number) => {
        setCurrentStepId(id);
        await new Promise(resolve => setTimeout(resolve, duration));
        setCompletedSteps(prev => [...prev, id]);
      };

      // Start actual API call in background
      const apiPromise = fetch('/api/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileText }),
      });

      // UI Simulation while waiting for API
      await stepSimulation('INGESTION', 1000);
      await stepSimulation('TRANSLATION', 2000);
      await stepSimulation('PREPROCESSING', 1500);
      setCurrentStepId('TFIDF_VECTOR');

      const response = await apiPromise;

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Gagal menganalisis profil' }));
        throw { message: errorData.error || 'Server error', details: errorData.details };
      }

      const data = await response.json();
      
      // Complete remaining steps quickly once data is back
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

        setRecommendations(mappedResults);
        setLoading(false);
      }
    } catch (err: any) {
      console.error('Analysis error:', err);
      setError({ 
        message: err.message || 'Terjadi kesalahan sistem', 
        details: err.details 
      });
      setLoading(false);
    }
  };

  const handleExport = () => {
    const doc = new jsPDF();
    const tealColor = [0, 132, 161];

    doc.setFontSize(22);
    doc.setTextColor(16, 24, 40);
    doc.text('Laporan Rekomendasi Sertifikasi', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Klien: ${fileName}`, 14, 32);
    doc.text(`Tanggal Analisis: ${new Date().toLocaleDateString('id-ID')}`, 14, 38);

    autoTable(doc, {
      startY: 50,
      head: [['Rank', 'Nama Sertifikasi', 'Match Score']],
      body: recommendations.map(r => [`#${r.rank}`, r.name, `${r.matchScore}%`]),
      headStyles: { 
        fillColor: tealColor as any, 
        textColor: 255, 
        fontSize: 12, 
        fontStyle: 'bold',
        halign: 'center' 
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        2: { halign: 'center', cellWidth: 40 }
      },
      alternateRowStyles: { fillColor: [248, 250, 252] },
      styles: { fontSize: 10, cellPadding: 6 }
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text('Analisis ini dihasilkan secara otomatis menggunakan model CertiMatch AI.', 14, finalY);

    doc.save(`Rekomendasi_Sertifikasi_${fileName.replace(/\s+/g, '_')}.pdf`);
  };

  const getRankStyle = (rank: number) => {
    switch (rank) {
      case 1: return {
        badge: 'bg-gradient-to-br from-amber-400 via-yellow-500 to-amber-600 shadow-amber-500/40',
        ring: 'ring-2 ring-amber-400/30',
        label: '🏆 Best Match',
        labelClass: 'bg-amber-50 text-amber-700 border-amber-200',
      };
      case 2: return {
        badge: 'bg-gradient-to-br from-slate-300 via-gray-400 to-slate-500 shadow-gray-400/30',
        ring: 'ring-2 ring-slate-300/20',
        label: '🥈 Runner Up',
        labelClass: 'bg-slate-50 text-slate-600 border-slate-200',
      };
      case 3: return {
        badge: 'bg-gradient-to-br from-orange-400 via-amber-600 to-orange-700 shadow-orange-500/30',
        ring: 'ring-2 ring-orange-300/20',
        label: '🥉 Top 3',
        labelClass: 'bg-orange-50 text-orange-600 border-orange-200',
      };
      default: return {
        badge: 'bg-gradient-to-br from-[#0084A1] to-[#006a8a] shadow-[#0084A1]/20',
        ring: '',
        label: `#${rank}`,
        labelClass: 'bg-gray-50 text-gray-600 border-gray-200',
      };
    }
  };

  const getScoreBar = (score: number) => {
    if (score >= 80) return 'bg-gradient-to-r from-emerald-400 to-emerald-500';
    if (score >= 60) return 'bg-gradient-to-r from-[#0084A1] to-[#00a5c8]';
    if (score >= 40) return 'bg-gradient-to-r from-amber-400 to-amber-500';
    return 'bg-gradient-to-r from-gray-300 to-gray-400';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 60) return 'bg-[#0084A1]/10 text-[#0084A1] border-[#0084A1]/20';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-[#030213] overflow-hidden font-sans">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-[#030213]"></div>
          <div className="absolute top-[20%] left-[10%] w-[300px] h-[300px] bg-[#0084A1]/10 rounded-full blur-[120px] animate-pulse"></div>
          <div className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] bg-emerald-500/10 rounded-full blur-[150px] animate-pulse"></div>
        </div>

        {/* Header */}
        <div className="relative z-10 px-8 py-4 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-[#0084A1] rounded-lg flex items-center justify-center shadow-lg shadow-[#0084A1]/20">
              <Award className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-white text-lg font-bold tracking-tight">CertiMatch <span className="text-[#0084A1]">AI</span></h1>
              <p className="text-gray-500 text-[10px] font-semibold uppercase tracking-widest">Analysis System</p>
            </div>
          </div>
          
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
              <Timer className="text-[#0084A1] animate-pulse" size={16} />
              <span className="text-white font-mono text-lg tabular-nums">{seconds}<span className="text-[#0084A1] ml-1 text-[10px] uppercase font-bold">dtk</span></span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 min-h-0">
          <div className="max-w-5xl w-full flex flex-col min-h-0">
            <div className="mb-6 text-center shrink-0">
              <h2 className="text-white text-3xl font-bold mb-2 tracking-tight">
                Memproses <span className="bg-gradient-to-r from-[#0084A1] to-[#00d6ff] bg-clip-text text-transparent">Analisis Model</span>
              </h2>
              <p className="text-gray-500 text-sm max-w-xl mx-auto">
                Sinkronisasi real-time antara cloud NLP dan database sertifikasi.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-3 shrink-0">
              {LOADING_STEPS.map((step) => {
                const isActive = step.id === currentStepId;
                const isCompleted = completedSteps.includes(step.id);
                
                return (
                  <div 
                    key={step.id}
                    className={`relative p-4 rounded-2xl border transition-all duration-500 flex items-start gap-3 overflow-hidden ${
                      isActive 
                        ? 'bg-white/10 border-[#0084A1] shadow-[0_0_30px_-5px_rgba(0,132,161,0.4)] scale-[1.03] z-30 ring-2 ring-[#0084A1]/20' 
                        : isCompleted
                          ? 'bg-emerald-500/10 border-emerald-500/20'
                          : 'bg-white/[0.03] border-white/5 opacity-40'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all duration-500 ${
                      isActive 
                        ? 'bg-[#0084A1] text-white shadow-lg' 
                        : isCompleted 
                          ? 'bg-emerald-500 text-white' 
                          : 'bg-white/10 text-gray-600'
                    }`}>
                      {isCompleted ? <CheckCircle2 size={20} /> : isActive ? <Loader2 size={20} className="animate-spin" /> : step.icon}
                    </div>

                    <div className="relative z-10 min-w-0 flex-1">
                      <h3 className={`text-[11px] font-bold uppercase tracking-wider mb-0.5 transition-colors ${isActive ? 'text-[#00d6ff]' : isCompleted ? 'text-emerald-400' : 'text-gray-500'}`}>
                        {step.label}
                      </h3>
                      <p className={`text-[11px] leading-snug transition-all ${isActive ? 'text-gray-400' : isCompleted ? 'text-emerald-600/50' : 'text-gray-700'}`}>
                        {step.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer Progress Bar */}
        <div className="relative z-10 px-8 py-3 border-t border-white/5 bg-black/30 backdrop-blur-xl shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {LOADING_STEPS.map((s) => (
              <div 
                key={s.id} 
                className={`w-6 h-1.5 rounded-full transition-all duration-500 ${
                  currentStepId === s.id ? 'bg-[#0084A1] w-10 animate-pulse' : completedSteps.includes(s.id) ? 'bg-emerald-500' : 'bg-white/10'
                }`} 
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex flex-col items-center justify-center bg-[#f3f7f9] p-8 text-center font-sans">
        <div className="bg-white p-12 rounded-[48px] shadow-2xl border border-white/20 flex flex-col items-center max-w-lg w-full">
          <div className="w-20 h-20 bg-red-50 rounded-3xl flex items-center justify-center text-red-500 mb-8">
            <AlertCircle size={40} />
          </div>
          <h2 className="text-[28px] font-bold text-[#101828] mb-4">Gagal Terhubung</h2>
          <p className="text-[16px] text-[#ef4444] font-bold mb-6">{error.message}</p>
          <button 
            onClick={onBack} 
            className="w-full h-[54px] bg-[#030213] text-white rounded-2xl font-bold transition-all shadow-xl active:scale-[0.98]"
          >
            Kembali & Coba Lagi
          </button>
        </div>
      </div>
    );
  }

  const topFive = recommendations.slice(0, 5);
  const otherProducts = recommendations.slice(5);

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 60) return 'bg-[#0084A1]/10 text-[#0084A1] border-[#0084A1]/20';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans">
      <div className="bg-white px-8 py-4 border-b border-gray-200 flex items-center justify-between shadow-sm relative z-20">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group">
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Kembali</span>
          </button>
          <div className="h-6 w-px bg-gray-200"></div>
          <h1 className="text-xl font-bold">
            <span className="text-gray-900">Certi</span>
            <span className="text-[#0084A1]">Match</span>
          </h1>
        </div>
        <button onClick={handleExport} className="flex items-center gap-2 px-6 py-2.5 bg-[#0084A1] text-white text-sm rounded-xl hover:bg-[#00728b] transition-all shadow-lg shadow-[#0084A1]/25 font-bold">
          <Download className="w-4 h-4" /> Export Report
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto bg-gray-50/50 p-8">
        <div className="max-w-5xl mx-auto">
          <div className="mb-8">
            <h2 className="text-[32px] font-bold text-gray-900">Top 5 Rekomendasi <span className="text-[#0084A1]">Sertifikasi</span></h2>
            <p className="text-gray-500">Hasil analisis kecocokan profil klien dengan database sertifikasi.</p>
          </div>

          <div className="flex flex-col gap-4">
            {topFive.map((rec) => {
              const style = getRankStyle(rec.rank);
              return (
                <div key={rec.rank} className={`bg-white border border-gray-200 rounded-2xl p-6 flex items-center gap-6 hover:shadow-lg transition-all ${style.ring}`}>
                  <div className={`w-12 h-12 ${style.badge} rounded-xl flex items-center justify-center text-white font-extrabold text-xl`}>
                    #{rec.rank}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${style.labelClass}`}>{style.label}</span>
                      <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{rec.category}</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">{rec.name}</h3>
                    <p className="text-sm text-gray-500">{rec.institution}</p>
                  </div>
                  <div className={`px-4 py-2 rounded-xl border text-center min-w-[100px] ${getScoreBg(rec.matchScore)}`}>
                    <div className="text-2xl font-black">{rec.matchScore}%</div>
                    <div className="text-[10px] font-bold uppercase opacity-60">Match Score</div>
                  </div>
                </div>
              );
            })}
          </div>

          {otherProducts.length > 0 && (
            <div className="mt-8">
              <button onClick={() => setShowOthers(!showOthers)} className="w-full flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl">
                <span className="font-bold text-gray-500">Sertifikasi Lainnya ({otherProducts.length})</span>
                <ChevronDown className={`transition-transform ${showOthers ? 'rotate-180' : ''}`} />
              </button>
              {showOthers && (
                <div className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-50">
                  {otherProducts.map(p => (
                    <div key={p.rank} className="p-4 flex items-center justify-between hover:bg-gray-50">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-gray-300">#{p.rank}</span>
                        <span className="text-sm font-semibold">{p.name}</span>
                      </div>
                      <span className="text-sm font-bold text-[#0084A1]">{p.matchScore}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}