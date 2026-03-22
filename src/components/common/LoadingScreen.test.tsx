import { render, screen } from '@testing-library/react';

import { LoadingScreen } from '@/components/common/LoadingScreen';

describe('LoadingScreen', () => {
  it('renders status semantics with the provided label', () => {
    render(<LoadingScreen label="页面加载中..." />);

    expect(screen.getByRole('status')).toHaveTextContent('页面加载中...');
    expect(screen.getByLabelText('loading-cat')).toBeInTheDocument();
  });

  it('renders compact loading', () => {
    render(<LoadingScreen compact label="感悟加载中..." />);

    expect(screen.getByRole('status')).toHaveTextContent('感悟加载中...');
  });
});
