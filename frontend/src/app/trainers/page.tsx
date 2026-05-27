'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { trainersApi, attendanceApi } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';
import { Star, Users, CheckCircle, Clock } from 'lucide-react';
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
      toast.success('Check-in ho gaya! 💪');
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
    <div className="min-h-screen bg-gray-50">
      <Header title="Trainers" />

      <div className="page-container">
        {/* Self Check-in (for trainers) */}
        {user?.role === 'TRAINER' && (
          <div className="gym-card mb-4 bg-gradient-to-br from-red-600 to-red-700 text-white">
            <p className="font-bold text-lg mb-3">Apni Attendance</p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={handleSelfCheckIn}
                disabled={checkingIn}
                className="bg-white text-red-700 font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform"
              >
                <CheckCircle className="w-4 h-4" />
                Check In
              </button>
              <button
                onClick={handleSelfCheckOut}
                disabled={checkingIn}
                className="bg-red-500 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform border border-red-400"
              >
                <Clock className="w-4 h-4" />
                Check Out
              </button>
            </div>
          </div>
        )}

        {/* Trainers List */}
        <div className="section-header">
          <h2 className="text-base font-bold text-gray-900">Trainer Team</h2>
          <span className="text-sm text-gray-400">{trainers?.length || 0} trainers</span>
        </div>

        {isLoading ? (
          <TrainersSkeleton />
        ) : (
          <div className="space-y-3">
            {trainers?.map((trainer: any) => (
              <TrainerCard
                key={trainer.id}
                trainer={trainer}
                onClick={() => router.push(`/trainers/${trainer.id}`)}
              />
            ))}
          </div>
        )}
      </div>

      <BottomNav active="trainers" />
    </div>
  );
}

function TrainerCard({ trainer, onClick }: { trainer: any; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full gym-card flex items-center gap-4 text-left active:scale-[0.98] transition-transform"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {trainer.profilePhotoUrl ? (
          <img src={trainer.profilePhotoUrl} alt={trainer.name}
            className="w-14 h-14 rounded-2xl object-cover" />
        ) : (
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-black text-xl">
            {trainer.name.charAt(0)}
          </div>
        )}
        <span className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white
          ${trainer.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-bold text-gray-900">{trainer.name}</p>
        <p className="text-xs text-gray-500 mt-0.5 truncate">
          {trainer.specialization?.join(', ') || 'General Fitness'}
        </p>
        <div className="flex items-center gap-3 mt-1.5">
          <span className="flex items-center gap-1 text-xs text-gray-600">
            <Users className="w-3 h-3" />
            {trainer._count?.trainedMembers || 0} members
          </span>
          {trainer.rating > 0 && (
            <span className="flex items-center gap-1 text-xs text-amber-600">
              <Star className="w-3 h-3 fill-amber-500" />
              {trainer.rating?.toFixed(1)}
            </span>
          )}
          {trainer.experience && (
            <span className="text-xs text-gray-500">{trainer.experience}yr exp</span>
          )}
        </div>
      </div>

      {/* Commission badge */}
      {trainer.commission > 0 && (
        <div className="flex-shrink-0 bg-green-50 px-2.5 py-1 rounded-xl">
          <p className="text-xs font-bold text-green-700">{trainer.commission}%</p>
          <p className="text-xs text-green-500">comm.</p>
        </div>
      )}
    </button>
  );
}

function TrainersSkeleton() {
  return (
    <div className="space-y-3 animate-pulse">
      {[1, 2, 3].map(i => (
        <div key={i} className="gym-card flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-gray-200" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
