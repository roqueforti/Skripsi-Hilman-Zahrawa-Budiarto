"use client";

import { useState } from 'react';
import { ArrowLeft, Download, ChevronDown, FileText, Trophy, Medal, Award, Building2, BookOpen, Star, Sparkles } from 'lucide-react';
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
    doc.text('Analisis ini dihasilkan secara otomatis menggunakan metode text similarity.', 14, finalY);

    doc.save(`Rekomendasi_Sertifikasi_${fileName.replace(/\s+/g, '_')}.pdf`);
  };

  const topFive = recommendations.slice(0, 15);
  const otherProducts = recommendations.slice(15);

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
        <div className="w-full max-w-[1600px] mx-auto">
          <div className="mb-8 flex flex-col gap-2">
            <div className="flex items-center">
              <span className="bg-[#0084A1]/10 text-[#0084A1] px-3 py-1.5 rounded-full text-xs font-bold border border-[#0084A1]/20 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Dokumen: {fileName}
              </span>
            </div>
            <h2 className="text-[32px] font-bold text-gray-900 leading-tight">Top 15 Rekomendasi <span className="text-[#0084A1]">Sertifikasi</span></h2>
            <p className="text-gray-500">Hasil analisis kecocokan profil klien dengan database sertifikasi.</p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {topFive.map((rec) => (
              <div key={rec.rank} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col gap-3 hover:border-[#0084A1]/30 hover:shadow-md transition-all">
                <div className="flex items-center justify-between">
                  <div className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 text-gray-600 font-bold flex items-center justify-center text-sm shadow-sm">
                    #{rec.rank}
                  </div>
                  <span className="text-[10px] font-bold text-[#0084A1] bg-[#0084A1]/10 px-2 py-0.5 rounded-full uppercase tracking-wider">{rec.category}</span>
                </div>
                
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-2" title={rec.name}>{rec.name}</h3>
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-xs font-medium text-gray-500">Kecocokan</span>
                  <span className="text-sm font-bold text-[#0084A1]">{rec.matchScore}%</span>
                </div>
              </div>
            ))}
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