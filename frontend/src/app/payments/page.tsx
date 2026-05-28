'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { paymentsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { IndianRupee, Plus, Download, TrendingUp, Clock, Wallet, Landmark } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const METHOD_COLORS: Record<string, string> = {
  CASH: 'bg-green-100 text-green-700 border-green-200',
  UPI: 'bg-blue-100 text-blue-700 border-blue-200',
  RAZORPAY: 'bg-purple-100 text-purple-700 border-purple-200',
  CARD: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  BANK_TRANSFER: 'bg-indigo-100 text-indigo-700 border-indigo-200',
};

const METHOD_ICONS: Record<string, string> = {
  CASH: '💵',
  UPI: '📱',
  RAZORPAY: '🌐',
  CARD: '💳',
  BANK_TRANSFER: '🏦',
};

export default function PaymentsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<'today' | 'history'>('today');

  const { data: daily } = useSWR(
    'payments-daily',
    () => paymentsApi.getDailySummary().then(r => r.data),
  );

  const { data: history } = useSWR(
    ['payments-history', tab],
    () => tab === 'history' ? paymentsApi.getHistory({ limit: 30 }).then(r => r.data) : null,
  );

  const downloadReceipt = async (paymentId: string, receiptNo: string) => {
    try {
      const res = await paymentsApi.downloadReceipt(paymentId);
      const url = URL.createObjectURL(new Blob([res.data]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `receipt-${receiptNo}.pdf`;
      a.click();
    } catch {
      toast.error('Receipt download nahi ho paya');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header title="Payments" />

      <div className="page-container">
        {/* Revenue Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4 animate-slide-up">
          <div className="premium-card bg-gradient-to-br from-green-500 via-green-600 to-emerald-700 text-white border-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium opacity-80 tracking-wide uppercase">Aaj Ki Kamayi</p>
              <Wallet className="w-4 h-4 opacity-60" />
            </div>
            <p className="text-2xl font-black tracking-tight">
              ₹{(daily?.totalRevenue || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs opacity-70 mt-1 font-medium">{daily?.transactionCount || 0} transactions</p>
          </div>
          <div className="premium-card bg-gradient-to-br from-red-500 via-red-600 to-rose-700 text-white border-0">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium opacity-80 tracking-wide uppercase">Pending Baaki</p>
              <Clock className="w-4 h-4 opacity-60" />
            </div>
            <p className="text-2xl font-black tracking-tight">
              ₹{(daily?.pendingAmount || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs opacity-70 mt-1 font-medium">Collect karna hai</p>
          </div>
        </div>

        {/* Method Breakdown */}
        {daily && (
          <div className="premium-card mb-4 animate-slide-up" style={{ animationDelay: '0.05s' }}>
            <p className="font-semibold text-gray-700 text-sm mb-3 flex items-center gap-2">
              <Landmark className="w-4 h-4 text-red-500" />
              Payment Method Breakdown
            </p>
            <div className="grid grid-cols-3 gap-2">
              <MethodStat label="Cash" amount={daily.cash} icon="💵" />
              <MethodStat label="UPI" amount={daily.upi} icon="📱" />
              <MethodStat label="Online" amount={daily.online} icon="🌐" />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={() => router.push('/payments/collect')}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Payment Lo
          </button>
          <button
            onClick={() => router.push('/payments/pending')}
            className="btn-secondary flex items-center justify-center gap-2"
          >
            <Clock className="w-4 h-4" /> Pending
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100/80 p-1 rounded-xl mb-4 backdrop-blur-sm animate-slide-up" style={{ animationDelay: '0.15s' }}>
          {(['today', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`tab-premium ${tab === t ? 'active' : ''}`}
            >
              {t === 'today' ? 'Aaj' : 'History'}
            </button>
          ))}
        </div>

        {/* Transactions */}
        <div className="space-y-2">
          {(tab === 'today' ? daily?.transactions : history?.data)?.map((p: any, i: number) => (
            <div key={p.id} className="premium-card flex items-center gap-3 animate-slide-up" style={{ animationDelay: `${i * 0.03}s` }}>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-lg ring-1 ring-black/5">
                {METHOD_ICONS[p.method] || '💳'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {p.member?.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${METHOD_COLORS[p.method] || 'bg-gray-100 text-gray-700'}`}>
                    {p.method}
                  </span>
                  <span className="text-xs text-gray-400 font-mono">{p.receiptNumber}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-green-600">₹{p.totalAmount?.toLocaleString('en-IN')}</p>
                <button
                  onClick={() => downloadReceipt(p.id, p.receiptNumber)}
                  className="text-xs text-red-600 flex items-center gap-0.5 ml-auto mt-0.5 font-medium hover:text-red-700 transition-colors"
                >
                  <Download className="w-3 h-3" /> Receipt
                </button>
              </div>
            </div>
          ))}

          {(!daily?.transactions?.length && tab === 'today') && (
            <div className="text-center py-16 animate-fade-in">
              <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                <IndianRupee className="w-8 h-8 text-green-500" />
              </div>
              <p className="text-gray-500 font-medium">Aaj koi payment nahi aayi</p>
              <p className="text-gray-400 text-sm mt-1">Jab payment hogi to yahan dikhegi</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav active="payments" />
    </div>
  );
}

function MethodStat({ label, amount, icon }: { label: string; amount: number; icon: string }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl p-3 text-center ring-1 ring-black/5">
      <p className="text-lg mb-1">{icon}</p>
      <p className="text-xs text-gray-500 mb-0.5 font-medium">{label}</p>
      <p className="font-bold text-sm text-gray-900">₹{(amount || 0).toLocaleString('en-IN')}</p>
    </div>
  );
}
