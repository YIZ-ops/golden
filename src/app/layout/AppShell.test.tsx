import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { AppShell } from '@/app/layout/AppShell';

describe('AppShell', () => {
  it('does not render the slow-read card', () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<div>stub page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.queryByText('慢慢读')).not.toBeInTheDocument();
  });

  it.each([
    ['/', '首页', '今天想读哪一句'],
    ['/categories', '分类', '按主题和作者慢慢找'],
    ['/favorites', '收藏', '把想反复读的句子留在这里'],
    ['/settings', '设置', '管理账号与偏好'],
  ])('renders the shared header for %s', (path, title, description) => {
    render(
      <MemoryRouter initialEntries={[path]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<div>home page</div>} />
            <Route path="categories" element={<div>categories page</div>} />
            <Route path="favorites" element={<div>favorites page</div>} />
            <Route path="settings" element={<div>settings page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { name: title })).toBeInTheDocument();
    expect(screen.getByText(description)).toBeInTheDocument();
  });
});
