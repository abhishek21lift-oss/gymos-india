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
    <header className="sticky top-0 z-40 bg-white border-b border-gray-100 safe-top">
      <div className="max-w-lg mx-auto px-4 h-14 flex items-center gap-3">
        {showBack && (
          <button
            onClick={() => router.back()}
            className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </button>
        )}

        <h1 className="flex-1 text-lg font-black text-gray-900 truncate">{title}</h1>

        <div className="flex items-center gap-1">
          {showNotification && (
            <button className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100 relative">
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
            </button>
          )}

          {showProfile && (
            <button
              onClick={() => router.push('/profile')}
              className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-gray-100"
            >
              {user?.name ? (
                <div className="w-7 h-7 rounded-full bg-red-100 flex items-center justify-center text-red-700 font-bold text-xs">
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
