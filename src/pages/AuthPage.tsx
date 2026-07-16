import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { navigate } from '../lib/router';
import { Mail, Lock, User, ArrowRight, CheckCircle2 } from 'lucide-react';

export default function AuthPage({ mode }: { mode: 'login' | 'register' }) {
  const { signIn, signUp } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    if (mode === 'login') {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        navigate('/account');
      }
    } else {
      const { error } = await signUp(email, password, fullName);
      if (error) {
        setError(error);
        setLoading(false);
      } else {
        navigate('/account');
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('กรุณากรอกอีเมล');
      return;
    }
    setResetLoading(true);
    setError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/#/login`,
    });
    setResetLoading(false);
    if (error) {
      setError(error.message);
    } else {
      setResetSent(true);
    }
  };

  if (showForgot) {
    return (
      <div className="max-w-md mx-auto px-4 py-12 animate-fade-in">
        <div className="bg-white rounded-2xl p-8 border border-rose-100 shadow-sm">
          <div className="text-center mb-8">
            <h1 className="font-prompt text-2xl font-bold text-taupe-600 mb-2">ลืมรหัสผ่าน</h1>
            <p className="text-sm text-taupe-400">
              กรอกอีเมลของคุณ เราจะส่งลิงก์รีเซ็ตรหัสผ่านให้
            </p>
          </div>

          {resetSent ? (
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-9 h-9 text-rose-500" />
              </div>
              <p className="text-taupe-500 font-medium mb-2">ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว</p>
              <p className="text-sm text-taupe-400 mb-6">
                กรุณาตรวจสอบอีเมล <span className="font-medium text-taupe-600">{email}</span> เพื่อรีเซ็ตรหัสผ่านของคุณ
              </p>
              <button
                onClick={() => { setShowForgot(false); setResetSent(false); navigate('/login'); }}
                className="w-full py-3.5 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors"
              >
                กลับเข้าสู่ระบบ
              </button>
            </div>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-sm text-taupe-400 block mb-1">อีเมล</label>
                <div className="relative">
                  <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-taupe-300" />
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
                    placeholder="อีเมลที่ลงทะเบียนไว้"
                  />
                </div>
              </div>

              {error && <p className="text-sm text-rose-500">{error}</p>}

              <button
                type="submit"
                disabled={resetLoading}
                className="w-full py-3.5 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {resetLoading ? 'กำลังส่ง...' : (
                  <>ส่งลิงก์รีเซ็ตรหัสผ่าน <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>
          )}

          <div className="text-center mt-6 text-sm text-taupe-400">
            กลับสู่การ{' '}
            <button
              onClick={() => { setShowForgot(false); setError(''); }}
              className="text-rose-500 font-medium hover:underline"
            >
              เข้าสู่ระบบ
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12 animate-fade-in">
      <div className="bg-white rounded-2xl p-8 border border-rose-100 shadow-sm">
        <div className="text-center mb-8">
          <h1 className="font-prompt text-2xl font-bold text-taupe-600 mb-2">
            {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
          </h1>
          <p className="text-sm text-taupe-400">
            {mode === 'login' ? 'เข้าสู่ระบบเพื่อดำเนินการต่อ' : 'สมัครสมาชิกเพื่อรับสิทธิพิเศษ'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <div>
              <label className="text-sm text-taupe-400 block mb-1">ชื่อ-นามสกุล</label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-taupe-300" />
                <input
                  required
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
                  placeholder="ชื่อ-นามสกุล"
                />
              </div>
            </div>
          )}
          <div>
            <label className="text-sm text-taupe-400 block mb-1">อีเมล</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-taupe-300" />
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
                placeholder="อีเมล"
              />
            </div>
          </div>
          <div>
            <label className="text-sm text-taupe-400 block mb-1">รหัสผ่าน</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-taupe-300" />
              <input
                required
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                className="w-full pl-10 pr-4 py-2.5 border border-rose-200 rounded-lg bg-cream text-taupe-500 focus:outline-none focus:border-rose-400"
                placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
              />
            </div>
          </div>

          {error && <p className="text-sm text-rose-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-rose-500 text-white rounded-full font-medium hover:bg-rose-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'กำลังดำเนินการ...' : (
              <>
                {mode === 'login' ? 'เข้าสู่ระบบ' : 'สมัครสมาชิก'}
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 space-y-2 text-center text-sm text-taupe-400">
          {mode === 'login' && (
            <button
              onClick={() => { setShowForgot(true); setError(''); }}
              className="text-taupe-400 hover:text-rose-500 transition-colors block w-full"
            >
              ลืมรหัสผ่าน?
            </button>
          )}
          <div>
            {mode === 'login' ? (
              <>ยังไม่มีบัญชี? <button onClick={() => navigate('/register')} className="text-rose-500 font-medium hover:underline">สมัครสมาชิก</button></>
            ) : (
              <>มีบัญชีแล้ว? <button onClick={() => navigate('/login')} className="text-rose-500 font-medium hover:underline">เข้าสู่ระบบ</button></>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
