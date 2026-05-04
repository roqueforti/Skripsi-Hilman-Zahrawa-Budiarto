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
      startStreamingAnalysis();
    }
  }, []);

  const startStreamingAnalysis = async () => {
    try {
      setLoading(true);
      setError(null);
      setCompletedSteps([]);
      setCurrentStepId(null);

      const response = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ profileText }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Koneksi gagal' }));
        throw { message: errorData.error || 'Server error', details: errorData.details };
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      if (!reader) throw { message: 'Gagal membuka data stream' };

      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            console.log("Stream line:", line); // Debug log
            const data = JSON.parse(line);
            
            if (data.status) {
              const stepId = data.status;
              setCurrentStepId(stepId);
              
              const stepIndex = LOADING_STEPS.findIndex(s => s.id === stepId);
              if (stepIndex > 0) {
                const prevSteps = LOADING_STEPS.slice(0, stepIndex).map(s => s.id);
                setCompletedSteps(prevSteps);
              }
            } else if (data.results) {
              setCompletedSteps(LOADING_STEPS.map(s => s.id));
              setCurrentStepId(null);
              
              const mappedResults = data.results.map((item: any, index: number) => ({
                rank: index + 1,
                name: item.name,
                matchScore: item.matchScore,
                semanticScore: item.semanticScore,
                numericScore: item.numericScore,
                institution: item.institution,
                category: item.category
              }));

              setTimeout(() => {
                setRecommendations(mappedResults);
                setLoading(false);
              }, 1200);
            }
          } catch (e) {
            console.error('Line parse error:', e, line);
          }
        }
      }
    } catch (err: any) {
      console.error('Streaming error:', err);
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

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'from-emerald-500 to-emerald-600';
    if (score >= 60) return 'from-[#0084A1] to-[#006a8a]';
    return 'from-gray-400 to-gray-500';
  };
  
  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (score >= 60) return 'bg-[#0084A1]/10 text-[#0084A1] border-[#0084A1]/20';
    return 'bg-gray-50 text-gray-700 border-gray-200';
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col bg-[#030213] overflow-hidden font-sans">
        {/* Background */}
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop"
            alt="Technology Background"
            className="w-full h-full object-cover opacity-20 scale-110 blur-sm"
          />
          <div className="absolute inset-0 bg-gradient-to-tr from-[#030213] via-[#030213]/90 to-[#0084A1]/20"></div>
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
            <div className="text-right">
              <p className="text-gray-500 text-[9px] font-bold uppercase tracking-widest">File</p>
              <p className="text-white text-xs font-bold truncate max-w-[200px]">{fileName}</p>
            </div>
            <div className="h-8 w-px bg-white/10"></div>
            <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-4 py-2 rounded-xl backdrop-blur-md">
              <Timer className="text-[#0084A1] animate-pulse" size={16} />
              <span className="text-white font-mono text-lg tabular-nums">{seconds}<span className="text-[#0084A1] ml-1 text-[10px] uppercase font-bold">dtk</span></span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 min-h-0">
          <div className="max-w-5xl w-full flex flex-col min-h-0">
            {/* Title */}
            <div className="mb-6 text-center shrink-0">
              <h2 className="text-white text-3xl font-bold mb-2 tracking-tight">
                Memproses <span className="bg-gradient-to-r from-[#0084A1] to-[#00d6ff] bg-clip-text text-transparent">Analisis Model</span>
              </h2>
              <p className="text-gray-500 text-sm max-w-xl mx-auto">
                Sinkronisasi real-time antara skrip Python dan database sertifikasi.
              </p>
            </div>

            {/* 3x3 Grid */}
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
                    {isActive && (
                      <div className="absolute inset-0 bg-[#0084A1]/5 animate-pulse"></div>
                    )}

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

                    {/* Active bar */}
                    {isActive && (
                      <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/10 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-[#0084A1] to-[#00d6ff] animate-[progress_2s_infinite_linear]"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 px-8 py-3 border-t border-white/5 bg-black/30 backdrop-blur-xl shrink-0 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {LOADING_STEPS.map((s) => {
              const stepCompleted = completedSteps.includes(s.id);
              const stepActive = currentStepId === s.id;
              return (
                <div 
                  key={s.id} 
                  className={`w-6 h-1.5 rounded-full transition-all duration-500 ${
                    stepActive ? 'bg-[#0084A1] w-10 animate-pulse' : stepCompleted ? 'bg-emerald-500' : 'bg-white/10'
                  }`} 
                />
              );
            })}
          </div>
          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
            {currentStepId ? LOADING_STEPS.find(s => s.id === currentStepId)?.label : 'Initializing...'} 
            <span className="text-gray-700 ml-2">({completedSteps.length}/{LOADING_STEPS.length})</span>
          </p>
        </div>

        <style jsx>{`
          @keyframes progress {
            0% { width: 0%; }
            100% { width: 100%; }
          }
        `}</style>
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
          
          <div className="bg-gray-50 p-6 rounded-2xl text-left mb-8 w-full border border-gray-100">
            <h4 className="text-[13px] font-bold text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
              <Target size={14} /> Solusi Cepat:
            </h4>
            <ol className="text-[13px] text-gray-600 space-y-2 list-decimal ml-4 font-medium leading-relaxed">
              <li>Cek terminal, pastikan <code className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-900">npm run dev</code> aktif.</li>
              <li>Pastikan URL adalah <code className="text-[#0084A1]">localhost:3000</code>.</li>
              <li>Ganti <code className="bg-gray-200 px-1.5 py-0.5 rounded text-gray-900">PYTHON_PATH</code> di file .env jika salah.</li>
              <li>Pastikan virtual environment telah aktif.</li>
            </ol>
          </div>
          
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
  
  return (
    <div className="h-screen flex flex-col bg-white overflow-hidden font-sans">
      <div className="bg-white px-8 py-4 border-b border-gray-200 flex items-center justify-between shadow-sm relative z-20">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
          >
            <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <span className="text-sm font-medium">Kembali</span>
          </button>
          <div className="h-6 w-px bg-gray-200"></div>
          <h1 className="text-xl font-bold">
            <span className="text-gray-900">Certi</span>
            <span className="text-[#0084A1]">Match</span>
          </h1>
        </div>
        
        <button 
          onClick={handleExport}
          className="flex items-center gap-2 px-6 py-2.5 bg-[#0084A1] text-white text-sm rounded-xl hover:bg-[#00728b] transition-all shadow-lg shadow-[#0084A1]/25 hover:-translate-y-0.5 font-bold"
        >
          <Download className="w-4 h-4" />
          Export Report
        </button>
      </div>
      
      <div className="flex-1 overflow-hidden relative">
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1642522029691-029b5a432954?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxidXNpbmVzcyUyMG1lZXRpbmclMjBwcm9mZXNzaW9uYWx8ZW58MXx8fHwxNzY4ODM1MzQ3fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Professional workspace"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-white/95 via-white/90 to-white/85"></div>
        </div>
        
        <div className="relative z-10 h-full overflow-y-auto">
          <div className="max-w-5xl mx-auto w-full px-8 py-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-200 rounded-full text-xs text-emerald-700 font-bold mb-2">
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                  Analisis Model Berhasil
                </div>
                <h2 className="text-[32px] font-bold text-gray-900 leading-tight">
                  Top 5 Rekomendasi <span className="text-[#0084A1]">Sertifikasi</span>
                </h2>
              </div>
              
              <div className="inline-flex items-center gap-3 px-5 py-3 bg-white/80 backdrop-blur-sm border border-gray-200 rounded-[20px] shadow-sm">
                <FileText className="w-5 h-5 text-[#0084A1]" />
                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Menganalisis Untuk</p>
                  <p className="text-[14px] font-bold text-gray-900">{fileName}</p>
                </div>
              </div>
            </div>
            
            {/* Top 5 — Uniform Cards */}
            <div className="flex flex-col gap-3">
              {topFive.map((rec) => {
                const style = getRankStyle(rec.rank);
                return (
                  <div
                    key={rec.rank}
                    className={`group bg-white border border-gray-200 rounded-2xl px-6 py-4 hover:shadow-xl hover:border-[#0084A1]/30 transition-all hover:-translate-y-0.5 relative overflow-hidden ${style.ring}`}
                  >
                    <div className="flex items-center gap-5 relative z-10">
                      <div className={`w-12 h-12 ${style.badge} rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform flex-shrink-0`}>
                        <span className="text-white text-lg font-extrabold">#{rec.rank}</span>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${style.labelClass}`}>
                            {style.label}
                          </span>
                          <span className="px-2.5 py-0.5 bg-gray-100 rounded-full text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            {rec.category}
                          </span>
                        </div>
                        <h3 className="font-bold text-gray-900 text-[16px] leading-tight group-hover:text-[#0084A1] transition-colors line-clamp-1">
                          {rec.name}
                        </h3>
                        <p className="text-[12px] font-bold text-gray-400 mt-0.5 truncate flex items-center gap-1">
                          <Award size={12} className="text-[#0084A1]" />
                          {rec.institution}
                        </p>
                      </div>

                      <div className={`px-5 py-3 rounded-xl ${getScoreBg(rec.matchScore)} border flex-shrink-0 text-center min-w-[90px]`}>
                        <div className="text-[22px] font-extrabold leading-none">{rec.matchScore}%</div>
                        <div className="text-[9px] font-bold uppercase tracking-widest opacity-50 mt-0.5">Match</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Other Certifications — Collapsible */}
            {otherProducts.length > 0 && (
              <div className="mt-5">
                <button
                  onClick={() => setShowOthers(!showOthers)}
                  className="w-full flex items-center justify-between px-5 py-3 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl transition-colors group"
                >
                  <span className="text-[13px] font-bold text-gray-500 group-hover:text-gray-700 transition-colors">
                    Sertifikasi Lainnya ({otherProducts.length})
                  </span>
                  <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${showOthers ? 'rotate-180' : ''}`} />
                </button>
                
                {showOthers && (
                  <div className="mt-2 bg-white border border-gray-200 rounded-xl overflow-hidden">
                    <div className="max-h-[280px] overflow-y-auto scrollbar-hide">
                      {otherProducts.map((product) => (
                        <div
                          key={product.rank}
                          className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50 last:border-b-0 hover:bg-gray-50/80 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <span className="text-[11px] font-bold text-gray-300 w-7 text-right flex-shrink-0">#{product.rank}</span>
                            <span className="text-[12px] text-gray-600 truncate">{product.name}</span>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                            <div className="h-1 w-10 bg-gray-100 rounded-full overflow-hidden">
                              <div className={`h-full rounded-full ${getScoreBar(product.matchScore)}`} style={{ width: `${product.matchScore}%` }}></div>
                            </div>
                            <span className="text-[11px] font-bold text-gray-400 w-10 text-right">{product.matchScore}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Footer info */}
            <div className="mt-4 text-center pb-6">
              <p className="text-[12px] text-gray-400 font-medium">
                Total {recommendations.length} sertifikasi dianalisis • CertiMatch AI Engine v1.0
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}