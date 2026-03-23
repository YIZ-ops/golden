import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { ReflectionPanel } from '@/components/reflection/ReflectionPanel';

describe('ReflectionPanel', () => {
  it('shows shared loading for the list', () => {
    render(
      <ReflectionPanel
        draft=""
        items={[]}
        loading
        onClose={vi.fn()}
        onDelete={vi.fn()}
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
        onDelete={vi.fn()}
        onDraftChange={vi.fn()}
        onSubmit={vi.fn()}
        open
        submitting
      />,
    );

    expect(screen.getByRole('button', { name: '提交感悟' })).toContainElement(screen.getByLabelText('loading-cat'));
  });

  it('formats the reflection time and supports deleting an item', async () => {
    const user = userEvent.setup();
    const onDelete = vi.fn();

    render(
      <ReflectionPanel
        draft=""
        items={[
          {
            content: "这句让我想到很多事",
            createdAt: "2024-03-01T12:30:00.000Z",
            id: "reflection-1",
          },
        ]}
        loading={false}
        onClose={vi.fn()}
        onDelete={onDelete}
        onDraftChange={vi.fn()}
        onSubmit={vi.fn()}
        open
      />,
    );

    expect(screen.getByText("2024/03/01 20:30")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "删除感悟" }));
    expect(onDelete).toHaveBeenCalledWith("reflection-1");
  });
});
