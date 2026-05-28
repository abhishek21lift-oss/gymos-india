'use client';

import { useRouter } from 'next/navigation';
import { ArrowLeft, Bell, User } from 'lucide-react';
import { useAuthStore } from '@/lib/store';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showNotification?: boolean;
  showProfile?: boolean;
  rightElement?: React.ReactNode;
}

export function Header({
  title,
  showBack = false,
  showNotification = false,
  showProfile = false,
  rightElement,
}: HeaderProps) {
  const router = useRouter();
  const { user } = useAuthStore();

  return (
    <header className="sticky top-0 z-40 safe-top">
      <div className="absolute inset-0 bg-white/80 backdrop-blur-xl border-b border-black/5" />
      <div className="relative max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/5 active:scale-90 transition-all duration-200"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}

        <h1 className="flex-1 text-lg font-black text-gray-900 truncate tracking-tight">{title}</h1>

        <div className="flex items-center gap-1">
          {showNotification && (
            <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/5 active:scale-90 transition-all duration-200 relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse" />
            </button>
          )}

          {showProfile && (
            <button
              onClick={() => router.push('/profile')}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-black/5 active:scale-90 transition-all duration-200"
            >
              {user?.name ? (
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                  {user.name.charAt(0)}
                </div>
              ) : (
                <User className="w-5 h-5 text-gray-600" />
              )}
            </button>
          )}

          {rightElement}
        </div>
      </div>
    </header>
  );
}
