import { Outlet, useLocation } from 'react-router-dom';

import { BottomNav } from '@/app/layout/BottomNav';

const HEADER_COPY = [
  { path: '/settings', title: '设置', description: '管理账号与偏好' },
  { path: '/favorites', title: '收藏', description: '把想反复读的句子留在这里' },
  { path: '/categories', title: '分类', description: '按主题和作者慢慢找' },
  { path: '/', title: '首页', description: '今天想读哪一句' },
] as const;

export function AppShell() {
  const { pathname } = useLocation();
  const header = HEADER_COPY.find((item) => item.path === '/' || pathname.startsWith(item.path)) ?? HEADER_COPY.at(-1)!;

  return (
    <div className="min-h-screen bg-[#f5f5f0] text-stone-900">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[#f8f6ee] shadow-[0_20px_60px_rgba(28,25,23,0.12)]">
        <header className="border-b border-stone-200/80 px-6 py-5">
          <h1 className="font-serif text-2xl text-stone-900">{header.title}</h1>
          <p className="mt-1 text-sm text-stone-500">{header.description}</p>
        </header>

        <main className="flex-1 overflow-y-auto px-6 py-5 pb-28">
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
