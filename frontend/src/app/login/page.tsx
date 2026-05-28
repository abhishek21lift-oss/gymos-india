'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';
import { Phone, Lock, Dumbbell, LogIn } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Sahi mobile number daalo (10 digits)');
      return;
    }
    if (!password) {
      toast.error('Password daalo');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.login(phone, password);
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.name}!`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Phone ya password galat hai');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-gray-900 via-red-950 to-gray-900 flex flex-col items-center justify-center p-6">
      <div className="absolute top-1/4 -left-20 w-72 h-72 bg-red-500/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-orange-500/15 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-600/5 rounded-full blur-[150px]" />

      <div className="text-center mb-10 relative z-10 animate-slide-up">
        <div className="w-20 h-20 mx-auto mb-4 relative">
          <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl blur-xl opacity-60 animate-pulse-glow" />
          <div className="relative w-full h-full bg-gradient-to-br from-red-500 to-orange-500 rounded-3xl flex items-center justify-center shadow-2xl">
            <Dumbbell className="w-10 h-10 text-white" strokeWidth={2.5} />
          </div>
        </div>
        <h1 className="text-4xl font-black text-white tracking-tight">
          <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">GymOS</span>{' '}
          <span className="text-white">India</span>
        </h1>
        <p className="text-red-300/80 mt-2 text-sm font-medium">Aapka Gym Ka Premium Control Center</p>
      </div>

      <div className="w-full max-w-sm relative z-10 animate-slide-up" style={{ animationDelay: '0.1s' }}>
        <div className="backdrop-blur-xl bg-white/5 rounded-3xl p-6 shadow-2xl border border-white/10">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shadow-lg">
              <LogIn className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Login Karein</h2>
              <p className="text-gray-400 text-sm">Apna mobile number aur password daalo</p>
            </div>
          </div>

          <div className="mb-4">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Mobile Number</label>
            <div className="flex">
              <span className="flex items-center px-3.5 bg-white/10 border border-r-0 border-white/10 rounded-l-xl text-gray-400 text-sm font-medium backdrop-blur-sm">
                +91
              </span>
              <input
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-r-xl text-base text-white
                       focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/50
                       placeholder:text-gray-500 transition-all duration-200"
                type="tel"
                maxLength={10}
                placeholder="9876543210"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-semibold text-gray-300 mb-2">Password</label>
            <div className="flex">
              <span className="flex items-center px-3.5 bg-white/10 border border-r-0 border-white/10 rounded-l-xl text-gray-400 backdrop-blur-sm">
                <Lock className="w-4 h-4" />
              </span>
              <input
                className="w-full px-4 py-3.5 bg-white/5 border border-white/10 rounded-r-xl text-base text-white
                       focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/50
                       placeholder:text-gray-500 transition-all duration-200"
                type="password"
                placeholder="Password daalo"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
              />
            </div>
          </div>

          <button
            onClick={handleLogin}
            disabled={loading}
            className="relative w-full overflow-hidden font-semibold py-3.5 rounded-xl text-white
                   transition-all duration-300 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed
                   bg-gradient-to-r from-red-600 to-orange-500 shadow-lg shadow-red-600/30
                   hover:shadow-xl hover:shadow-red-600/40 hover:-translate-y-0.5"
          >
            <span className="flex items-center justify-center gap-2">
              {loading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Login ho raha hai...
                </span>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Login Karein
                </>
              )}
            </span>
          </button>
        </div>
      </div>

      <p className="text-gray-600 text-xs mt-8 text-center relative z-10">
        Koi problem? WhatsApp support available
      </p>
    </div>
  );
}
