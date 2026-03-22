import { Suspense } from 'react';
import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';

import { LoadingScreen } from '@/components/common/LoadingScreen';
import { createAppRouter } from '@/app/router';

describe('App router', () => {
  it('renders the home route and primary navigation', async () => {
    render(
      <Suspense fallback={<LoadingScreen label="页面加载中..." />}>
        <RouterProvider router={createAppRouter(['/'])} />
      </Suspense>,
    );

    expect(await screen.findByRole('heading', { name: '首页' })).toBeInTheDocument();
    expect(screen.getByText('今天想读哪一句')).toBeInTheDocument();
    expect(await screen.findByTestId('home-quote-page')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '首页' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '分类' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '收藏' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '设置' })).toBeInTheDocument();
  });

  it.each([
    ['/categories', '分类', '按主题和作者慢慢找'],
    ['/favorites', '收藏', '把想反复读的句子留在这里'],
    ['/settings', '设置', '管理账号与偏好'],
  ])('renders %s with the shared section header', async (path, heading, description) => {
    render(
      <Suspense fallback={<LoadingScreen label="页面加载中..." />}>
        <RouterProvider router={createAppRouter([path])} />
      </Suspense>,
    );

    expect(await screen.findByRole('heading', { name: heading })).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });
});
