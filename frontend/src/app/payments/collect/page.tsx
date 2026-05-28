'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { membersApi, paymentsApi, plansApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Search, User, IndianRupee, Wallet, Smartphone, CheckCircle, Phone } from 'lucide-react';
import toast from 'react-hot-toast';
import useSWR from 'swr';

type PayMethod = 'CASH' | 'UPI';

export default function CollectPaymentPage() {
  const router = useRouter();
  const [searchPhone, setSearchPhone] = useState('');
  const [member, setMember] = useState<any>(null);
  const [method, setMethod] = useState<PayMethod>('CASH');
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);

  const { data: plans } = useSWR('plans', () => plansApi.getAll().then(r => r.data));

  const { register, handleSubmit, watch, reset } = useForm({
    defaultValues: { amount: '', planId: '', upiTxnId: '', notes: '' },
  });

  const searchMember = async () => {
    if (!/^[6-9]\d{9}$/.test(searchPhone)) {
      toast.error('Sahi phone number daalo');
      return;
    }
    setSearchLoading(true);
    try {
      const res = await membersApi.search(searchPhone);
      if (res.data) {
        setMember(res.data);
        toast.success(`${res.data.name} mil gaye!`);
      } else {
        toast.error('Member nahi mila. Pehle add karein.');
      }
    } catch {
      toast.error('Search failed');
    } finally {
      setSearchLoading(false);
    }
  };

  const onSubmit = async (formData: any) => {
    if (!member) { toast.error('Pehle member dhundho'); return; }
    if (!formData.amount || Number(formData.amount) <= 0) {
      toast.error('Sahi amount daalo');
      return;
    }
    if (method === 'UPI' && !formData.upiTxnId) {
      toast.error('UPI Transaction ID zaruri hai');
      return;
    }

    setLoading(true);
    try {
      let res;
      if (method === 'CASH') {
        res = await paymentsApi.recordCash({
          memberId: member.id,
          amount: Number(formData.amount),
          membershipId: formData.planId ? undefined : member.memberships?.[0]?.id,
          notes: formData.notes,
        });
      } else {
        res = await paymentsApi.recordUpi({
          memberId: member.id,
          amount: Number(formData.amount),
          upiTransactionId: formData.upiTxnId,
          membershipId: member.memberships?.[0]?.id,
        });
      }

      toast.success(`₹${formData.amount} ka payment record ho gaya!`);

      if (formData.planId) {
        await membersApi.assignMembership(member.id, {
          planId: formData.planId,
          startDate: new Date().toISOString(),
          amountPaid: Number(formData.amount),
        });
        toast.success('Membership bhi activate ho gayi!');
      }

      reset();
      setMember(null);
      setSearchPhone('');
      router.push('/payments');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Payment record nahi ho paya');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header title="Payment Lo" showBack />

      <div className="page-container space-y-4">
        {/* Member Search */}
        <div className="premium-card animate-slide-up">
          <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Search className="w-4 h-4 text-red-500" />
            Member Dhundho
          </h2>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                className="gym-input pl-10"
                type="tel"
                placeholder="Mobile number daalo..."
                maxLength={10}
                value={searchPhone}
                onChange={e => setSearchPhone(e.target.value.replace(/\D/g, ''))}
                onKeyDown={e => e.key === 'Enter' && searchMember()}
              />
              <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
            <button
              onClick={searchMember}
              disabled={searchLoading}
              className="bg-gradient-to-r from-red-600 to-orange-500 text-white px-5 rounded-xl active:scale-95 transition-all duration-200 disabled:opacity-50 shadow-lg shadow-red-600/20"
            >
              {searchLoading ? (
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <Search className="w-5 h-5" />
              )}
            </button>
          </div>

          {member && (
            <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50/50 rounded-2xl border border-green-200/50 animate-scale-in">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold shadow-lg">
                  {member.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-green-900">{member.name}</p>
                  <p className="text-xs text-green-700 font-medium">{member.memberId} • {member.phone}</p>
                  {member.memberships?.[0] && (
                    <p className="text-xs text-green-600 mt-0.5">
                      Plan: {member.memberships[0].plan?.name} |
                      Exp: {new Date(member.memberships[0].endDate).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
            </div>
          )}
        </div>

        {/* Payment Form */}
        {member && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Method Toggle */}
            <div className="premium-card animate-slide-up" style={{ animationDelay: '0.05s' }}>
              <h2 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                <Wallet className="w-4 h-4 text-red-500" />
                Payment Method
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {(['CASH', 'UPI'] as PayMethod[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`py-3.5 rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2
                      ${method === m
                        ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-600/20 scale-[1.02]'
                        : 'bg-gray-50 text-gray-600 border border-gray-200 hover:bg-gray-100'}`}
                  >
                    {m === 'CASH' ? <><IndianRupee className="w-4 h-4" /> Cash</> : <><Smartphone className="w-4 h-4" /> UPI</>}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount & Plan */}
            <div className="premium-card space-y-5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
              <div>
                <label className="gym-label">Amount (₹) *</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold">₹</span>
                  <input
                    {...register('amount', { required: true })}
                    className="gym-input pl-8 text-2xl font-bold tracking-tight"
                    type="number"
                    placeholder="0"
                  />
                </div>
              </div>

              <div>
                <label className="gym-label">Membership Plan (Optional)</label>
                <select {...register('planId')} className="gym-input">
                  <option value="">Plan select karein (optional)</option>
                  {plans?.map((p: any) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — ₹{p.price} ({p.durationDays} din)
                    </option>
                  ))}
                </select>
              </div>

              {method === 'UPI' && (
                <div>
                  <label className="gym-label">UPI Transaction ID *</label>
                  <input
                    {...register('upiTxnId')}
                    className="gym-input"
                    placeholder="UPI reference number"
                  />
                </div>
              )}

              <div>
                <label className="gym-label">Notes (Optional)</label>
                <input {...register('notes')} className="gym-input" placeholder="Koi note likhein..." />
              </div>
            </div>

            <button type="submit" disabled={loading}
              className="btn-primary flex items-center justify-center gap-2 text-lg">
              {loading ? (
                <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Record ho raha hai...</>
              ) : (
                <><CheckCircle className="w-5 h-5" /> ₹{watch('amount') || 0} Record Karein</>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
