import React, { useState } from 'react';
import { Lock, User, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';

interface LoginProps {
  onLogin: (status: boolean) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');
      return;
    }

    setError('');
    setLoading(true);

    // ==========================================
    // จำลองการตรวจสอบสิทธิ์ (Mock Authentication)
    // ==========================================
    // ในการใช้งานจริง คุณสามารถเปลี่ยนเป็นการใช้ fetch() 
    // เพื่อส่ง username/password ไปตรวจสอบกับ Google Apps Script หรือ API ของคุณได้
    setTimeout(() => {
      if (username === 'TesterSB' && password === 'Sb1-user') {
        onLogin(true);
      } else {
        setError('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
        setLoading(false);
      }
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 font-sans text-slate-800 dark:text-slate-200 transition-colors duration-300">
      <div className="max-w-md w-full bg-white dark:bg-slate-900 rounded-2xl shadow-xl dark:shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 dark:bg-slate-950 p-8 text-white text-center relative overflow-hidden border-b border-slate-800">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white to-transparent"></div>
          <div className="relative z-10 flex flex-col items-center">
            <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm border border-white/20">
              <ShieldCheck className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight">เข้าสู่ระบบ</h1>
            <p className="text-slate-400 text-sm mt-2 font-medium">ระบบตรวจสอบยานพาหนะ</p>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 md:p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="username" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                ชื่อผู้ใช้งาน (Username)
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="admin"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
                <div className="absolute left-3 top-3.5 flex items-center justify-center">
                  <User className="text-slate-400 dark:text-slate-500 w-5 h-5" />
                </div>
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wide">
                รหัสผ่าน (Password)
              </label>
              <div className="relative">
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••"
                  className="w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 focus:border-indigo-500 dark:focus:border-indigo-400 transition-all font-medium text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500"
                />
                <div className="absolute left-3 top-3.5 flex items-center justify-center">
                  <Lock className="text-slate-400 dark:text-slate-500 w-5 h-5" />
                </div>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-3 text-red-600 dark:text-red-400 text-sm bg-red-50 dark:bg-red-900/20 p-4 rounded-xl border border-red-100 dark:border-red-900/30 animate-in fade-in zoom-in-95 duration-200">
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 dark:bg-indigo-500 dark:hover:bg-indigo-600 text-white font-semibold py-4 rounded-xl transition-all disabled:opacity-70 flex justify-center items-center gap-2 shadow-md hover:shadow-lg mt-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>กำลังตรวจสอบ...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  <span>เข้าสู่ระบบ</span>
                </>
              )}
            </button>
          </form>
          
          <div className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <p>ทดสอบระบบใช้ Username: <span className="font-bold text-slate-700 dark:text-slate-300">admin</span></p>
            <p>Password: <span className="font-bold text-slate-700 dark:text-slate-300">1234</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
