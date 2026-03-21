interface EmptyStateProps {
  title: string;
  description: string;
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="rounded-[2rem] border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
      <h3 className="font-serif text-xl text-stone-900">{title}</h3>
      <p className="mt-3 text-sm leading-6 text-stone-500">{description}</p>
    </div>
  );
}
