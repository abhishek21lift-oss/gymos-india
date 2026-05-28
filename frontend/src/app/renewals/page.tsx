'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { renewalsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { MessageCircle, AlertTriangle, Clock, CheckCircle, RefreshCw, User, ChevronRight } from 'lucide-react';
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
      toast.success(`${memberName} ko reminder bhej diya!`);
    } catch {
      toast.error('Reminder nahi bhej paya');
    } finally {
      setSendingId(null);
    }
  };

  const list = tab === 'expiring' ? expiring : expired;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header title="Renewals" />

      <div className="page-container">
        {/* Summary */}
        <div className="grid grid-cols-2 gap-3 mb-4 animate-slide-up">
          <div className="premium-card border-l-4 border-amber-400 bg-gradient-to-r from-amber-50/50 to-transparent">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">7 din mein expire</p>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <p className="text-3xl font-black text-amber-600 mt-1">{expiring?.length || 0}</p>
          </div>
          <div className="premium-card border-l-4 border-red-500 bg-gradient-to-r from-red-50/50 to-transparent">
            <div className="flex items-center justify-between">
              <p className="text-xs text-gray-500 font-medium tracking-wide uppercase">Expire ho chuki (30d)</p>
              <Clock className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-3xl font-black text-red-600 mt-1">{expired?.length || 0}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100/80 p-1 rounded-xl mb-4 backdrop-blur-sm animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <button
            onClick={() => setTab('expiring')}
            className={`tab-premium ${tab === 'expiring' ? 'active' : ''}`}
          >
            Jaldi Expire ({expiring?.length || 0})
          </button>
          <button
            onClick={() => setTab('expired')}
            className={`tab-premium ${tab === 'expired' ? 'active' : ''}`}
          >
            Expire ({expired?.length || 0})
          </button>
        </div>

        {/* List */}
        <div className="space-y-2">
          {list?.length === 0 && (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-gray-500 font-medium">
                {tab === 'expiring' ? 'Koi membership expire nahi ho rahi' : 'Koi expired membership nahi'}
              </p>
              <p className="text-gray-400 text-sm mt-1">Sab perfect hai!</p>
            </div>
          )}

          {list?.map((item: any, i: number) => {
            const daysLeft = Math.ceil(
              (new Date(item.endDate).getTime() - Date.now()) / 86400000
            );
            const isExpired = daysLeft < 0;
            const urgent = daysLeft <= 3 && !isExpired;

            return (
              <div
                key={item.id}
                className={`premium-card animate-slide-up ${urgent ? 'ring-1 ring-red-200' : isExpired ? 'opacity-80' : ''}`}
                style={{ animationDelay: `${i * 0.03}s` }}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-sm
                    ${urgent ? 'bg-gradient-to-br from-red-100 to-rose-100 text-red-700' : isExpired ? 'bg-gradient-to-br from-gray-100 to-gray-200 text-gray-600' : 'bg-gradient-to-br from-amber-100 to-orange-100 text-amber-700'}`}>
                    {item.member?.name?.charAt(0)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 text-sm">{item.member?.name}</p>
                    <p className="text-xs text-gray-500">{item.member?.phone} • {item.plan?.name}</p>
                    <p className="text-xs mt-0.5">
                      <span className="text-gray-400">Expiry: </span>
                      <span className={`font-semibold ${urgent || isExpired ? 'text-red-600' : 'text-amber-700'}`}>
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
                      className="flex items-center gap-1.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold active:scale-95 transition-all duration-200 shadow-md shadow-green-500/20 disabled:opacity-50"
                    >
                      {sendingId === item.member?.id ? (
                        <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <MessageCircle className="w-3 h-3" />
                      )}
                      WA
                    </button>
                  </div>
                </div>

                {/* Action Row */}
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={() => router.push(`/members/${item.member?.id}`)}
                    className="flex-1 text-xs font-semibold text-gray-600 bg-gray-50 border border-gray-200 py-2 rounded-xl hover:bg-gray-100 transition-colors"
                  >
                    Profile Dekho
                  </button>
                  <button
                    onClick={() => router.push(`/payments/collect?memberId=${item.member?.id}`)}
                    className="flex-1 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-orange-500 py-2 rounded-xl shadow-md shadow-red-600/20 hover:shadow-lg transition-all"
                  >
                    Renew Karein
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
