import { prisma } from '@/lib/db';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { FileText, Clock, Calendar, Award, ChevronLeft, Search } from 'lucide-react';
import Link from 'next/link';
import { ExportHistoryButton } from '@/components/ExportHistoryButton';

export const dynamic = 'force-dynamic';

export default async function HistoryPage() {
  const history = await prisma.analysisHistory.findMany({
    orderBy: { createdAt: 'desc' },
  });

  return (
    <div className="min-h-screen bg-[#f8fafc]">
      <div className="max-w-6xl mx-auto p-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="w-10 h-10 bg-white border border-gray-200 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors shadow-sm"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Riwayat Analisis</h1>
              <p className="text-gray-500 text-sm mt-1">Catatan pemrosesan profil klien dan rekomendasi AI</p>
            </div>
          </div>
          
          <div className="bg-white px-4 py-2.5 rounded-xl border border-gray-200 shadow-sm flex items-center gap-2">
            <Search className="w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Cari dokumen..." 
              className="text-sm border-none focus:ring-0 w-48 text-gray-700 placeholder-gray-400"
              disabled
              title="Fitur pencarian akan segera hadir"
            />
          </div>
        </div>

        {/* Table Content */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-xs uppercase tracking-wider text-gray-500 font-semibold">
                  <th className="px-6 py-4 w-[40%]">Dokumen / Profil Klien</th>
                  <th className="px-6 py-4 w-[20%]">Tanggal & Waktu</th>
                  <th className="px-6 py-4 w-[25%]">Rekomendasi Teratas</th>
                  <th className="px-6 py-4 w-[15%]">Match Score</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {history.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-6 py-16 text-center">
                      <div className="flex flex-col items-center justify-center text-gray-400">
                        <FileText className="w-12 h-12 mb-3 opacity-20" />
                        <p className="text-base font-medium text-gray-900 mb-1">Belum Ada Riwayat</p>
                        <p className="text-sm">Riwayat analisis akan muncul di sini setelah Anda memproses dokumen.</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  history.map((record) => {
                    const details = record.detailedResults ? JSON.parse(record.detailedResults) : [];
                    return (
                      <tr key={record.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td colSpan={4} className="p-0">
                          <details className="group/details" suppressHydrationWarning>
                            <summary className="flex items-center cursor-pointer list-none px-6 py-4 [&::-webkit-details-marker]:hidden">
                              <div className="flex-1 grid grid-cols-[40%_20%_25%_15%] items-center">
                                {/* Col 1 */}
                                <div className="flex items-start gap-3 pr-4">
                                  <div className="w-10 h-10 rounded-xl bg-[#007fa3]/10 flex items-center justify-center shrink-0 mt-0.5 group-hover:bg-[#007fa3] group-hover:text-white transition-colors">
                                    <FileText className="w-5 h-5 text-[#007fa3] group-hover:text-white transition-colors" />
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900 truncate max-w-[280px]" title={record.clientName}>
                                      {record.clientName}
                                    </p>
                                    <p className="text-[13px] text-gray-500 mt-0.5 line-clamp-1 max-w-[280px]" title={record.profileText}>
                                      {record.profileText}
                                    </p>
                                  </div>
                                </div>
                                {/* Col 2 */}
                                <div className="flex flex-col gap-1.5 pr-4">
                                  <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    {format(new Date(record.createdAt), 'dd MMM yyyy', { locale: id })}
                                  </div>
                                  <div className="flex items-center gap-2 text-[13px] text-gray-500">
                                    <Clock className="w-3.5 h-3.5" />
                                    {format(new Date(record.createdAt), 'HH:mm', { locale: id })} WIB
                                  </div>
                                </div>
                                {/* Col 3 */}
                                <div className="flex items-center gap-2.5 pr-4">
                                  <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
                                    <Award className="w-3.5 h-3.5 text-emerald-600" />
                                  </div>
                                  <span className="text-sm font-medium text-gray-900 line-clamp-2 leading-snug">{record.topResult}</span>
                                </div>
                                {/* Col 4 */}
                                <div className="flex justify-between items-center pr-4">
                                  <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-[#007fa3]/10 text-[#007fa3] border border-[#007fa3]/20">
                                    {record.matchScore.toFixed(2)}% Match
                                  </div>
                                  <ChevronLeft className="w-5 h-5 text-gray-400 group-open/details:-rotate-90 transition-transform" />
                                </div>
                              </div>
                            </summary>
                            
                            {/* Expanded Content */}
                            <div className="px-6 pb-6 pt-2 bg-gray-50/50 border-t border-gray-100">
                              <div className="flex items-center justify-between mb-4 px-2">
                                <h4 className="text-sm font-bold text-gray-900">Detail Rekomendasi Teratas</h4>
                                <ExportHistoryButton 
                                  clientName={record.clientName} 
                                  dateStr={format(new Date(record.createdAt), 'dd MMM yyyy', { locale: id })}
                                  recommendations={details} 
                                />
                              </div>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {details.slice(0, 15).map((item: any, idx: number) => (
                                  <div key={idx} className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative overflow-hidden">
                                    {idx === 0 && <div className="absolute top-0 right-0 w-12 h-12 bg-emerald-500/10 rounded-bl-full flex items-start justify-end p-2"><Award className="w-4 h-4 text-emerald-600" /></div>}
                                    <div className="flex items-center gap-2 mb-3">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                                        #{idx + 1}
                                      </div>
                                      <h5 className="font-bold text-gray-900 text-sm truncate pr-6" title={item.name}>{item.name}</h5>
                                    </div>
                                    
                                    <div className="space-y-2">
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500">Semantic Score (60%)</span>
                                        <span className="font-medium text-gray-900">{item.semanticScore.toFixed(2)}%</span>
                                      </div>
                                      <div className="flex justify-between items-center text-xs">
                                        <span className="text-gray-500">TF-IDF Score (40%)</span>
                                        <span className="font-medium text-gray-900">{item.numericScore.toFixed(2)}%</span>
                                      </div>
                                      <div className="h-px bg-gray-100 my-2"></div>
                                      <div className="flex justify-between items-center text-sm">
                                        <span className="font-bold text-gray-700">Total Match</span>
                                        <span className={`font-bold ${idx === 0 ? 'text-[#007fa3]' : 'text-gray-900'}`}>{item.matchScore.toFixed(2)}%</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </details>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          {/* Footer Pagination placeholder */}
          {history.length > 0 && (
             <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between text-sm text-gray-500">
               <span>Menampilkan {history.length} riwayat terakhir</span>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
