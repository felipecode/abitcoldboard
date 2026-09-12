import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { listReferences } from "@/lib/store";
import type { ReferenceCard } from "@/lib/types";
import { BoardGrid } from "./BoardGrid";

export default async function BoardPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  let references: ReferenceCard[] = [];
  let error: string | null = null;
  try {
    references = await listReferences();
  } catch (err) {
    error = err instanceof Error ? err.message : "Could not load the board.";
  }

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
        </div>
        <Link
          href="/upload"
          className="text-sm uppercase tracking-[0.18em] text-muted hover:text-foreground"
        >
          Add
        </Link>
      </div>
      {error ? <p className="mt-10 text-sm text-accent">{error}</p> : <BoardGrid references={references} />}
    </main>
  );
}
