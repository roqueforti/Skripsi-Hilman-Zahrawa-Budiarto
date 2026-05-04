"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Plus, Trash2, Search, LogOut, Award, FileText, Upload, Loader2, HardDrive, CheckSquare, Square, CheckCircle2 } from "lucide-react";

interface FileData {
  id: string;
  name: string;
  size: string;
  uploadDate: string;
  path: string;
}

export function AdminPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [files, setFiles] = useState<FileData[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<string[]>([]);

  // Auth guard
  useEffect(() => {
    const auth = localStorage.getItem("admin_auth");
    if (!auth) router.push("/login");
    else fetchFiles();
  }, [router]);

  const fetchFiles = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/certifications');
      const data = await res.json();
      if (Array.isArray(data)) {
        setFiles(data);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFilesInput = e.target.files;
    if (!selectedFilesInput || selectedFilesInput.length === 0) return;

    setUploading(true);
    const formData = new FormData();
    for (let i = 0; i < selectedFilesInput.length; i++) {
      formData.append('files', selectedFilesInput[i]);
    }

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        await fetchFiles(); // Refresh list
      } else {
        const error = await res.json();
        alert(error.error || 'Gagal mengunggah file');
      }
    } catch (error) {
      console.error('Error uploading:', error);
      alert('Terjadi kesalahan saat mengunggah');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleBulkDelete = async () => {
    if (selectedFiles.length === 0) return;
    
    if (!confirm(`Yakin ingin menghapus ${selectedFiles.length} file yang dipilih?`)) return;

    try {
      const res = await fetch('/api/certifications', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filenames: selectedFiles }),
      });

      if (res.ok) {
        setFiles(files.filter(f => !selectedFiles.includes(f.name)));
        setSelectedFiles([]);
      } else {
        alert('Gagal menghapus beberapa file');
      }
    } catch (error) {
      console.error('Error deleting:', error);
    }
  };

  const toggleSelect = (filename: string) => {
    if (selectedFiles.includes(filename)) {
      setSelectedFiles(selectedFiles.filter(item => item !== filename));
    } else {
      setSelectedFiles([...selectedFiles, filename]);
    }
  };

  const toggleSelectAll = () => {
    if (selectedFiles.length === filteredFiles.length) {
      setSelectedFiles([]);
    } else {
      setSelectedFiles(filteredFiles.map(f => f.name));
    }
  };

  const filteredFiles = files.filter(file =>
    file.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#f3f7f9] font-sans">
      {/* Header */}
      <div className="bg-white border-b border-[#e2e8f0] sticky top-0 z-10">
        <div className="max-w-[1440px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[#0084A1] rounded-[12px] size-[40px] flex items-center justify-center shadow-lg shadow-[#0084A1]/20">
              <Award size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-[20px] font-bold">
                <span className="text-[#101828]">Certi</span>
                <span className="text-[#0084A1]">Match</span>
              </h1>
              <p className="text-[12px] text-[#64748b] font-medium">Bank File Sertifikasi</p>
            </div>
          </div>

          <button
            onClick={() => {
              localStorage.removeItem("admin_auth");
              router.push('/login');
            }}
            className="flex items-center gap-2 px-4 py-2 text-[14px] font-semibold text-[#64748b] hover:text-[#0084A1] transition-colors"
          >
            <LogOut size={18} />
            Logout
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-[1440px] mx-auto px-8 py-8">
        {/* Page Header */}
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h2 className="text-[32px] font-bold text-[#101828] mb-1">Manajemen Database PDF</h2>
            <p className="text-[15px] text-[#64748b]">Kelola file sertifikasi (PDF) yang akan digunakan oleh model algoritma pencocokan teks.</p>
          </div>

          <div className="flex items-center gap-3">
            {selectedFiles.length > 0 && (
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-5 py-3 bg-red-50 text-red-600 text-[15px] rounded-[14px] hover:bg-red-100 transition-all font-bold border border-red-200 animate-in fade-in slide-in-from-right-4"
              >
                <Trash2 size={18} />
                Hapus Terpilih ({selectedFiles.length})
              </button>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              accept=".pdf"
              className="hidden"
            />
            <button
              onClick={handleUploadClick}
              disabled={uploading}
              className="flex items-center gap-2 px-5 py-3 bg-[#0084A1] text-white text-[15px] rounded-[14px] hover:bg-[#00728b] transition-all font-bold shadow-lg shadow-[#0084A1]/25 disabled:opacity-50"
            >
              {uploading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
              Upload PDF (Massal)
            </button>
          </div>
        </div>

        {/* Toolbar & Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-8">
          <div className="lg:col-span-3 bg-white rounded-[24px] p-2 pl-4 flex items-center border border-[#e2e8f0] shadow-sm">
            <Search size={20} className="text-[#94a3b8] mr-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari file sertifikasi..."
              className="flex-1 py-3 text-[15px] focus:outline-none placeholder:text-[#94a3b8]"
            />
          </div>

          <div className="bg-white rounded-[24px] p-4 flex items-center gap-4 border border-[#e2e8f0] shadow-sm">
            <div className="bg-[#0084A1]/10 p-3 rounded-2xl">
              <HardDrive size={24} className="text-[#0084A1]" />
            </div>
            <div>
              <p className="text-[12px] font-bold text-[#64748b] uppercase tracking-wider">Total Files</p>
              <p className="text-[24px] font-bold text-[#101828]">{files.length}</p>
            </div>
          </div>
        </div>

        {/* File Table */}
        <div className="bg-white rounded-[28px] overflow-hidden border border-[#e2e8f0] shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#f8fafc] border-b border-[#e2e8f0]">
                  <th className="px-6 py-5 text-center w-[60px]">
                    <button 
                      onClick={toggleSelectAll}
                      className="inline-flex items-center justify-center p-1 rounded-md text-[#0084A1] hover:bg-[#0084A1]/10 transition-colors"
                    >
                      {selectedFiles.length === filteredFiles.length && filteredFiles.length > 0 ? (
                        <CheckSquare size={20} />
                      ) : (
                        <Square size={20} />
                      )}
                    </button>
                  </th>
                  <th className="text-left py-5 text-[13px] font-bold text-[#64748b] uppercase tracking-wider w-[60px]">No</th>
                  <th className="text-left px-8 py-5 text-[13px] font-bold text-[#64748b] uppercase tracking-wider">Nama File</th>
                  <th className="text-left px-8 py-5 text-[13px] font-bold text-[#64748b] uppercase tracking-wider">Ukuran</th>
                  <th className="text-left px-8 py-5 text-[13px] font-bold text-[#64748b] uppercase tracking-wider">Tanggal Upload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#f1f5f9]">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <Loader2 size={32} className="animate-spin mx-auto text-[#0084A1] mb-2" />
                      <p className="text-[15px] text-[#64748b] font-medium">Memuat data file...</p>
                    </td>
                  </tr>
                ) : filteredFiles.length > 0 ? (
                  filteredFiles.map((file, index) => (
                    <tr 
                      key={file.id} 
                      className={`transition-colors group ${selectedFiles.includes(file.name) ? 'bg-[#0084A1]/5' : 'hover:bg-[#f8fafc]'}`}
                    >
                      <td className="px-6 py-5 text-center">
                        <button 
                          onClick={() => toggleSelect(file.name)}
                          className={`inline-flex items-center justify-center p-1 rounded-md transition-colors ${selectedFiles.includes(file.name) ? 'text-[#0084A1]' : 'text-[#e2e8f0] group-hover:text-[#cbd5e1]'}`}
                        >
                          {selectedFiles.includes(file.name) ? (
                            <CheckCircle2 size={22} fill="currentColor" className="text-white" />
                          ) : (
                            <Square size={20} />
                          )}
                          {selectedFiles.includes(file.name) && <CheckCircle2 size={22} className="absolute text-[#0084A1]" />}
                        </button>
                      </td>
                      <td className="py-5 text-[14px] text-[#64748b] font-bold">
                        {index + 1}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg transition-colors ${selectedFiles.includes(file.name) ? 'bg-[#0084A1]/20 text-[#0084A1]' : 'bg-red-50 text-red-500'}`}>
                            <FileText size={20} />
                          </div>
                          <span className={`text-[15px] font-semibold transition-colors ${selectedFiles.includes(file.name) ? 'text-[#0084A1]' : 'text-[#1e293b] group-hover:text-[#0084A1]'}`}>{file.name}</span>
                        </div>
                      </td>
                      <td className="px-8 py-5 text-[14px] text-[#64748b] font-medium">{file.size}</td>
                      <td className="px-8 py-5 text-[14px] text-[#64748b] font-medium">{file.uploadDate}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="py-20 text-center">
                      <div className="bg-[#f8fafc] size-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <FileText size={32} className="text-[#94a3b8]" />
                      </div>
                      <p className="text-[16px] text-[#1e293b] font-bold mb-1">Belum ada file</p>
                      <p className="text-[14px] text-[#64748b]">Silakan upload file sertifikat dalam format PDF.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
