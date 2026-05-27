'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { membersApi, paymentsApi, plansApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Search } from 'lucide-react';
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

      toast.success(`₹${formData.amount} ka payment record ho gaya! ✅`);

      // Assign membership if plan selected
      if (formData.planId) {
        await membersApi.assignMembership(member.id, {
          planId: formData.planId,
          startDate: new Date().toISOString(),
          amountPaid: Number(formData.amount),
        });
        toast.success('Membership bhi activate ho gayi! 🎉');
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
    <div className="min-h-screen bg-gray-50">
      <Header title="Payment Lo" showBack />

      <div className="page-container space-y-4">
        {/* Member Search */}
        <div className="gym-card">
          <h2 className="font-bold text-gray-900 mb-3">Member Dhundho</h2>
          <div className="flex gap-2">
            <input
              className="gym-input flex-1"
              type="tel"
              placeholder="Mobile number daalo..."
              maxLength={10}
              value={searchPhone}
              onChange={e => setSearchPhone(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && searchMember()}
            />
            <button
              onClick={searchMember}
              disabled={searchLoading}
              className="bg-red-600 text-white px-4 rounded-xl active:scale-95 transition-transform disabled:opacity-50"
            >
              {searchLoading ? '⏳' : <Search className="w-5 h-5" />}
            </button>
          </div>

          {member && (
            <div className="mt-3 p-3 bg-green-50 rounded-xl border border-green-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center text-green-700 font-bold">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-green-900">{member.name}</p>
                  <p className="text-xs text-green-700">{member.memberId} • {member.phone}</p>
                  {member.memberships?.[0] && (
                    <p className="text-xs text-green-600">
                      Plan: {member.memberships[0].plan?.name} |
                      Expires: {new Date(member.memberships[0].endDate).toLocaleDateString('en-IN')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Payment Form */}
        {member && (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Method Toggle */}
            <div className="gym-card">
              <h2 className="font-bold text-gray-900 mb-3">Payment Method</h2>
              <div className="grid grid-cols-2 gap-3">
                {(['CASH', 'UPI'] as PayMethod[]).map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setMethod(m)}
                    className={`py-3 rounded-xl font-semibold text-sm transition-all
                      ${method === m
                        ? 'bg-red-600 text-white shadow-md'
                        : 'bg-gray-100 text-gray-600'}`}
                  >
                    {m === 'CASH' ? '💵 Cash' : '📱 UPI'}
                  </button>
                ))}
              </div>
            </div>

            {/* Amount & Plan */}
            <div className="gym-card space-y-4">
              <div>
                <label className="gym-label">Amount (₹) *</label>
                <input
                  {...register('amount', { required: true })}
                  className="gym-input text-2xl font-bold"
                  type="number"
                  placeholder="0"
                />
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

            <button type="submit" disabled={loading} className="btn-primary">
              {loading ? '⏳ Record ho raha hai...' : `✅ ₹${watch('amount') || 0} Record Karein`}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
