import type { PropsWithChildren, ReactNode } from 'react';
import { Link } from 'react-router-dom';

type AuthLayoutProps = PropsWithChildren<{
  title: string;
  description: string;
  footer?: ReactNode;
}>;

export function AuthLayout({ title, description, footer, children }: AuthLayoutProps) {
  return (
    <div className="min-h-screen bg-[#f5f5f0] px-6 py-10 text-stone-900">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] w-full max-w-md flex-col justify-center">
        <Link to="/" className="mb-6 text-sm text-stone-500 transition-colors hover:text-stone-900">
          返回首页
        </Link>

        <section className="space-y-6">
          <p className="text-xs uppercase tracking-[0.35em] text-stone-400">Auth</p>
          <h1 className="mt-3 font-serif text-3xl text-stone-900">{title}</h1>
          <p className="mt-3 text-sm leading-6 text-stone-600">{description}</p>

          <div className="space-y-5 border-t border-stone-200/70 pt-6">{children}</div>
          {footer ? <div className="mt-6 text-sm text-stone-500">{footer}</div> : null}
        </section>
      </div>
    </div>
  );
}
