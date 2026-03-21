import { render, screen } from '@testing-library/react';
import { RouterProvider } from 'react-router-dom';

import { createAppRouter } from '@/app/router';

describe('App router', () => {
  it('renders the home route and primary navigation', () => {
    render(<RouterProvider router={createAppRouter(['/'])} />);

    expect(screen.getByRole('heading', { name: '首页' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '首页' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '分类' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '收藏' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '设置' })).toBeInTheDocument();
  });

  it.each([
    ['/categories', '分类'],
    ['/favorites', '收藏'],
    ['/settings', '设置'],
  ])('renders %s as %s', (path, heading) => {
    render(<RouterProvider router={createAppRouter([path])} />);

    expect(screen.getByRole('heading', { name: heading })).toBeInTheDocument();
  });
});
