import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { getMember } from "@/lib/members";
import { listReferences } from "@/lib/store";
import type { ReferenceCard } from "@/lib/types";
import { BoardFilters } from "./BoardFilters";
import { BoardGrid } from "./BoardGrid";

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default async function BoardPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getSession();
  if (!session) redirect("/login");

  const params = (await searchParams) ?? {};
  const selected = getMember(firstValue(params.member) ?? "")?.id ?? null;

  let references: ReferenceCard[] = [];
  let error: string | null = null;
  try {
    references = await listReferences();
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load the board.";
  }

  const counts = Object.fromEntries(
    references.reduce((map, item) => {
      map.set(item.submitter, (map.get(item.submitter) ?? 0) + 1);
      return map;
    }, new Map<string, number>()),
  );
  const visible = selected
    ? references.filter((item) => item.submitter === selected)
    : references;
  const selectedName = selected ? getMember(selected)?.displayName : null;

  return (
    <main className="mx-auto min-h-full w-full max-w-6xl px-5 py-10">
      <div className="flex items-end justify-between gap-4">
        <div>
          <Link href="/" className="text-sm text-muted hover:text-foreground">
            Back
          </Link>
          <h1 className="mt-4 font-display text-4xl uppercase leading-none tracking-wide">
            Inbox
          </h1>
          <p className="mt-2 text-sm text-muted">
            {selectedName ? `${selectedName}'s images` : "All images"}
          </p>
        </div>
        <Link
          href="/upload"
          className="text-sm uppercase tracking-[0.18em] text-muted hover:text-foreground"
        >
          Add
        </Link>
      </div>
      <BoardFilters selected={selected} counts={counts} />
      {error ? (
        <p className="mt-10 text-sm text-accent">{error}</p>
      ) : (
        <BoardGrid
          references={visible}
          currentMemberId={session.memberId}
          emptyLabel={
            selectedName
              ? `No images from ${selectedName} yet.`
              : "No references yet. Upload the first one."
          }
        />
      )}
    </main>
  );
}
