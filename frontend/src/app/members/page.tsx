'use client';

import { useState, useCallback } from 'react';
import useSWR from 'swr';
import { membersApi } from '@/lib/api';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { Search, Plus, Filter, QrCode, Phone } from 'lucide-react';
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
    <div className="min-h-screen bg-gray-50">
      <Header title="Members" />

      <div className="page-container">
        {/* Search Bar */}
        <div className="relative mb-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="gym-input pl-10"
            placeholder="Naam ya phone se dhundho..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        {/* Status Filter Pills */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1 mb-4">
          {STATUS_FILTERS.map(f => (
            <button
              key={f.value}
              onClick={() => { setStatus(f.value); setPage(1); }}
              className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors
                ${status === f.value
                  ? 'bg-red-600 text-white'
                  : 'bg-white text-gray-600 border border-gray-200'}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Stats Bar */}
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-sm text-gray-500">
            {data?.meta?.total || 0} members mile
          </p>
          <button
            onClick={() => router.push('/members/add')}
            className="flex items-center gap-1.5 bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-semibold active:scale-95 transition-transform"
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
            {data?.data?.map((member: any) => (
              <MemberCard
                key={member.id}
                member={member}
                onClick={() => router.push(`/members/${member.id}`)}
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
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40"
            >
              ← Pichla
            </button>
            <span className="px-4 py-2 text-sm text-gray-500">
              {page} / {data.meta.totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(data.meta.totalPages, p + 1))}
              disabled={page === data.meta.totalPages}
              className="px-4 py-2 rounded-xl border border-gray-200 text-sm disabled:opacity-40"
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

function MemberCard({ member, onClick }: { member: any; onClick: () => void }) {
  const activeMembership = member.memberships?.[0];
  const daysLeft = activeMembership
    ? Math.ceil((new Date(activeMembership.endDate).getTime() - Date.now()) / 86400000)
    : null;

  const statusColor = {
    ACTIVE: 'bg-green-100 text-green-700',
    EXPIRED: 'bg-red-100 text-red-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    SUSPENDED: 'bg-gray-100 text-gray-700',
  }[member.status] || 'bg-gray-100 text-gray-700';

  return (
    <button
      onClick={onClick}
      className="w-full gym-card flex items-center gap-3 text-left active:scale-[0.98] transition-transform"
    >
      {/* Avatar */}
      <div className="relative flex-shrink-0">
        {member.profilePhotoUrl ? (
          <img src={member.profilePhotoUrl} alt={member.name}
            className="w-12 h-12 rounded-full object-cover" />
        ) : (
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-lg">
            {member.name.charAt(0)}
          </div>
        )}
        <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-white
          ${member.status === 'ACTIVE' ? 'bg-green-500' : 'bg-gray-300'}`} />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-gray-900 truncate">{member.name}</p>
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${statusColor}`}>
            {member.status}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
          <span>{member.memberId}</span>
          <span>•</span>
          <span>{member.phone}</span>
        </div>
        {activeMembership && (
          <p className="text-xs mt-0.5">
            <span className="text-gray-500">{activeMembership.plan?.name}</span>
            {daysLeft !== null && (
              <span className={`ml-2 font-medium ${daysLeft <= 7 ? 'text-red-600' : 'text-gray-500'}`}>
                {daysLeft <= 0 ? 'Expire!' : `${daysLeft}d baki`}
              </span>
            )}
          </p>
        )}
      </div>

      {/* Visit Count */}
      <div className="text-right flex-shrink-0">
        <p className="text-sm font-bold text-gray-700">{member._count?.attendance || 0}</p>
        <p className="text-xs text-gray-400">visits</p>
      </div>
    </button>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">🏋️</div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Koi member nahi mila</h3>
      <p className="text-gray-500 text-sm mb-6">Apna pehla member add karein!</p>
      <button onClick={onAdd} className="btn-primary max-w-xs mx-auto">
        + Member Jodan
      </button>
    </div>
  );
}

function MembersSkeleton() {
  return (
    <div className="space-y-2 animate-pulse">
      {[1,2,3,4,5].map(i => (
        <div key={i} className="gym-card flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-gray-200" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 rounded w-32 mb-2" />
            <div className="h-3 bg-gray-200 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
