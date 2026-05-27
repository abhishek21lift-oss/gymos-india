'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { authApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const router = useRouter();
  const { setAuth } = useAuthStore();
  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async () => {
    if (!/^[6-9]\d{9}$/.test(phone)) {
      toast.error('Sahi mobile number daalo (10 digits)');
      return;
    }
    setLoading(true);
    try {
      await authApi.sendOtp(phone);
      toast.success('OTP bhej diya gaya! 📱');
      setStep('otp');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'OTP nahi bheja ja saka');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      toast.error('6 digit OTP daalo');
      return;
    }
    setLoading(true);
    try {
      const { data } = await authApi.verifyOtp(phone, otp);
      setAuth(data.user, data.accessToken, data.refreshToken);
      toast.success(`Welcome back, ${data.user.name}! 💪`);
      router.push('/dashboard');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'OTP galat hai');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 to-red-950 flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="text-center mb-10">
        <div className="w-20 h-20 bg-red-600 rounded-3xl flex items-center justify-center mx-auto mb-4 shadow-2xl">
          <span className="text-4xl">🏋️</span>
        </div>
        <h1 className="text-3xl font-black text-white tracking-tight">GymOS India</h1>
        <p className="text-red-300 mt-1 text-sm">Aapka Gym Ka Control Center</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl">
        {step === 'phone' ? (
          <>
            <h2 className="text-xl font-bold text-gray-900 mb-1">Login Karein</h2>
            <p className="text-gray-500 text-sm mb-6">
              Aapka registered mobile number daalo
            </p>

            <div className="mb-4">
              <label className="gym-label">Mobile Number</label>
              <div className="flex">
                <span className="flex items-center px-3 bg-gray-100 border border-r-0 border-gray-200 rounded-l-xl text-gray-500 text-sm font-medium">
                  🇮🇳 +91
                </span>
                <input
                  className="gym-input rounded-l-none"
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  value={phone}
                  onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                  onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                />
              </div>
            </div>

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="btn-primary"
            >
              {loading ? '⏳ Bhej rahe hain...' : 'OTP Bhejo →'}
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setStep('phone')} className="text-gray-400 text-sm mb-4 flex items-center gap-1">
              ← Wapas
            </button>

            <h2 className="text-xl font-bold text-gray-900 mb-1">OTP Verify Karein</h2>
            <p className="text-gray-500 text-sm mb-6">
              <span className="font-medium text-gray-800">+91 {phone}</span> par OTP bheja gaya
            </p>

            <div className="mb-6">
              <label className="gym-label">6-Digit OTP</label>
              <input
                className="gym-input text-center text-2xl font-bold tracking-[0.5em]"
                type="number"
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={e => setOtp(e.target.value.slice(0, 6))}
                onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
              />
            </div>

            <button onClick={handleVerifyOtp} disabled={loading} className="btn-primary">
              {loading ? '⏳ Verify ho raha hai...' : '✅ Login Karein'}
            </button>

            <button
              onClick={handleSendOtp}
              disabled={loading}
              className="w-full text-center text-sm text-red-600 font-medium mt-4"
            >
              OTP nahi aaya? Dobara bhejo
            </button>
          </>
        )}
      </div>

      <p className="text-red-400 text-xs mt-6 text-center">
        Koi problem? WhatsApp: +91-XXXXX-XXXXX
      </p>
    </div>
  );
}
