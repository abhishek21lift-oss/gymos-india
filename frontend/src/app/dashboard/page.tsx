'use client';

import { useEffect, useState } from 'react';
import { dashboardApi, renewalsApi } from '@/lib/api';
import { useAuthStore } from '@/lib/store';
import { BottomNav } from '@/components/layout/BottomNav';
import { Header } from '@/components/layout/Header';
import { StatCard } from '@/components/shared/StatCard';
import {
  IndianRupee, Users, UserCheck, AlertTriangle,
  Clock, TrendingUp, Zap, RefreshCw, Dumbbell,
} from 'lucide-react';
import { RevenueChart } from '@/components/shared/RevenueChart';
import toast from 'react-hot-toast';

export default function DashboardPage() {
  const { user } = useAuthStore();
  const [data, setData] = useState<any>(null);
  const [expiringMembers, setExpiringMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = async () => {
    try {
      const [dashRes, expiringRes] = await Promise.all([
        dashboardApi.getOwnerDashboard(),
        renewalsApi.getExpiring(7),
      ]);
      setData(dashRes.data);
      setExpiringMembers(expiringRes.data);
    } catch {
      toast.error('Dashboard load nahi ho paya');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Suprabhat';
    if (h < 17) return 'Namaskar';
    return 'Shubh Sandhya';
  };

  if (loading) return <DashboardSkeleton />;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Header title="GymOS" showNotification showProfile />

      <div className="page-container">
        {/* Greeting */}
        <div className="mb-6 animate-slide-up">
          <p className="text-sm font-medium text-gray-500">{greeting()}</p>
          <h1 className="text-2xl font-black text-gray-900 tracking-tight mt-0.5">
            {user?.name}
          </h1>
          {user?.organization?.name && (
            <div className="flex items-center gap-2 mt-1">
              <span className="premium-badge">
                <Dumbbell className="w-3 h-3" />
                {user.organization.name}
              </span>
            </div>
          )}
        </div>

        {/* Revenue Cards */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <StatCard
            label="Aaj Ki Kamayi"
            value={`₹${(data?.todayRevenue || 0).toLocaleString('en-IN')}`}
            sublabel={`${data?.todayTransactions || 0} transactions`}
            icon={<IndianRupee className="w-5 h-5 text-green-600" />}
            color="green"
          />
          <StatCard
            label="Is Mahine"
            value={`₹${(data?.monthRevenue || 0).toLocaleString('en-IN')}`}
            sublabel="Total Revenue"
            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
            color="blue"
          />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <StatCard
            label="Aaj Aaye"
            value={data?.todayAttendance || 0}
            sublabel={`/ ${data?.totalActiveMembers || 0} members`}
            icon={<UserCheck className="w-5 h-5 text-indigo-600" />}
            color="indigo"
          />
          <StatCard
            label="Pending Baaki"
            value={`₹${(data?.pendingAmount || 0).toLocaleString('en-IN')}`}
            sublabel={`${data?.pendingCount || 0} members`}
            icon={<Clock className="w-5 h-5 text-orange-600" />}
            color="orange"
            urgent={data?.pendingCount > 0}
          />
        </div>

        {/* Alerts Section */}
        {(data?.expiringThisWeek > 0 || data?.absentCount > 0) && (
          <div className="mb-5 animate-slide-up">
            <div className="section-header">
              <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                Dhyan Dijiye
              </h2>
            </div>

            <div className="space-y-2">
              {data?.expiringThisWeek > 0 && (
                <a href="/renewals" className="flex items-center justify-between premium-card border-l-4 border-amber-400 bg-gradient-to-r from-amber-50/80 to-transparent">
                  <div>
                    <p className="font-semibold text-amber-900 text-sm">
                      {data.expiringThisWeek} Membership Expire Hone Wali
                    </p>
                    <p className="text-xs text-amber-700">Agle 7 dinon mein</p>
                  </div>
                  <span className="text-amber-600 text-xl font-bold">{data.expiringThisWeek}</span>
                </a>
              )}

              {data?.absentCount > 0 && (
                <div className="flex items-center justify-between premium-card border-l-4 border-red-400 bg-gradient-to-r from-red-50/80 to-transparent">
                  <div>
                    <p className="font-semibold text-red-900 text-sm">
                      {data.absentCount} Members 5+ Din Se Nahi Aaye
                    </p>
                    <p className="text-xs text-red-700">Follow up karein</p>
                  </div>
                  <span className="text-red-600 text-xl font-bold">{data.absentCount}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expiring Members */}
        {expiringMembers.length > 0 && (
          <div className="mb-5 animate-slide-up">
            <div className="section-header">
              <h2 className="text-base font-bold text-gray-900">Jaldi Expire Honge</h2>
              <a href="/renewals" className="text-red-600 text-sm font-medium hover:text-red-700 transition-colors">Sab Dekho →</a>
            </div>

            <div className="space-y-2">
              {expiringMembers.slice(0, 5).map((m: any, i: number) => (
                <ExpiringMemberCard key={m.id} data={m} index={i} />
              ))}
            </div>
          </div>
        )}

        {/* Revenue Chart */}
        <div className="mb-5 animate-slide-up">
          <div className="section-header">
            <h2 className="text-base font-bold text-gray-900">Revenue Chart</h2>
            <span className="text-xs text-gray-400 font-medium">Last 30 days</span>
          </div>
          <div className="premium-card p-3">
            <RevenueChart />
          </div>
        </div>

        {/* Recent Payments */}
        {data?.recentPayments?.length > 0 && (
          <div className="mb-5 animate-slide-up">
            <div className="section-header">
              <h2 className="text-base font-bold text-gray-900">Recent Payments</h2>
              <a href="/payments" className="text-red-600 text-sm font-medium hover:text-red-700 transition-colors">Sab Dekho →</a>
            </div>
            <div className="premium-card divide-y divide-gray-100">
              {data.recentPayments.map((p: any) => (
                <div key={p.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="font-semibold text-sm text-gray-900">{p.member?.name}</p>
                    <p className="text-xs text-gray-500">{p.member?.memberId} • {p.method}</p>
                  </div>
                  <span className="font-bold text-green-600">₹{p.totalAmount?.toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="mb-5 animate-slide-up">
          <h2 className="text-base font-bold text-gray-900 mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            <QuickAction href="/members/add" icon={<Users className="w-5 h-5" />} label="Member Jodan" color="from-red-500 to-orange-500" />
            <QuickAction href="/attendance" icon={<UserCheck className="w-5 h-5" />} label="Attendance" color="from-blue-500 to-indigo-500" />
            <QuickAction href="/payments/collect" icon={<IndianRupee className="w-5 h-5" />} label="Payment Lo" color="from-green-500 to-emerald-500" />
          </div>
        </div>
      </div>

      <BottomNav active="dashboard" />
    </div>
  );
}

function ExpiringMemberCard({ data, index }: { data: any; index: number }) {
  const daysLeft = Math.ceil(
    (new Date(data.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const urgent = daysLeft <= 3;

  return (
    <div className={`premium-card flex items-center justify-between ${urgent ? 'ring-1 ring-red-200' : ''} animate-slide-up`}
         style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="flex items-center gap-3">
        <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold
          ${urgent ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
          {data.member?.name?.charAt(0)}
        </div>
        <div>
          <p className="font-semibold text-sm text-gray-900">{data.member?.name}</p>
          <p className="text-xs text-gray-500">{data.plan?.name} • {data.member?.phone}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={`text-sm font-bold ${urgent ? 'text-red-600' : 'text-amber-600'}`}>
          {daysLeft === 0 ? 'Aaj!' : `${daysLeft}d`}
        </p>
        <p className="text-xs text-gray-400">baki</p>
      </div>
    </div>
  );
}

function QuickAction({ href, icon, label, color }: { href: string; icon: React.ReactNode; label: string; color: string }) {
  return (
    <a href={href}
       className="premium-card flex flex-col items-center gap-2.5 py-5 active:scale-95 transition-all duration-200 group">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white shadow-lg shadow-current/20 group-hover:scale-110 transition-transform duration-300`}>
        {icon}
      </div>
      <span className="text-xs font-semibold text-gray-700 text-center">{label}</span>
    </a>
  );
}

function DashboardSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <div className="page-container animate-pulse">
        <div className="h-4 skeleton-pulse w-24 mb-2" />
        <div className="h-7 skeleton-pulse w-48 mb-1 mt-0.5" />
        <div className="h-5 skeleton-pulse w-32 mb-6" />
        <div className="grid grid-cols-2 gap-3 mb-3">
          {[1, 2, 3, 4].map(i => <div key={i} className="h-28 skeleton-pulse rounded-2xl" />)}
        </div>
        <div className="h-40 skeleton-pulse rounded-2xl mb-4" />
      </div>
    </div>
  );
}
