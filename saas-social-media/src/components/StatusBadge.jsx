import { STATUSES } from "@/lib/posts";

export default function StatusBadge({ status, className = "" }) {
  const s = STATUSES[status] || STATUSES.draft;
  return (
    <span className={`chip ${s.color} ${className}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
      {s.label}
    </span>
  );
}
