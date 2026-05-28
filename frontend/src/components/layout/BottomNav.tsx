'use client';

import Link from 'next/link';
import { LayoutDashboard, Users, CheckSquare, IndianRupee, RotateCcw } from 'lucide-react';

type NavTab = 'dashboard' | 'members' | 'attendance' | 'payments' | 'renewals' | 'trainers';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Home', icon: LayoutDashboard, href: '/dashboard' },
  { id: 'members', label: 'Members', icon: Users, href: '/members' },
  { id: 'attendance', label: 'Attendance', icon: CheckSquare, href: '/attendance' },
  { id: 'payments', label: 'Payments', icon: IndianRupee, href: '/payments' },
  { id: 'renewals', label: 'Renewals', icon: RotateCcw, href: '/renewals' },
];

export function BottomNav({ active }: { active: NavTab }) {
  return (
    <nav className="bottom-nav">
      {NAV_ITEMS.map(item => {
        const Icon = item.icon;
        const isActive = active === item.id;
        return (
          <Link key={item.id} href={item.href} className={`nav-item ${isActive ? 'active' : ''}`}>
            <Icon className={`w-5 h-5 transition-all duration-300 ${isActive ? 'scale-110 stroke-[2.5]' : 'stroke-[1.5]'}`} />
            <span className={`text-[10px] tracking-wide transition-all duration-300 ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
