import { Outlet, useLocation } from "react-router-dom";

import { BottomNav } from "@/app/layout/BottomNav";
import { cn } from "@/utils/cn";

const HEADER_COPY = [
  { path: "/settings", title: "设置", description: "管理账号与偏好" },
  { path: "/favorites", title: "收藏", description: "把想反复读的句子留在这里" },
  { path: "/categories", title: "分类", description: "按主题和作者慢慢找" },
  { path: "/", title: "首页", description: "今天想读哪一句" },
] as const;

export function AppShell() {
  const { pathname } = useLocation();
  const header = HEADER_COPY.find((item) => item.path === "/" || pathname.startsWith(item.path)) ?? HEADER_COPY.at(-1)!;
  const hideHeader = pathname.startsWith("/categories/") || pathname.startsWith("/favorites/");
  const immersiveHome = pathname === "/";

  return (
    <div className="app-frame min-h-screen">
      <div className="app-surface mx-auto flex min-h-screen w-full max-w-md flex-col">
        {!hideHeader ? (
          <header className="app-border border-b px-6 py-5">
            <h1 className="app-text font-serif text-2xl">{header.title}</h1>
            <p className="app-muted mt-1 text-sm">{header.description}</p>
          </header>
        ) : null}

        <main className={cn("min-h-0 flex-1", immersiveHome ? "flex overflow-hidden pb-[4.75rem]" : "overflow-y-auto px-6 py-5 pb-22")}>
          <Outlet />
        </main>

        <BottomNav />
      </div>
    </div>
  );
}
