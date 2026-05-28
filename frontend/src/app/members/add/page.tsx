'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { membersApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { User, Phone, Target, AlertCircle, ChevronRight, ChevronLeft, Check } from 'lucide-react';
import toast from 'react-hot-toast';

const GOALS = [
  { value: 'WEIGHT_LOSS', label: 'Weight Loss' },
  { value: 'MUSCLE_GAIN', label: 'Muscle Gain' },
  { value: 'STRENGTH', label: 'Strength' },
  { value: 'GENERAL_FITNESS', label: 'General Fitness' },
  { value: 'ENDURANCE', label: 'Endurance' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function AddMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);

  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (formData: any) => {
    setLoading(true);
    try {
      const res = await membersApi.create(formData);
      toast.success(`${formData.name} add ho gaye!`);
      router.push(`/members/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kuch gadbad ho gayi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header title="Naya Member" showBack />

      <div className="page-container">
        {/* Premium Step Indicator */}
        <div className="flex items-center gap-3 mb-8 animate-slide-up">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center flex-1">
              <div className="flex items-center gap-2">
                <div className={`relative w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold transition-all duration-300
                  ${s === step
                    ? 'bg-gradient-to-br from-red-500 to-orange-500 text-white shadow-lg shadow-red-500/30 scale-110'
                    : s < step
                      ? 'bg-gradient-to-br from-green-400 to-emerald-500 text-white shadow-lg shadow-green-500/20'
                      : 'bg-gray-100 text-gray-400'}`}>
                  {s < step ? <Check className="w-5 h-5" /> : s}
                </div>
                <span className={`text-xs font-semibold hidden sm:block transition-colors
                  ${s === step ? 'text-red-600' : s < step ? 'text-green-600' : 'text-gray-400'}`}>
                  {s === 1 ? 'Basic' : s === 2 ? 'Health' : 'Emergency'}
                </span>
              </div>
              {s < 3 && (
                <div className="flex-1 mx-3">
                  <div className={`h-0.5 rounded-full transition-all duration-500 ${s < step ? 'bg-gradient-to-r from-green-400 to-emerald-500' : 'bg-gray-200'}`} />
                </div>
              )}
            </div>
          ))}
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4 animate-slide-up">
              <div className="premium-card space-y-5">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
                    <User className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Basic Jaankari</h2>
                    <p className="text-xs text-gray-500">Member ki basic details</p>
                  </div>
                </div>

                <div>
                  <label className="gym-label">Naam *</label>
                  <input
                    {...register('name', { required: 'Naam zaruri hai' })}
                    className="gym-input"
                    placeholder="Poora naam likhein"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.name.message as string}</p>}
                </div>

                <div>
                  <label className="gym-label">Mobile Number *</label>
                  <input
                    {...register('phone', {
                      required: 'Phone zaruri hai',
                      pattern: { value: /^[6-9]\d{9}$/, message: '10 digit Indian number chahiye' }
                    })}
                    className="gym-input"
                    placeholder="9876543210"
                    type="tel"
                    maxLength={10}
                  />
                  {errors.phone && <p className="text-red-500 text-xs mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errors.phone.message as string}</p>}
                </div>

                <div>
                  <label className="gym-label">Email (Optional)</label>
                  <input {...register('email')} className="gym-input" placeholder="email@example.com" type="email" />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="gym-label">Gender</label>
                    <select {...register('gender')} className="gym-input">
                      <option value="">Select</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="gym-label">Janam Tarikh</label>
                    <input {...register('dateOfBirth')} className="gym-input" type="date" />
                  </div>
                </div>

                <div>
                  <label className="gym-label">Goal</label>
                  <select {...register('goal')} className="gym-input">
                    <option value="">Goal Select Karein</option>
                    {GOALS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                  </select>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn-primary flex items-center justify-center gap-2"
              >
                Aage <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Step 2: Health Info */}
          {step === 2 && (
            <div className="space-y-4 animate-slide-up">
              <div className="premium-card space-y-5">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-100 to-indigo-100 flex items-center justify-center">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Health Info</h2>
                    <p className="text-xs text-gray-500">Body measurements & health details</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="gym-label">Weight (kg)</label>
                    <input {...register('currentWeight')} className="gym-input" type="number" placeholder="70" />
                  </div>
                  <div>
                    <label className="gym-label">Height (cm)</label>
                    <input {...register('height')} className="gym-input" type="number" placeholder="170" />
                  </div>
                  <div>
                    <label className="gym-label">Target (kg)</label>
                    <input {...register('targetWeight')} className="gym-input" type="number" placeholder="65" />
                  </div>
                </div>

                <div>
                  <label className="gym-label">Blood Group</label>
                  <select {...register('bloodGroup')} className="gym-input">
                    <option value="">Select</option>
                    {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>

                <div>
                  <label className="gym-label">Medical Notes (Optional)</label>
                  <textarea
                    {...register('medicalNotes')}
                    className="gym-input resize-none"
                    rows={3}
                    placeholder="Koi bimari, injury ya allergy ho to likhein..."
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(1)}
                  className="btn-secondary flex items-center justify-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Wapas
                </button>
                <button type="button" onClick={() => setStep(3)}
                  className="btn-primary flex items-center justify-center gap-2">
                  Aage <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Emergency Contact */}
          {step === 3 && (
            <div className="space-y-4 animate-slide-up">
              <div className="premium-card space-y-5">
                <div className="flex items-center gap-3 pb-2 border-b border-gray-100">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-100 to-orange-100 flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <h2 className="font-bold text-gray-900">Emergency Contact</h2>
                    <p className="text-xs text-gray-500">Koi mushkil ho to</p>
                  </div>
                </div>

                <div>
                  <label className="gym-label">Contact Ka Naam</label>
                  <input {...register('emergencyName')} className="gym-input" placeholder="Family member ka naam" />
                </div>
                <div>
                  <label className="gym-label">Contact Ka Number</label>
                  <input {...register('emergencyPhone')} className="gym-input" placeholder="9876543210" type="tel" />
                </div>
                <div>
                  <label className="gym-label">Rishta (Relation)</label>
                  <select {...register('emergencyRelation')} className="gym-input">
                    <option value="">Select</option>
                    <option value="Mother">Maa</option>
                    <option value="Father">Papa</option>
                    <option value="Spouse">Spouse</option>
                    <option value="Sibling">Bhai/Behen</option>
                    <option value="Friend">Dost</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="gym-label">Notes</label>
                  <textarea {...register('notes')} className="gym-input resize-none" rows={2}
                    placeholder="Koi additional info..." />
                </div>
              </div>

              <div className="flex gap-3">
                <button type="button" onClick={() => setStep(2)}
                  className="btn-secondary flex items-center justify-center gap-2">
                  <ChevronLeft className="w-4 h-4" /> Wapas
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                  ) : (
                    <><Check className="w-4 h-4" /> Member Add Karein</>
                  )}
                </button>
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
}
