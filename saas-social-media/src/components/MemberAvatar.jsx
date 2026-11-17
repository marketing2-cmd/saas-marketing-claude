import { memberColor, memberInitials, memberName } from "@/lib/team";

export default function MemberAvatar({ member, size = 28, ring = false }) {
  if (!member) {
    return (
      <span className="inline-flex shrink-0 items-center justify-center rounded-full border border-dashed border-ink-mute/50 text-[10px] text-ink-mute" style={{ width: size, height: size }} title="Sem responsável">
        ?
      </span>
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold text-white ${ring ? "ring-2 ring-white" : ""}`}
      style={{ width: size, height: size, background: memberColor(member), fontSize: size * 0.38 }}
      title={memberName(member)}
    >
      {memberInitials(member)}
    </span>
  );
}
