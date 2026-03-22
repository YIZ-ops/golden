import { Suspense, lazy } from 'react';
import { createBrowserRouter, createMemoryRouter, RouterProvider, type RouteObject } from 'react-router-dom';

import { AppShell } from '@/app/layout/AppShell';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { HomePage } from '@/pages/home/HomePage';

const CategoriesPage = lazy(async () => {
  const module = await import('@/pages/categories/CategoriesPage');
  return { default: module.CategoriesPage };
});

const FavoritesPage = lazy(async () => {
  const module = await import('@/pages/favorites/FavoritesPage');
  return { default: module.FavoritesPage };
});

const SettingsPage = lazy(async () => {
  const module = await import('@/pages/settings/SettingsPage');
  return { default: module.SettingsPage };
});

const LoginPage = lazy(async () => {
  const module = await import('@/pages/auth/LoginPage');
  return { default: module.LoginPage };
});

const RegisterPage = lazy(async () => {
  const module = await import('@/pages/auth/RegisterPage');
  return { default: module.RegisterPage };
});

const ForgotPasswordPage = lazy(async () => {
  const module = await import('@/pages/auth/ForgotPasswordPage');
  return { default: module.ForgotPasswordPage };
});

const ResetPasswordPage = lazy(async () => {
  const module = await import('@/pages/auth/ResetPasswordPage');
  return { default: module.ResetPasswordPage };
});

export const appRoutes: RouteObject[] = [
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'categories', element: <CategoriesPage /> },
      { path: 'favorites', element: <FavoritesPage /> },
      { path: 'settings', element: <SettingsPage /> },
    ],
  },
  { path: '/auth/login', element: <LoginPage /> },
  { path: '/auth/register', element: <RegisterPage /> },
  { path: '/auth/forgot-password', element: <ForgotPasswordPage /> },
  { path: '/auth/reset-password', element: <ResetPasswordPage /> },
];

const browserRouter = createBrowserRouter(appRoutes);

export function createAppRouter(initialEntries?: string[]) {
  if (initialEntries) {
    return createMemoryRouter(appRoutes, {
      initialEntries,
    });
  }

  return browserRouter;
}

export function AppRouter() {
  return (
    <Suspense fallback={<LoadingScreen label="页面加载中..." />}>
      <RouterProvider router={browserRouter} />
    </Suspense>
  );
}
