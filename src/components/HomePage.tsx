"use client";
import { useState, useEffect } from 'react';
import { Upload, ArrowRight, Sparkles, Zap, Target, Shield, Loader2, FileText } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';
import { extractTextFromPdf } from '@/lib/pdf';
import { AnalysisLoadingModal } from './AnalysisLoadingModal';

interface HomePageProps {
  onAnalyze: (text: string, fileName?: string, results?: any[]) => void;
}

export function HomePage({ onAnalyze }: HomePageProps) {
  const [profileText, setProfileText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'checking' | 'ready' | 'loading'>('checking');
  
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/backend-status');
        if (res.ok) {
          setBackendStatus('ready');
          clearInterval(interval);
        } else {
          setBackendStatus('loading');
        }
      } catch (error) {
        setBackendStatus('loading');
      }
    };

    checkStatus();
    interval = setInterval(checkStatus, 5000);

    return () => clearInterval(interval);
  }, []);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profileText.trim()) {
      setIsModalOpen(true);
    }
  };
  
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      try {
        setIsExtracting(true);
        setUploadedFileName(file.name);
        
        // Real PDF Text Extraction
        const text = await extractTextFromPdf(file);
        
        if (text.trim()) {
          setProfileText(text);
        } else {
          alert('Gagal mengambil teks dari PDF. Pastikan PDF memiliki teks yang bisa dibaca.');
        }
      } catch (error) {
        console.error('Extraction error:', error);
        alert('Terjadi kesalahan saat membaca file PDF.');
      } finally {
        setIsExtracting(false);
      }
    }
  };
  
  return (
    <div className="h-screen flex overflow-hidden bg-white">
      {/* Left Side - Hero Section with Background */}
      <div className="flex-1 flex flex-col justify-between relative overflow-hidden">
        {/* Background Image with Overlay */}
        <div className="absolute inset-0">
          <ImageWithFallback
            src="https://images.unsplash.com/photo-1718220216044-006f43e3a9b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzY4ODUyMjE5fDA&ixlib=rb-4.1.0&q=80&w=1080"
            alt="Modern workspace"
            className="w-full h-full object-cover"
          />
          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/95 via-white/90 to-[#007fa3]/20"></div>
        </div>
        
        {/* Content */}
        <div className="relative z-10 flex flex-col justify-between h-full p-12">
          {/* Logo */}
          <div>
            <h1 className="text-2xl font-bold">
              <span className="text-gray-900">Certi</span>
              <span className="text-[#007fa3]">Match</span>
            </h1>
          </div>
          
          {/* Hero Content */}
          <div className="flex-1 flex flex-col justify-center max-w-xl">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur-sm border border-[#007fa3]/20 rounded-full mb-6 w-fit shadow-sm">
              <Sparkles className="w-4 h-4 text-[#007fa3]" />
              <span className="text-sm text-[#007fa3] font-medium">AI-Powered Matching System</span>
            </div>
            
            <h2 className="text-5xl font-light text-gray-900 mb-6 leading-tight">
              Temukan <span className="font-normal relative inline-block">
                <span className="relative z-10">sertifikasi</span>
                <span className="absolute bottom-2 left-0 w-full h-3 bg-[#007fa3]/30 -rotate-1"></span>
              </span>
              <br />
              <span className="font-normal bg-gradient-to-r from-[#007fa3] to-[#00a8d6] bg-clip-text text-transparent">
                yang tepat untuk klien
              </span>
            </h2>
            
            <p className="text-lg text-gray-700 mb-12 leading-relaxed">
              Sistem rekomendasi sertifikasi Certiport berbasis AI untuk <span className="text-[#007fa3] font-medium">CATC JTI Polinema</span>. Upload profil klien dan dapatkan rekomendasi yang akurat menggunakan text similarity analysis.
            </p>
            
            {/* Features */}
            <div className="grid grid-cols-2 gap-6">
              <div className="flex items-start gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                <div className="w-10 h-10 bg-[#007fa3]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-[#007fa3]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm mb-1">Analisis Cepat</h3>
                  <p className="text-xs text-gray-600">Hasil dalam hitungan detik</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                <div className="w-10 h-10 bg-[#007fa3]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Target className="w-5 h-5 text-[#007fa3]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm mb-1">Akurat & Terukur</h3>
                  <p className="text-xs text-gray-600">Match score yang presisi</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                <div className="w-10 h-10 bg-[#007fa3]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-[#007fa3]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm mb-1">Internal Use</h3>
                  <p className="text-xs text-gray-600">Khusus tim CATC</p>
                </div>
              </div>
              
              <div className="flex items-start gap-3 bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200/50 shadow-sm">
                <div className="w-10 h-10 bg-[#007fa3]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-[#007fa3]" />
                </div>
                <div>
                  <h3 className="font-medium text-gray-900 text-sm mb-1">AI Technology</h3>
                  <p className="text-xs text-gray-600">Text similarity matching</p>
                </div>
              </div>
            </div>
          </div>
          
          {/* Footer Info */}
          <div className="pt-8 border-t border-gray-300/50 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <p className="text-xs text-gray-700">
                Dikembangkan oleh <span className="text-[#007fa3] font-medium">CATC</span> · Jurusan Teknologi Informasi · Politeknik Negeri Malang
              </p>
              
              {/* Backend Status Badge */}
              <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-[10px] font-bold transition-all ${
                backendStatus === 'ready' 
                  ? 'bg-emerald-50 text-emerald-600 border-emerald-200' 
                  : 'bg-amber-50 text-amber-600 border-amber-200'
              }`}>
                {backendStatus !== 'ready' ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
                )}
                <span>
                  {backendStatus === 'ready' ? 'NLP Backend Ready' : 'Menyiapkan AI Model...'}
                </span>
              </div>
            </div>
            <a 
              href="/login" 
              className="text-[10px] text-gray-400 hover:text-[#007fa3] transition-colors"
            >
              Admin Portal
            </a>
          </div>
        </div>
      </div>
      
      {/* Right Side - Input Form */}
      <div className="w-[500px] bg-white border-l border-gray-200 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-[#007fa3]/5 to-white">
          <h3 className="font-semibold text-gray-900 mb-1">Upload Profil Klien</h3>
          <p className="text-sm text-gray-600">Upload PDF atau paste teks profil</p>
        </div>
        
        {/* Form */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          {/* Loading Overlay for Extraction */}
          {isExtracting && (
            <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-20 flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-300">
              <div className="bg-[#007fa3]/10 p-4 rounded-full mb-4">
                <Loader2 className="w-8 h-8 text-[#007fa3] animate-spin" />
              </div>
              <h4 className="font-bold text-gray-900 mb-1">Sedang Memproses PDF</h4>
              <p className="text-sm text-gray-600">Mengekstrak informasi dari profil klien Anda...</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
            <div className="flex-1 flex flex-col">
              {/* File Upload */}
              <label className={`group flex flex-col items-center justify-center w-full py-12 border-2 border-dashed rounded-xl transition-all cursor-pointer mb-4 ${uploadedFileName ? 'border-[#007fa3] bg-[#007fa3]/5' : 'border-gray-200 bg-gray-50 hover:border-[#007fa3] hover:bg-[#007fa3]/5'}`}>
                <div className="text-center">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all border shadow-sm ${uploadedFileName ? 'bg-[#007fa3] border-[#007fa3] text-white' : 'bg-white border-gray-200 group-hover:border-[#007fa3]/20 text-gray-400 group-hover:text-[#007fa3]'}`}>
                    {uploadedFileName ? <FileText className="w-8 h-8" /> : <Upload className="w-8 h-8" />}
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    {uploadedFileName ? (
                      <span className="text-[#007fa3] font-bold">{uploadedFileName}</span>
                    ) : (
                      <>
                        <span className="text-[#007fa3] font-medium">Browse files</span> atau drop PDF di sini
                      </>
                    )}
                  </p>
                  <p className="text-xs text-gray-400">{uploadedFileName ? 'Klik untuk mengganti file' : 'Maksimal 10MB'}</p>
                </div>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              
              {/* Divider */}
              <div className="relative mb-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400 uppercase tracking-widest font-bold">atau</span>
                </div>
              </div>
              
              {/* Text Area */}
              <div className="flex-1 flex flex-col">
                <label className="text-sm font-bold text-gray-700 mb-2 ml-1">Paste Teks Profil</label>
                <div className="relative flex-1">
                  <textarea
                    value={profileText}
                    onChange={(e) => setProfileText(e.target.value)}
                    placeholder="Contoh:

Organisasi: PT. TechCorp Indonesia
Industri: Teknologi Informasi
Departemen: Engineering
Jumlah Tim: 50 profesional

Kebutuhan Training:
Kami ingin meningkatkan kemampuan tim dalam cloud computing (Azure & AWS), cybersecurity, dan data analytics..."
                    className="w-full h-full px-5 py-4 border border-gray-200 rounded-xl text-[14px] text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007fa3] focus:border-transparent resize-none bg-gray-50/30 font-medium"
                  />
                  {profileText.length > 0 && (
                    <div className="absolute top-4 right-4">
                      <div className="w-2.5 h-2.5 bg-[#007fa3] rounded-full animate-pulse shadow-[0_0_8px_rgba(0,127,163,0.5)]"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="pt-6 border-t border-gray-100 mt-auto">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500 font-medium">
                  {profileText.length > 0 ? (
                    <span className="flex items-center gap-1.5 animate-in fade-in">
                      <span className="w-2 h-2 bg-[#007fa3] rounded-full"></span>
                      {profileText.length.toLocaleString()} karakter terdeteksi
                    </span>
                  ) : (
                    'Belum ada konten untuk dianalisis'
                  )}
                </p>
              </div>
              
              <button
                type="submit"
                disabled={!profileText.trim() || isExtracting || backendStatus !== 'ready'}
                className="group w-full h-[54px] bg-[#007fa3] text-white text-[16px] rounded-xl hover:bg-[#006a8a] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-bold shadow-lg shadow-[#007fa3]/20 hover:shadow-xl hover:shadow-[#007fa3]/30 active:scale-[0.98]"
              >
                {backendStatus !== 'ready' ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Menyiapkan NLP Model...
                  </>
                ) : (
                  <>
                    Analisis Profil Klien
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <AnalysisLoadingModal 
        isOpen={isModalOpen}
        profileText={profileText}
        fileName={uploadedFileName}
        onComplete={(results) => {
          setIsModalOpen(false);
          onAnalyze(profileText, uploadedFileName, results);
        }}
        onCancel={() => setIsModalOpen(false)}
      />
    </div>
  );
}
