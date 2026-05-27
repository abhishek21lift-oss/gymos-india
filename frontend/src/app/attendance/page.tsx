'use client';

import { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import { attendanceApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { QrCode, UserCheck, Users, Clock } from 'lucide-react';
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
            toast.success(res.data.message || 'Check-in ho gaya! ✅');
            mutate();
          } catch (err: any) {
            toast.error(err.response?.data?.message || 'QR scan failed');
          }
        },
        () => {} // error handler
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
    <div className="min-h-screen bg-gray-50">
      <Header title="Attendance" />

      <div className="page-container">
        {/* Stats Row */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="gym-card text-center">
            <p className="text-2xl font-black text-green-600">{todayData?.present || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Aaj Aaye</p>
          </div>
          <div className="gym-card text-center">
            <p className="text-2xl font-black text-gray-700">{todayData?.total || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total Members</p>
          </div>
          <div className="gym-card text-center">
            <p className="text-2xl font-black text-red-600">
              {todayData ? Math.max(0, (todayData.total || 0) - (todayData.present || 0)) : 0}
            </p>
            <p className="text-xs text-gray-500 mt-0.5">Absent</p>
          </div>
        </div>

        {/* QR Scan Button */}
        <button
          onClick={startScanner}
          className="w-full bg-red-600 text-white rounded-2xl p-4 flex items-center gap-4 mb-5 active:scale-95 transition-transform shadow-lg shadow-red-200"
        >
          <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
            <QrCode className="w-6 h-6" />
          </div>
          <div className="text-left">
            <p className="font-bold text-lg">QR Scan Karein</p>
            <p className="text-red-200 text-sm">Member ka QR code scan karo</p>
          </div>
        </button>

        {/* QR Scanner */}
        {activeTab === 'scan' && scanning && (
          <div className="gym-card mb-5">
            <p className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
              <QrCode className="w-4 h-4 text-red-600" /> QR Code Scan Karein
            </p>
            <div id="qr-reader" className="rounded-xl overflow-hidden" />
            <button
              onClick={() => { setScanning(false); setActiveTab('today'); }}
              className="btn-secondary mt-3"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Scan Result */}
        {scanResult && (
          <div className="gym-card bg-green-50 border-green-200 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                ✅
              </div>
              <div>
                <p className="font-bold text-green-900">{scanResult.member?.name}</p>
                <p className="text-green-700 text-sm">Check-in successful!</p>
                <p className="text-xs text-green-600">{new Date().toLocaleTimeString('en-IN')}</p>
              </div>
            </div>
            <button onClick={() => setScanResult(null)} className="text-xs text-green-600 mt-2 underline">
              Clear
            </button>
          </div>
        )}

        {/* Today's Attendance List */}
        <div>
          <div className="section-header">
            <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-4 h-4 text-red-600" />
              Aaj Aaye ({todayData?.present || 0})
            </h2>
            <span className="text-xs text-gray-400">
              {new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
            </span>
          </div>

          <div className="space-y-2">
            {todayData?.attendance?.map((att: any) => (
              <div key={att.id} className="gym-card flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                  {att.member?.name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm text-gray-900">{att.member?.name}</p>
                  <p className="text-xs text-gray-500">{att.member?.memberId}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-medium text-gray-600 flex items-center gap-1">
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
              <div className="text-center py-12">
                <p className="text-4xl mb-3">🏋️</p>
                <p className="text-gray-500">Abhi tak koi nahi aaya</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <BottomNav active="attendance" />
    </div>
  );
}
