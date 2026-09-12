import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "@/app/components/LogoutButton";
import { getSession } from "@/lib/auth";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <main className="mx-auto flex min-h-full w-full max-w-xl flex-col px-5 py-10">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="font-display text-xs uppercase tracking-[0.35em] text-muted">
            A Bit Cold
          </p>
          <h1 className="mt-2 font-display text-4xl uppercase leading-none tracking-wide">
            Visual World
          </h1>
        </div>
        <LogoutButton />
      </div>

      <p className="mt-6 text-sm text-muted">Signed in as {session.name}.</p>

      <div className="mt-10 flex flex-col gap-3">
        <Link
          href="/upload"
          className="flex min-h-24 items-center justify-center rounded-sm border border-line bg-card px-4 text-center font-display text-xl uppercase tracking-wide hover:border-muted"
        >
          Upload images
        </Link>
        <Link
          href="/board"
          className="flex min-h-24 items-center justify-center rounded-sm bg-foreground px-4 text-center font-display text-xl uppercase tracking-wide text-background"
        >
          View board
        </Link>
      </div>
    </main>
  );
}
