interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="app-input rounded-[2rem] border border-dashed p-6 text-center">
      <h3 className="app-text font-serif text-xl">{title}</h3>
      <p className="app-muted mt-3 text-sm leading-6">{description}</p>
    </div>
  );
}
