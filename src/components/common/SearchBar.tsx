interface SearchBarProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
}

export function SearchBar({ label, placeholder, value, onChange }: SearchBarProps) {
  return (
    <label className="block">
      <span className="sr-only">{label}</span>
      <input
        aria-label={label}
        className="w-full rounded-[1.5rem] border border-stone-200 bg-white px-4 py-4 text-sm text-stone-800 shadow-sm outline-none transition focus:border-stone-400"
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        type="search"
        value={value}
      />
    </label>
  );
}
