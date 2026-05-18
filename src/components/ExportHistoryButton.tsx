"use client";

import { Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportHistoryButtonProps {
  clientName: string;
  dateStr: string;
  recommendations: any[];
}

export function ExportHistoryButton({ clientName, dateStr, recommendations }: ExportHistoryButtonProps) {
  const handleExport = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const doc = new jsPDF();
    const tealColor = [0, 132, 161];

    doc.setFontSize(22);
    doc.setTextColor(16, 24, 40);
    doc.text('Laporan Rekomendasi Sertifikasi', 14, 22);
    
    doc.setFontSize(10);
    doc.setTextColor(100, 116, 139);
    doc.text(`Klien: ${clientName}`, 14, 32);
    doc.text(`Tanggal Analisis: ${dateStr}`, 14, 38);

    autoTable(doc, {
      startY: 50,
      head: [['Rank', 'Nama Sertifikasi', 'Match Score']],
      body: recommendations.map((r, i) => [`#${i + 1}`, r.name, `${Number(r.matchScore).toFixed(2)}%`]),
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

    doc.save(`Riwayat_Sertifikasi_${clientName.replace(/\s+/g, '_')}.pdf`);
  };

  return (
    <button 
      onClick={handleExport}
      className="flex items-center gap-2 px-4 py-2 bg-[#0084A1] text-white text-xs rounded-lg hover:bg-[#00728b] transition-all font-bold shadow-sm"
    >
      <Download className="w-3.5 h-3.5" /> Export PDF
    </button>
  );
}
