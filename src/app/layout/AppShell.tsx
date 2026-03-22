import { Outlet } from 'react-router-dom';

import { BottomNav } from '@/app/layout/BottomNav';
import { PixelCat } from '@/components/PixelCat';

export function AppShell() {
  return (
    <div className="min-h-screen bg-[#f5f5f0] text-stone-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f8f6ee] shadow-[0_20px_60px_rgba(28,25,23,0.12)]">
        <header className="border-b border-stone-200/80 px-6 py-5">
          <p className="text-xs uppercase tracking-[0.4em] text-stone-500">Golden Sentences</p>
          <div className="mt-3 flex items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-2xl text-stone-900">金句</h1>
              <p className="mt-1 text-sm text-stone-500">留住今天想记住的一句话</p>
            </div>
            <div className="flex items-center gap-3 rounded-[1.25rem] border border-stone-200/80 bg-white/80 px-3 py-2 shadow-sm">
              <PixelCat className="text-stone-700" size={20} />
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-[0.28em] text-stone-400">Slow Read</p>
                <p className="mt-1 text-xs text-stone-700">慢慢读</p>
              </div>
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
