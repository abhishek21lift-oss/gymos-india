'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { paymentsApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { IndianRupee, Plus, Download, TrendingUp, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';

const METHOD_COLORS: Record<string, string> = {
  CASH: 'bg-green-100 text-green-700',
  UPI: 'bg-blue-100 text-blue-700',
  RAZORPAY: 'bg-purple-100 text-purple-700',
  CARD: 'bg-yellow-100 text-yellow-700',
  BANK_TRANSFER: 'bg-indigo-100 text-indigo-700',
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
    <div className="min-h-screen bg-gray-50">
      <Header title="Payments" />

      <div className="page-container">
        {/* Revenue Summary Cards */}
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="gym-card bg-gradient-to-br from-green-500 to-green-600 text-white">
            <p className="text-xs opacity-80 mb-1">Aaj Ki Kamayi</p>
            <p className="text-2xl font-black">
              ₹{(daily?.totalRevenue || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs opacity-70 mt-1">{daily?.transactionCount || 0} transactions</p>
          </div>
          <div className="gym-card bg-gradient-to-br from-red-500 to-red-600 text-white">
            <p className="text-xs opacity-80 mb-1">Pending Baaki</p>
            <p className="text-2xl font-black">
              ₹{(daily?.pendingAmount || 0).toLocaleString('en-IN')}
            </p>
            <p className="text-xs opacity-70 mt-1">Collect karna hai</p>
          </div>
        </div>

        {/* Method Breakdown */}
        {daily && (
          <div className="gym-card mb-4">
            <p className="font-semibold text-gray-700 text-sm mb-3">Payment Method Breakdown</p>
            <div className="grid grid-cols-3 gap-2">
              <MethodStat label="💵 Cash" amount={daily.cash} />
              <MethodStat label="📱 UPI" amount={daily.upi} />
              <MethodStat label="🌐 Online" amount={daily.online} />
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          <button
            onClick={() => router.push('/payments/collect')}
            className="btn-primary flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" /> Payment Lo
          </button>
          <button
            onClick={() => router.push('/payments/pending')}
            className="btn-secondary flex items-center justify-center gap-2 border border-gray-200"
          >
            <Clock className="w-4 h-4" /> Pending
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-xl mb-4">
          {(['today', 'history'] as const).map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-colors
                ${tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500'}`}
            >
              {t === 'today' ? "Aaj" : "History"}
            </button>
          ))}
        </div>

        {/* Transactions */}
        <div className="space-y-2">
          {(tab === 'today' ? daily?.transactions : history?.data)?.map((p: any) => (
            <div key={p.id} className="gym-card flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-lg">
                {p.method === 'CASH' ? '💵' : p.method === 'UPI' ? '📱' : '💳'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {p.member?.name}
                </p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${METHOD_COLORS[p.method] || 'bg-gray-100 text-gray-700'}`}>
                    {p.method}
                  </span>
                  <span className="text-xs text-gray-400">{p.receiptNumber}</span>
                </div>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="font-bold text-green-600">₹{p.totalAmount?.toLocaleString('en-IN')}</p>
                <button
                  onClick={() => downloadReceipt(p.id, p.receiptNumber)}
                  className="text-xs text-red-600 flex items-center gap-0.5 ml-auto mt-0.5"
                >
                  <Download className="w-3 h-3" /> Receipt
                </button>
              </div>
            </div>
          ))}

          {!daily?.transactions?.length && tab === 'today' && (
            <div className="text-center py-12">
              <p className="text-4xl mb-2">💰</p>
              <p className="text-gray-500 text-sm">Aaj koi payment nahi aayi</p>
            </div>
          )}
        </div>
      </div>

      <BottomNav active="payments" />
    </div>
  );
}

function MethodStat({ label, amount }: { label: string; amount: number }) {
  return (
    <div className="bg-gray-50 rounded-xl p-2 text-center">
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className="font-bold text-sm text-gray-900">₹{(amount || 0).toLocaleString('en-IN')}</p>
    </div>
  );
}
