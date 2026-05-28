'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { trainersApi, attendanceApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Star, Users, CheckCircle, Clock, Dumbbell, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import toast from 'react-hot-toast';

export default function TrainersPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [checkingIn, setCheckingIn] = useState(false);

  const { data: trainers, isLoading } = useSWR(
    'trainers',
    () => trainersApi.getAll().then(r => r.data),
  );

  const handleSelfCheckIn = async () => {
    setCheckingIn(true);
    try {
      await attendanceApi.trainerCheckIn();
      toast.success('Check-in ho gaya!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-in failed');
    } finally {
      setCheckingIn(false);
    }
  };

  const handleSelfCheckOut = async () => {
    setCheckingIn(true);
    try {
      await attendanceApi.trainerCheckOut();
      toast.success('Check-out ho gaya!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Check-out failed');
    } finally {
      setCheckingIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header title="Trainers" />

      <div className="page-container">
        {/* Self Check-in */}
        {user?.role === 'TRAINER' && (
          <div className="premium-card bg-gradient-to-br from-red-600 via-red-700 to-rose-800 text-white border-0 mb-4 animate-slide-up">
            <p className="font-bold text-lg mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5" /> Apni Attendance
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSelfCheckIn}
                disabled={checkingIn}
                className="bg-white/20 backdrop-blur-sm text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 hover:bg-white/30 border border-white/10"
              >
                <CheckCircle className="w-4 h-4" />
                Check In
              </button>
              <button
                onClick={handleSelfCheckOut}
                disabled={checkingIn}
                className="bg-white/10 backdrop-blur-sm text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all duration-200 hover:bg-white/20 border border-white/10"
              >
                <Clock className="w-4 h-4" />
                Check Out
              </button>
            </div>
          </div>
        )}

        {/* Trainers Header */}
        <div className="section-header animate-slide-up" style={{ animationDelay: '0.05s' }}>
          <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Dumbbell className="w-4 h-4 text-red-500" />
            Trainer Team
          </h2>
          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-lg">
            {trainers?.length || 0} trainers
          </span>
        </div>

        {isLoading ? (
          <TrainersSkeleton />
        ) : (
          <div className="space-y-3">
            {trainers?.map((trainer: any, i: number) => (
              <TrainerCard
                key={trainer.id}
                trainer={trainer}
                onClick={() => router.push(`/trainers/${trainer.id}`)}
                index={i}
              />
            ))}

            {!trainers?.length && (
              <div className="text-center py-16 animate-fade-in">
                <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-500 font-medium">Koi trainer nahi hai</p>
                <p className="text-gray-400 text-sm mt-1">Trainer add karne ke liye settings mein jayein</p>
              </div>
            )}
          </div>
        )}
      </div>

      <BottomNav active="trainers" />
    </div>
  );
}

function TrainerCard({ trainer, onClick, index }: { trainer: any; onClick: () => void; index: number }) {
  return (
    <button
      onClick={onClick}
      className="w-full premium-card flex items-center gap-4 text-left active:scale-[0.98] transition-all duration-200 group animate-slide-up"
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {trainer.profilePhotoUrl ? (
          <img src={trainer.profilePhotoUrl} alt={trainer.name}
            className="w-14 h-14 rounded-2xl object-cover ring-2 ring-black/5" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 via-red-500 to-red-600 flex items-center justify-center text-white font-black text-xl shadow-sm">
            {trainer.name.charAt(0)}
          </div>
        )}
        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm
          ${trainer.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900">{trainer.name}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {trainer.specialization?.join(', ') || 'General Fitness'}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-gray-600 font-medium">
            <Users className="w-3 h-3" />
            {trainer._count?.trainedMembers || 0} members
          </span>
          {trainer.rating > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
              <Star className="w-3 h-3 fill-amber-500" />
              {trainer.rating?.toFixed(1)}
            </span>
          )}
          {trainer.experience && (
            <span className="text-xs text-gray-500 font-medium bg-gray-100 px-1.5 py-0.5 rounded-md">
              {trainer.experience}yr
            </span>
          )}
        </div>
      </div>

      {/* Commission badge */}
      <div className="flex items-center gap-2">
        {trainer.commission > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 px-3 py-1.5 rounded-xl ring-1 ring-green-200/50">
            <p className="text-xs font-bold text-green-700">{trainer.commission}%</p>
            <p className="text-[10px] text-green-500 font-medium">comm.</p>
          </div>
        )}
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
    </button>
  );
}

function TrainersSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="premium-card flex items-center gap-4 animate-pulse">
          <div className="w-14 h-14 rounded-2xl skeleton-pulse" />
          <div className="flex-1">
            <div className="h-4 skeleton-pulse rounded w-32 mb-2" />
            <div className="h-3 skeleton-pulse rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
