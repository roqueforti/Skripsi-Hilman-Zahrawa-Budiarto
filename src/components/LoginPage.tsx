"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Lock, User, Eye, EyeOff } from 'lucide-react';

export function LoginPage() {
  const router = useRouter();
  const navigate = (path: string) => router.push(path);
  
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const envUser = process.env.NEXT_PUBLIC_ADMIN_USERNAME;
    const envPass = process.env.NEXT_PUBLIC_ADMIN_PASSWORD;

    if (username === envUser && password === envPass) {
      localStorage.setItem("admin_auth", "true");
      navigate('/admin/dashboard');
    } else {
      setError('Username atau password salah');
    }
  };

  return (
    <div className="min-h-screen bg-[#f3f7f9] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-[440px]">
        {/* Logo Section */}
        <div className="text-center mb-10">
          <h1 className="text-[40px] font-bold tracking-tight mb-1">
            <span className="text-[#101828]">Certi</span>
            <span className="text-[#0084A1]">Match</span>
          </h1>
          <p className="text-[16px] text-[#64748b] font-medium">Admin Panel</p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-[32px] p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] border border-white/20">
          <div className="mb-8">
            <h2 className="text-[26px] font-bold text-[#101828] mb-1">Login</h2>
            <p className="text-[15px] text-[#64748b]">Masuk ke panel administrasi</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Username Field */}
            <div>
              <label className="block text-[14px] font-semibold text-[#334155] mb-2 ml-1">Username</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#0084A1] transition-colors">
                  <User size={20} />
                </div>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value);
                    setError('');
                  }}
                  placeholder="Masukkan username"
                  className="w-full h-[54px] pl-12 pr-4 bg-[#f8fafc] border border-[#e2e8f0] rounded-[16px] text-[15px] text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#0084A1]/20 focus:border-[#0084A1] transition-all placeholder:text-[#94a3b8]"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <label className="block text-[14px] font-semibold text-[#334153] mb-2 ml-1">Password</label>
              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[#94a3b8] group-focus-within:text-[#0084A1] transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  placeholder="Masukkan password"
                  className="w-full h-[54px] pl-12 pr-12 bg-[#f8fafc] border border-[#e2e8f0] rounded-[16px] text-[15px] text-[#1e293b] focus:outline-none focus:ring-2 focus:ring-[#0084A1]/20 focus:border-[#0084A1] transition-all placeholder:text-[#94a3b8]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94a3b8] hover:text-[#0084A1] transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 border border-red-100 rounded-[14px] p-3 animate-in fade-in slide-in-from-top-2 duration-300">
                <p className="text-[13px] text-red-600 font-medium text-center">{error}</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3 pt-2">
              <button
                type="submit"
                className="w-full h-[54px] bg-[#0084A1] text-white text-[16px] rounded-[16px] hover:bg-[#00728b] transition-all font-bold shadow-lg shadow-[#0084A1]/25 active:scale-[0.98]"
              >
                Login
              </button>

              <button
                type="button"
                onClick={() => navigate('/')}
                className="w-full h-[54px] bg-white text-[#475569] text-[15px] rounded-[16px] hover:bg-[#f8fafc] transition-all border border-[#e2e8f0] font-semibold active:scale-[0.98]"
              >
                Kembali
              </button>
            </div>
          </form>
        </div>

        {/* Footer info (Optional, to keep clean) */}
        <div className="text-center mt-10">
          <p className="text-[13px] text-[#94a3b8] font-medium">
            &copy; {new Date().getFullYear()} CertiMatch System
          </p>
        </div>
      </div>
    </div>
  );
}
