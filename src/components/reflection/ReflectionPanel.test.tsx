import { render, screen } from '@testing-library/react';

import { ReflectionPanel } from '@/components/reflection/ReflectionPanel';

describe('ReflectionPanel', () => {
  it('shows shared loading for the list', () => {
    render(
      <ReflectionPanel
        draft=""
        items={[]}
        loading
        onClose={vi.fn()}
        onDraftChange={vi.fn()}
        onSubmit={vi.fn()}
        open
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('感悟加载中...');
  });

  it('shows inline submit loading with a stable accessible name', () => {
    render(
      <ReflectionPanel
        draft=""
        items={[]}
        loading={false}
        onClose={vi.fn()}
        onDraftChange={vi.fn()}
        onSubmit={vi.fn()}
        open
        submitting
      />,
    );

    expect(screen.getByRole('button', { name: '提交感悟' })).toContainElement(screen.getByLabelText('loading-cat'));
  });
});
