export default function Logo({ className = "", light = false }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative flex h-8 w-8 items-center justify-center rounded-[10px] bg-gradient-to-br from-[#9B82FF] to-brand shadow-[0_6px_14px_-6px_rgba(124,92,252,.8)]">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="white" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 12.5 9.5 18 20 6.5" />
        </svg>
      </div>
      <span className={`text-[17px] font-bold tracking-tight ${light ? "text-white" : "text-ink"}`}>
        Social<span className="text-brand">Media</span>
      </span>
    </div>
  );
}
