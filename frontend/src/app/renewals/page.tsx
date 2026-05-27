'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { renewalsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { MessageCircle, AlertTriangle, Clock, CheckCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { useRouter } from 'next/navigation';

export default function RenewalsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'expiring' | 'expired'>('expiring');
  const [sendingId, setSendingId] = useState<string | null>(null);

  const { data: expiring } = useSWR(
    'expiring-7',
    () => renewalsApi.getExpiring(7).then(r => r.data),
  );

  const { data: expired } = useSWR(
    'expired-30',
    () => renewalsApi.getExpired(30).then(r => r.data),
  );

  const sendReminder = async (memberId: string, memberName: string) => {
    setSendingId(memberId);
    try {
      await renewalsApi.sendReminder(memberId);
      toast.success(`${memberName} ko reminder bhej diya! 📱`);
    } catch {
      toast.error('Reminder nahi bhej paya');
    } finally {
      setSendingId(null);
    }
  };

  const list = tab === 'expiring' ? expiring : expired;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Renewals" />

      <div className="page-container">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="gym-card border-l-4 border-amber-400">
            <p className="text-2xl font-black text-amber-600">{expiring?.length || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">7 din mein expire</p>
          </div>
          <div className="gym-card border-l-4 border-red-500">
            <p className="text-2xl font-black text-red-600">{expired?.length || 0}</p>
            <p className="text-xs text-gray-500 mt-0.5">Expire ho chuki (30d)</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
          <button
            onClick={() => setTab('expiring')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors
              ${tab === 'expiring' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            ⚠️ Jaldi Expire ({expiring?.length || 0})
          </button>
          <button
            onClick={() => setTab('expired')}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors
              ${tab === 'expired' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
          >
            🔴 Expire ({expired?.length || 0})
          </button>
        </div>

        {/* List */}
        <div className="space-y-2">
          {list?.length === 0 && (
            <div className="text-center py-12">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-3" />
              <p className="text-gray-500">
                {tab === 'expiring' ? 'Koi membership expire nahi ho rahi' : 'Koi expired membership nahi'}
              </p>
            </div>
          )}

          {list?.map((item: any) => {
            const daysLeft = Math.ceil(
              (new Date(item.endDate).getTime() - Date.now()) / 86400000
            );
            const isExpired = daysLeft < 0;
            const urgent = daysLeft <= 3 && !isExpired;

            return (
              <div
                key={item.id}
                className={`gym-card ${urgent ? 'border-red-200 bg-red-50' : isExpired ? 'border-gray-200 bg-gray-50' : 'border-amber-100 bg-amber-50'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center font-bold text-lg
                    ${urgent ? 'bg-red-100 text-red-700' : isExpired ? 'bg-gray-200 text-gray-600' : 'bg-amber-100 text-amber-700'}`}>
                    {item.member?.name?.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{item.member?.name}</p>
                    <p className="text-xs text-gray-500">{item.member?.phone} • {item.plan?.name}</p>
                    <p className="text-xs mt-0.5">
                      <span className="text-gray-400">Expiry: </span>
                      <span className={`font-medium ${urgent || isExpired ? 'text-red-600' : 'text-amber-700'}`}>
                        {new Date(item.endDate).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </span>
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <span className={`text-sm font-bold
                      ${isExpired ? 'text-red-600' : urgent ? 'text-red-600' : 'text-amber-600'}`}>
                      {isExpired ? `${Math.abs(daysLeft)}d ago` : daysLeft === 0 ? 'Aaj!' : `${daysLeft}d`}
                    </span>
                    <button
                      onClick={() => sendReminder(item.member?.id, item.member?.name)}
                      disabled={sendingId === item.member?.id}
                      className="flex items-center gap-1 bg-green-500 text-white px-2.5 py-1 rounded-lg text-xs font-medium active:scale-95 transition-transform disabled:opacity-50"
                    >
                      {sendingId === item.member?.id ? '⏳' : <MessageCircle className="w-3 h-3" />}
                      WA
                    </button>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                  <button
                    onClick={() => router.push(`/members/${item.member?.id}`)}
                    className="flex-1 text-xs text-gray-600 bg-white border border-gray-200 py-1.5 rounded-lg font-medium"
                  >
                    Profile Dekho
                  </button>
                  <button
                    onClick={() => router.push(`/payments/collect?memberId=${item.member?.id}`)}
                    className="flex-1 text-xs text-white bg-red-600 py-1.5 rounded-lg font-medium"
                  >
                    💰 Renew Karein
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav active="renewals" />
    </div>
  );
}
