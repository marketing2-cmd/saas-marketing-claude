import { HeartMascot } from "./brand";

export default function Loading() {
  return (
    <div className="flex flex-col items-center gap-2 py-20 text-sm text-ink-mute">
      <HeartMascot size={44} className="animate-bounce" />
      Carregando…
    </div>
  );
}
