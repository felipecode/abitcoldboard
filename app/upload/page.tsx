import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { UploadForm } from "./UploadForm";

export default async function UploadPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <main className="mx-auto flex min-h-full w-full max-w-xl flex-col px-5 py-10">
      <Link href="/" className="text-sm text-muted hover:text-foreground">
        Back
      </Link>
      <h1 className="mt-6 font-display text-4xl uppercase leading-none tracking-wide">
        Add reference
      </h1>
      <p className="mt-3 mb-8 text-sm text-muted">
        Phone photos are fine. We shrink them so the shared board stays light.
      </p>
      <UploadForm />
    </main>
  );
}
