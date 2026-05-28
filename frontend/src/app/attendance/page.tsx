'use client';

import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { attendanceApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { QrCode, UserCheck, Users, Clock, X, ScanLine } from 'lucide-react';
import toast from 'react-hot-toast';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function AttendancePage() {
  const [activeTab, setActiveTab] = useState<'today' | 'scan'>('today');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<any>(null);
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  const { data: todayData, mutate } = useSWR(
    'attendance-today',
    () => attendanceApi.getToday().then(r => r.data),
    { refreshInterval: 30000 }
  );

  const startScanner = () => {
    setScanning(true);
    setActiveTab('scan');
  };

  useEffect(() => {
    if (activeTab === 'scan' && scanning) {
      const scanner = new Html5QrcodeScanner('qr-reader', { fps: 10, qrbox: 250 }, false);
      scanner.render(
        async (decodedText) => {
          scanner.clear();
          setScanning(false);
          try {
            const res = await attendanceApi.checkInByQr(decodedText);
            setScanResult(res.data);
            toast.success(res.data.message || 'Check-in ho gaya!');
            mutate();
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'QR scan failed');
          }
        },
        () => {}
      );
      scannerRef.current = scanner;
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(() => {});
        scannerRef.current = null;
      }
    };
  }, [activeTab, scanning]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header title="Attendance" />

      <div className="page-container">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4 animate-slide-up">
          <div className="premium-card text-center py-4">
            <p className="text-3xl font-black text-green-600">{todayData?.present || 0}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Aaj Aaye</p>
          </div>
          <div className="premium-card text-center py-4">
            <p className="text-3xl font-black text-gray-700">{todayData?.total || 0}</p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Total Members</p>
          </div>
          <div className="premium-card text-center py-4">
            <p className="text-3xl font-black text-red-600">
              {todayData ? Math.max(0, (todayData.total || 0) - (todayData.present || 0)) : 0}
            </p>
            <p className="text-xs text-gray-500 mt-1 font-medium">Absent</p>
          </div>
        </div>

        {/* QR Scan Button */}
        <button
          onClick={startScanner}
          className="w-full bg-gradient-to-r from-red-600 to-orange-500 text-white rounded-2xl p-4 flex items-center gap-4 mb-5 active:scale-[0.98] transition-all duration-200 shadow-lg shadow-red-600/20 animate-slide-up"
          style={{ animationDelay: '0.05s' }}
        >
          <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
            <QrCode className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-lg">QR Scan Karein</p>
            <p className="text-red-200 text-sm">Member ka QR code scan karo</p>
          </div>
          <ScanLine className="w-6 h-6 ml-auto opacity-60" />
        </button>

        {/* QR Scanner */}
        {activeTab === 'scan' && scanning && (
          <div className="premium-card mb-5 animate-scale-in">
            <div className="flex items-center justify-between mb-3">
              <p className="font-semibold text-gray-900 flex items-center gap-2">
                <QrCode className="w-4 h-4 text-red-600" /> QR Code Scan Karein
              </p>
              <button
                onClick={() => { setScanning(false); setActiveTab('today'); }}
                className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors"
              >
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <div id="qr-reader" className="rounded-xl overflow-hidden ring-1 ring-black/5" />
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div className="premium-card bg-gradient-to-r from-green-50 to-emerald-50/50 border border-green-200/50 mb-5 animate-scale-in">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white shadow-lg">
                <UserCheck className="w-6 h-6" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-green-900">{scanResult.member?.name}</p>
                <p className="text-green-700 text-sm font-medium">Check-in successful!</p>
                <p className="text-xs text-green-600">{new Date().toLocaleTimeString('en-IN')}</p>
              </div>
              <button onClick={() => setScanResult(null)} className="text-xs text-green-600 font-medium underline">
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Today's Attendance List */}
        <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <div className="section-header">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-red-500" />
              Aaj Aaye ({todayData?.present || 0})
            </h2>
            <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2.5 py-1 rounded-lg">
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </span>
          </div>

          <div className="space-y-2">
            {todayData?.attendance?.map((att: any, i: number) => (
              <div key={att.id} className="premium-card flex items-center gap-3 animate-slide-up"
                   style={{ animationDelay: `${i * 0.03}s` }}>
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center text-green-700 font-bold">
                  {att.member?.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{att.member?.name}</p>
                  <p className="text-xs text-gray-500">{att.member?.memberId}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-gray-600 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(att.checkInTime).toLocaleTimeString('en-IN', {
                      hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                  <p className="text-xs text-gray-400">{att.checkInMethod}</p>
                </div>
              </div>
            ))}

            {!todayData?.attendance?.length && (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Abhi tak koi nahi aaya</p>
                <p className="text-gray-400 text-sm mt-1">QR scan karo attendance lene ke liye</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav active="attendance" />
    </div>
  );
}
