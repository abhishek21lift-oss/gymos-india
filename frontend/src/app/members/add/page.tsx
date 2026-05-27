'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { membersApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { ChevronDown, User, Phone, Calendar, Target, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

const GOALS = [
  { value: 'WEIGHT_LOSS', label: '⚖️ Weight Loss' },
  { value: 'MUSCLE_GAIN', label: '💪 Muscle Gain' },
  { value: 'STRENGTH', label: '🏋️ Strength' },
  { value: 'GENERAL_FITNESS', label: '🏃 General Fitness' },
  { value: 'ENDURANCE', label: '🔥 Endurance' },
];

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

export default function AddMemberPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1); // 1=basic, 2=health, 3=emergency

  const { register, handleSubmit, watch, formState: { errors } } = useForm();

  const onSubmit = async (formData: any) => {
    setLoading(true);
    try {
      const res = await membersApi.create(formData);
      toast.success(`${formData.name} add ho gaye! 🎉`);
      router.push(`/members/${res.data.id}`);
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Kuch gadbad ho gayi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header title="Naya Member" showBack />

      <div className="page-container">
        {/* Step Indicator */}
        <div className="flex items-center gap-2 mb-6">
          {[1, 2, 3].map(s => (
            <div key={s} className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                ${s === step ? 'bg-red-600 text-white' : s < step ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                {s < step ? '✓' : s}
              </div>
              {s < 3 && <div className={`h-0.5 w-8 mx-1 ${s < step ? 'bg-green-500' : 'bg-gray-200'}`} />}
            </div>
          ))}
          <span className="text-sm text-gray-500 ml-2">
            {step === 1 ? 'Basic Info' : step === 2 ? 'Health Info' : 'Emergency'}
          </span>
        </div>

        <form onSubmit={handleSubmit(onSubmit)}>
          {/* Step 1: Basic Info */}
          {step === 1 && (
            <div className="space-y-4 animate-slide-up">
              <div className="gym-card space-y-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-red-600" /> Basic Jaankari
                </h2>

                <div>
                  <label className="gym-label">Naam *</label>
                  <input
                    {...register('name', { required: 'Naam zaruri hai' })}
                    className="gym-input"
                    placeholder="Poora naam likhein"
                  />
                  {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name.message as string}</p>}
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
                  {errors.phone && <p className="text-red-500 text-xs mt-1">{errors.phone.message as string}</p>}
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
                className="btn-primary"
              >
                Aage →
              </button>
            </div>
          )}

          {/* Step 2: Health Info */}
          {step === 2 && (
            <div className="space-y-4 animate-slide-up">
              <div className="gym-card space-y-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <Target className="w-4 h-4 text-red-600" /> Health Info
                </h2>

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
                <button type="button" onClick={() => setStep(1)} className="btn-secondary">← Wapas</button>
                <button type="button" onClick={() => setStep(3)} className="btn-primary">Aage →</button>
              </div>
            </div>
          )}

          {/* Step 3: Emergency Contact */}
          {step === 3 && (
            <div className="space-y-4 animate-slide-up">
              <div className="gym-card space-y-4">
                <h2 className="font-bold text-gray-900 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-600" /> Emergency Contact
                </h2>

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
                <button type="button" onClick={() => setStep(2)} className="btn-secondary">← Wapas</button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><span className="animate-spin">⏳</span> Saving...</>
                  ) : (
                    '✅ Member Add Karein'
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
