import { Home, LayoutGrid, Settings, Star } from 'lucide-react';
import { NavLink } from 'react-router-dom';

import { cn } from '@/utils/cn';

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  end?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: '首页', icon: Home, end: true },
  { to: '/categories', label: '分类', icon: LayoutGrid },
  { to: '/favorites', label: '收藏', icon: Star },
  { to: '/settings', label: '设置', icon: Settings },
];

export function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 z-20 flex w-full max-w-md -translate-x-1/2 justify-between border-t border-stone-200/80 bg-white/95 px-6 py-4 backdrop-blur">
      {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              'flex min-w-16 flex-col items-center gap-1 rounded-2xl px-3 py-2 text-xs transition-colors',
              isActive ? 'text-stone-900' : 'text-stone-400',
            )
          }
        >
          {({ isActive }) => (
            <>
              <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
              <span className="font-medium">{label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
