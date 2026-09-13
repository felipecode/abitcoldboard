import Link from "next/link";
import { MEMBERS } from "@/lib/members";

function pillClass(active: boolean) {
  return `inline-flex min-h-10 items-center gap-2 rounded-sm border px-3 text-sm tracking-wide ${
    active
      ? "border-accent bg-accent text-foreground"
      : "border-line bg-card text-foreground hover:border-muted"
  }`;
}

export function BoardFilters({
  selected,
  counts,
}: {
  selected: string | null;
  counts: Record<string, number>;
}) {
  const total = Object.values(counts).reduce((sum, count) => sum + count, 0);

  return (
    <nav className="mt-8 flex flex-wrap gap-2" aria-label="Inbox filters">
      <Link href="/board" scroll={false} className={pillClass(!selected)}>
        All
        <span className={selected ? "text-foreground/70" : "text-muted"}>{total}</span>
      </Link>
      {MEMBERS.map((member) => {
        const active = selected === member.id;
        return (
          <Link
            key={member.id}
            href={`/board?member=${member.id}`}
            scroll={false}
            className={pillClass(active)}
          >
            {member.displayName}
            <span className={active ? "text-foreground/70" : "text-muted"}>
              {counts[member.id] ?? 0}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
