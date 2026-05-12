export function IconButton({ children, className = "", label, ...props }) {
  return (
    <button
      aria-label={label}
      className={`inline-flex h-9 w-9 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 shadow-sm transition hover:border-zinc-400 hover:bg-zinc-50 ${className}`}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}
