import { useState } from 'react';
import { Upload, ArrowRight, Sparkles, Zap, Target, Shield } from 'lucide-react';
import { ImageWithFallback } from './figma/ImageWithFallback';

interface HomePageProps {
  onAnalyze: (text: string, fileName?: string) => void;
}

export function HomePage({ onAnalyze }: HomePageProps) {
  const [profileText, setProfileText] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (profileText.trim()) {
      onAnalyze(profileText, uploadedFileName);
    }
  };
  
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      setUploadedFileName(file.name);
      setProfileText(`PDF File: ${file.name}\n\nOrganisasi: PT. TechCorp Indonesia\nIndustri: Teknologi Informasi\nDepartemen: Engineering\nJumlah Tim: 50 profesional\n\nKebutuhan Training:\nKami ingin meningkatkan kemampuan tim engineering dalam cloud computing, khususnya platform Microsoft Azure dan AWS. Selain itu diperlukan juga sertifikasi cybersecurity dan data analytics untuk mendukung inisiatif transformasi digital perusahaan.`);
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
          <div className="pt-8 border-t border-gray-300/50">
            <p className="text-xs text-gray-700">
              Dikembangkan oleh <span className="text-[#007fa3] font-medium">CATC</span> · Jurusan Teknologi Informasi · Politeknik Negeri Malang
            </p>
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
        <div className="flex-1 overflow-y-auto p-8">
          <form onSubmit={handleSubmit} className="space-y-6 h-full flex flex-col">
            <div className="flex-1 flex flex-col">
              {/* File Upload */}
              <label className="group flex flex-col items-center justify-center w-full py-12 border-2 border-dashed border-gray-200 rounded-xl hover:border-[#007fa3] hover:bg-[#007fa3]/5 transition-all cursor-pointer bg-gray-50 mb-4">
                <div className="text-center">
                  <div className="w-16 h-16 bg-white group-hover:bg-[#007fa3]/10 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all border border-gray-200 group-hover:border-[#007fa3]/20 shadow-sm">
                    <Upload className="w-8 h-8 text-gray-400 group-hover:text-[#007fa3] transition-colors" />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">
                    <span className="text-[#007fa3] font-medium">Browse files</span> atau drop PDF di sini
                  </p>
                  <p className="text-xs text-gray-400">Maksimal 10MB</p>
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
                  <span className="bg-white px-3 text-xs text-gray-400 uppercase">atau</span>
                </div>
              </div>
              
              {/* Text Area */}
              <div className="flex-1 flex flex-col">
                <label className="text-sm font-medium text-gray-700 mb-2">Paste Teks Profil</label>
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
                    className="w-full h-full px-4 py-3 border border-gray-200 rounded-lg text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#007fa3] focus:border-transparent resize-none"
                  />
                  {profileText.length > 0 && (
                    <div className="absolute top-3 right-3">
                      <div className="w-2 h-2 bg-[#007fa3] rounded-full animate-pulse"></div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            {/* Footer */}
            <div className="pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs text-gray-500">
                  {profileText.length > 0 ? (
                    <span className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 bg-[#007fa3] rounded-full"></span>
                      {profileText.length} karakter
                    </span>
                  ) : (
                    'Belum ada konten'
                  )}
                </p>
              </div>
              
              <button
                type="submit"
                disabled={!profileText.trim()}
                className="group w-full px-6 py-3 bg-[#007fa3] text-white text-sm rounded-lg hover:bg-[#006a8a] transition-all disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-medium shadow-lg shadow-[#007fa3]/20 hover:shadow-xl hover:shadow-[#007fa3]/30 hover:-translate-y-0.5"
              >
                Analisis Profil
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
