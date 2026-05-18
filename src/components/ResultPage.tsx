"use client";

import { useState } from 'react';
import { ArrowLeft, Download, ChevronDown, FileText } from 'lucide-react';
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
  recommendations: Recommendation[];
}

export function ResultPage({ onBack, profileText, fileName, recommendations }: ResultPageProps) {
  const [showOthers, setShowOthers] = useState(false);

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

  const topFive = recommendations.slice(0, 5);
  const otherProducts = recommendations.slice(5);

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
          <div className="mb-8 flex flex-col gap-2">
            <div className="flex items-center">
              <span className="bg-[#0084A1]/10 text-[#0084A1] px-3 py-1.5 rounded-full text-xs font-bold border border-[#0084A1]/20 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Dokumen: {fileName}
              </span>
            </div>
            <h2 className="text-[32px] font-bold text-gray-900 leading-tight">Top 5 Rekomendasi <span className="text-[#0084A1]">Sertifikasi</span></h2>
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