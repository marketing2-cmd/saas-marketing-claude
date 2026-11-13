import { STATUSES } from "@/lib/posts";

export default function StatusBadge({ status, className = "" }) {
  const s = STATUSES[status] || STATUSES.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-semibold ${s.color} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
