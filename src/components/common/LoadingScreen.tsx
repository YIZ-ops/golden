export function LoadingScreen({ label = '金句加载中...' }: { label?: string }) {
  return (
    <div className="flex min-h-[28rem] items-center justify-center rounded-[2rem] border border-stone-200/80 bg-white p-10 shadow-sm">
      <div className="text-center">
        <div className="mx-auto h-12 w-12 animate-pulse rounded-full bg-stone-200" />
        <p className="mt-4 font-serif text-lg text-stone-700">{label}</p>
      </div>
    </div>
  );
}
