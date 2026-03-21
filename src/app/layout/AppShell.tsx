import { Outlet } from 'react-router-dom';

import { BottomNav } from '@/app/layout/BottomNav';
import { cn } from '@/utils/cn';

export function AppShell() {
  return (
    <div className="min-h-screen bg-[#f5f5f0] text-stone-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f8f6ee] shadow-[0_20px_60px_rgba(28,25,23,0.12)]">
        <header className="border-b border-stone-200/80 px-6 py-5">
          <p className="text-xs uppercase tracking-[0.4em] text-stone-500">Golden Sentences</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl text-stone-900">金句</h1>
              <p className="mt-1 text-sm text-stone-500">Chunk 1 已完成一级路由骨架拆分</p>
            </div>
            <div
              className={cn(
                'rounded-full border border-amber-300/80 bg-amber-100 px-3 py-1 text-xs font-medium text-amber-900',
              )}
            >
              App Shell
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-6 pb-28">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
