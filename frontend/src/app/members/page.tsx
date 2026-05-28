'use client';

import { useState } from 'react';
import useSWR from 'swr';
import { membersApi } from '@/lib/api';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { Search, Plus, Users, Phone, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useDebounce } from '@/hooks/useDebounce';

const STATUS_FILTERS = [
  { label: 'Sab', value: '' },
  { label: 'Active', value: 'ACTIVE' },
  { label: 'Expire', value: 'EXPIRED' },
  { label: 'Pending', value: 'PENDING' },
];

export default function MembersPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading } = useSWR(
    ['members', debouncedSearch, status, page],
    () => membersApi.getAll({ search: debouncedSearch, status, page, limit: 20 }).then(r => r.data),
    { keepPreviousData: true }
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header title="Members" />

      <div className="page-container">
        {/* Search Bar */}
        <div className="relative mb-4 animate-slide-up">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="gym-input pl-10"
            placeholder="Naam ya phone se dhundho..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4 animate-slide-up" style={{ animationDelay: '0.05s' }}>
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1); }}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200
                ${status === f.value
                  ? 'bg-gradient-to-r from-red-600 to-orange-500 text-white shadow-lg shadow-red-600/20'
                  : 'glass-card text-gray-600 py-2 hover:bg-black/5'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Stats & Add Button */}
        <div className="flex items-center justify-between mb-4 px-0.5 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <p className="text-sm text-gray-500 font-medium">
            {data?.meta?.total || 0} members mile
          </p>
          <button
            onClick={() => router.push('/members/add')}
            className="flex items-center gap-1.5 bg-gradient-to-r from-red-600 to-orange-500 text-white px-4 py-2 rounded-xl text-sm font-semibold shadow-lg shadow-red-600/20 active:scale-95 transition-all duration-200"
          >
            <Plus className="w-4 h-4" />
            Add Member
          </button>
        </div>

        {/* Members List */}
        {isLoading ? (
          <MembersSkeleton />
        ) : data?.data?.length === 0 ? (
          <EmptyState onAdd={() => router.push('/members/add')} />
        ) : (
          <div className="space-y-2">
            {data?.data?.map((member: any, i: number) => (
              <MemberCard
                key={member.id}
                member={member}
                onClick={() => router.push(`/members/${member.id}`)}
                index={i}
              />
            ))}
          </div>
        )}

        {/* Pagination */}
        {data?.meta && data.meta.totalPages > 1 && (
          <div className="flex gap-3 justify-center mt-6">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-black/5 transition-colors"
            >
              ← Pichla
            </button>
            <span className="px-4 py-2 text-sm text-gray-500 font-medium">
              {page} / {data.meta.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))}
              disabled={page === data.meta.totalPages}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm font-medium disabled:opacity-40 hover:bg-black/5 transition-colors"
            >
              Agla →
            </button>
          </div>
        )}
      </div>

      <BottomNav active="members" />
    </div>
  );
}

function MemberCard({ member, onClick, index }: { member: any; onClick: () => void; index: number }) {
  const activeMembership = member.memberships?.[0];
  const daysLeft = activeMembership
    ? Math.ceil((new Date(activeMembership.endDate).getTime() - Date.now()) / 86400000)
    : null;

  const statusColor = {
    ACTIVE: 'bg-green-100 text-green-700 border-green-200',
    EXPIRED: 'bg-red-100 text-red-700 border-red-200',
    PENDING: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    SUSPENDED: 'bg-gray-100 text-gray-700 border-gray-200',
  }[member.status] || 'bg-gray-100 text-gray-700 border-gray-200';

  return (
    <button
      onClick={onClick}
      className="w-full premium-card flex items-center gap-3 text-left active:scale-[0.98] transition-all duration-200 group animate-slide-up"
      style={{ animationDelay: `${index * 0.03}s` }}
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {member.profilePhotoUrl ? (
          <img src={member.profilePhotoUrl} alt={member.name}
            className="w-12 h-12 rounded-2xl object-cover ring-2 ring-black/5" />
        ) : (
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white font-bold text-lg shadow-sm">
            {member.name.charAt(0)}
          </div>
        )}
        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm
          ${member.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-bold text-gray-900 truncate">{member.name}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium border ${statusColor}`}>
            {member.status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
          <span>{member.memberId}</span>
          <span className="text-gray-300">•</span>
          <span>{member.phone}</span>
        </div>
        {activeMembership && (
          <p className="text-xs mt-0.5">
            <span className="text-gray-500">{activeMembership.plan?.name}</span>
            {daysLeft !== null && (
              <span className={`ml-2 font-semibold ${daysLeft <= 7 ? 'text-red-600' : 'text-gray-500'}`}>
                {daysLeft <= 0 ? 'Expire!' : `${daysLeft}d baki`}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Visit Count + Arrow */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="text-right">
          <p className="text-lg font-black text-gray-700">{member._count?.attendance || 0}</p>
          <p className="text-xs text-gray-400">visits</p>
        </div>
        <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-gray-500 transition-colors" />
      </div>
    </button>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-16 animate-slide-up">
      <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-red-100 to-orange-100 flex items-center justify-center">
        <Users className="w-8 h-8 text-red-500" />
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Koi member nahi mila</h3>
      <p className="text-gray-500 text-sm mb-6">Apna pehla member add karein!</p>
      <button onClick={onAdd} className="btn-primary max-w-xs mx-auto flex items-center justify-center gap-2">
        <Plus className="w-4 h-4" /> Member Jodan
      </button>
    </div>
  );
}

function MembersSkeleton() {
  return (
    <div className="space-y-2">
      {[1, 2, 3, 4, 5].map(i => (
        <div key={i} className="premium-card flex items-center gap-3 animate-pulse">
          <div className="w-12 h-12 rounded-2xl skeleton-pulse" />
          <div className="flex-1">
            <div className="h-4 skeleton-pulse rounded w-32 mb-2" />
            <div className="h-3 skeleton-pulse rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
