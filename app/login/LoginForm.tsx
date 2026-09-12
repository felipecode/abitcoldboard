"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MEMBERS } from "@/lib/members";

export function LoginForm() {
  const router = useRouter();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!memberId) {
      setError("Pick your name.");
      return;
    }

    setPending(true);
    setError(null);

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, password }),
    });

    if (!response.ok) {
      setError("Wrong name or password.");
      setPending(false);
      return;
    }

    router.replace("/");
    router.refresh();
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {MEMBERS.map((member) => {
          const selected = member.id === memberId;
          return (
            <button
              key={member.id}
              type="button"
              onClick={() => setMemberId(member.id)}
              className={`min-h-14 rounded-sm border px-4 text-left text-lg tracking-wide ${
                selected
                  ? "border-accent bg-accent text-foreground"
                  : "border-line bg-card text-foreground hover:border-muted"
              }`}
            >
              {member.displayName}
            </button>
          );
        })}
      </div>

      <label className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-muted">Password</span>
        <input
          type="password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="min-h-12 rounded-sm border border-line bg-card px-3 text-base outline-none focus:border-muted"
        />
      </label>

      {error ? <p className="text-sm text-accent">{error}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-sm bg-foreground text-background text-sm uppercase tracking-[0.18em] disabled:opacity-50"
      >
        {pending ? "Entering…" : "Enter"}
      </button>
    </form>
  );
}
