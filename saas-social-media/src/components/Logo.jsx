export default function Logo({ className = "" }) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand text-sm font-bold text-white">S</div>
      <span className="font-bold tracking-tight">SaaS Social Media</span>
    </div>
  );
}
