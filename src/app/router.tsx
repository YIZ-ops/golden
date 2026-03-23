import { Suspense, lazy } from "react";
import { createBrowserRouter, createMemoryRouter, RouterProvider, type RouteObject } from "react-router-dom";

import { AppShell } from "@/app/layout/AppShell";
import { AppProviders } from "@/app/providers";
import { LoadingScreen } from "@/components/common/LoadingScreen";
import { HomePage } from "@/pages/home/HomePage";

const CategoriesPage = lazy(async () => {
  const module = await import("@/pages/categories/CategoriesPage");
  return { default: module.CategoriesPage };
});

const CategoryQuotesPage = lazy(async () => {
  const module = await import("@/pages/categories/CategoryQuotesPage");
  return { default: module.CategoryQuotesPage };
});

const FavoritesPage = lazy(async () => {
  const module = await import("@/pages/favorites/FavoritesPage");
  return { default: module.FavoritesPage };
});

const FavoriteFolderQuotesPage = lazy(async () => {
  const module = await import("@/pages/favorites/FavoriteFolderQuotesPage");
  return { default: module.FavoriteFolderQuotesPage };
});

const SettingsPage = lazy(async () => {
  const module = await import("@/pages/settings/SettingsPage");
  return { default: module.SettingsPage };
});

const LoginPage = lazy(async () => {
  const module = await import("@/pages/auth/LoginPage");
  return { default: module.LoginPage };
});

const RegisterPage = lazy(async () => {
  const module = await import("@/pages/auth/RegisterPage");
  return { default: module.RegisterPage };
});

const ForgotPasswordPage = lazy(async () => {
  const module = await import("@/pages/auth/ForgotPasswordPage");
  return { default: module.ForgotPasswordPage };
});

const ResetPasswordPage = lazy(async () => {
  const module = await import("@/pages/auth/ResetPasswordPage");
  return { default: module.ResetPasswordPage };
});

export const appRoutes: RouteObject[] = [
  {
    path: "/",
    element: (
      <AppProviders>
        <AppShell />
      </AppProviders>
    ),
    children: [
      { index: true, element: <HomePage /> },
      { path: "categories", element: <CategoriesPage /> },
      { path: "categories/:categoryId", element: <CategoryQuotesPage /> },
      { path: "categories/:role/:personId", element: <CategoryQuotesPage /> },
      { path: "favorites", element: <FavoritesPage /> },
      { path: "favorites/:folderId", element: <FavoriteFolderQuotesPage /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
  {
    path: "/auth/login",
    element: (
      <AppProviders>
        <LoginPage />
      </AppProviders>
    ),
  },
  {
    path: "/auth/register",
    element: (
      <AppProviders>
        <RegisterPage />
      </AppProviders>
    ),
  },
  {
    path: "/auth/forgot-password",
    element: (
      <AppProviders>
        <ForgotPasswordPage />
      </AppProviders>
    ),
  },
  {
    path: "/auth/reset-password",
    element: (
      <AppProviders>
        <ResetPasswordPage />
      </AppProviders>
    ),
  },
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
