"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_CAPTION } from "@/lib/images";
import type { ReferenceCard } from "@/lib/types";
import { relativeTime } from "@/lib/relative-time";

export function BoardGrid({
  references,
  currentMemberId,
  emptyLabel,
}: {
  references: ReferenceCard[];
  currentMemberId: string;
  emptyLabel: string;
}) {
  const router = useRouter();
  const [items, setItems] = useState(references);
  const [active, setActive] = useState<ReferenceCard | null>(null);
  const [draft, setDraft] = useState("");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setItems(references);
    setActive((current) =>
      current && references.some((item) => item.id === current.id) ? current : null,
    );
  }, [references]);

  useEffect(() => {
    if (!active) return;
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (editing || confirmDelete) {
        setEditing(false);
        setConfirmDelete(false);
        setError(null);
        return;
      }
      setActive(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, confirmDelete, editing]);

  function open(item: ReferenceCard) {
    setActive(item);
    setDraft(item.caption ?? "");
    setEditing(false);
    setConfirmDelete(false);
    setError(null);
  }

  function close() {
    if (pending) return;
    setActive(null);
    setEditing(false);
    setConfirmDelete(false);
    setError(null);
  }

  async function saveCaption(event: React.FormEvent) {
    event.preventDefault();
    if (!active) return;

    const caption = draft.trim();
    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/references/${active.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ caption }),
      });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error ?? "Could not update that image.");
      }

      const nextCaption = caption || null;
      setItems((current) =>
        current.map((item) => (item.id === active.id ? { ...item, caption: nextCaption } : item)),
      );
      setActive((current) => (current ? { ...current, caption: nextCaption } : current));
      setEditing(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not update that image.");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!active) return;

    setPending(true);
    setError(null);

    try {
      const response = await fetch(`/api/references/${active.id}`, { method: "DELETE" });
      const data = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        throw new Error(data?.error ?? "Could not delete that image.");
      }

      setItems((current) => current.filter((item) => item.id !== active.id));
      setActive(null);
      setConfirmDelete(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not delete that image.");
    } finally {
      setPending(false);
    }
  }

  if (items.length === 0) {
    return <p className="mt-16 text-sm text-muted">{emptyLabel}</p>;
  }

  return (
    <>
      <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => open(item)}
            className="mb-4 block w-full break-inside-avoid overflow-hidden rounded-sm bg-card text-left"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.url} alt={item.caption || "Reference"} className="w-full" />
            <div className="px-3 py-3">
              {item.caption ? <p className="text-sm">{item.caption}</p> : null}
              <p className="mt-1 text-xs text-muted">
                {item.submitterName} · {relativeTime(item.created_at)}
              </p>
            </div>
          </button>
        ))}
      </div>

      {active ? (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex flex-col bg-black/95 p-4"
          onClick={() => {
            if (!editing && !confirmDelete) close();
          }}
        >
          <button
            type="button"
            className="self-end text-sm uppercase tracking-[0.18em] text-muted hover:text-foreground"
            onClick={close}
          >
            Close
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt={active.caption || "Reference"}
            className="mx-auto my-auto max-h-[80vh] max-w-full object-contain"
          />
          <div
            className="mx-auto w-full max-w-xl text-center"
            onClick={(event) => event.stopPropagation()}
          >
            {active.submitter === currentMemberId ? (
              editing ? (
                <form onSubmit={saveCaption} className="flex flex-col gap-3">
                  <input
                    type="text"
                    maxLength={MAX_CAPTION}
                    value={draft}
                    onChange={(event) => setDraft(event.target.value)}
                    placeholder="What do you like about this?"
                    className="min-h-12 rounded-sm border border-line bg-card px-3 text-center text-base outline-none focus:border-muted"
                    autoFocus
                  />
                  <div className="flex justify-center gap-3">
                    <button
                      type="submit"
                      disabled={pending}
                      className="min-h-10 px-3 text-sm uppercase tracking-[0.18em] disabled:opacity-50"
                    >
                      {pending ? "Saving…" : "Save"}
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      className="min-h-10 px-3 text-sm uppercase tracking-[0.18em] text-muted hover:text-foreground disabled:opacity-50"
                      onClick={() => {
                        setDraft(active.caption ?? "");
                        setEditing(false);
                        setError(null);
                      }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <>
                  {active.caption ? (
                    <p className="text-base">{active.caption}</p>
                  ) : (
                    <p className="text-base text-muted">No note yet</p>
                  )}
                  <p className="mt-1 text-xs text-muted">
                    {active.submitterName} · {relativeTime(active.created_at)}
                  </p>
                  {confirmDelete ? (
                    <div className="mt-4 flex flex-col items-center gap-3">
                      <p className="text-sm">Remove this from the inbox?</p>
                      <div className="flex justify-center gap-3">
                        <button
                          type="button"
                          disabled={pending}
                          className="min-h-10 px-3 text-sm uppercase tracking-[0.18em] text-accent disabled:opacity-50"
                          onClick={remove}
                        >
                          {pending ? "Deleting…" : "Delete"}
                        </button>
                        <button
                          type="button"
                          disabled={pending}
                          className="min-h-10 px-3 text-sm uppercase tracking-[0.18em] text-muted hover:text-foreground disabled:opacity-50"
                          onClick={() => {
                            setConfirmDelete(false);
                            setError(null);
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4 flex justify-center gap-3">
                      <button
                        type="button"
                        className="min-h-10 px-3 text-sm uppercase tracking-[0.18em] text-muted hover:text-foreground"
                        onClick={() => {
                          setDraft(active.caption ?? "");
                          setEditing(true);
                          setError(null);
                        }}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="min-h-10 px-3 text-sm uppercase tracking-[0.18em] text-muted hover:text-foreground"
                        onClick={() => {
                          setConfirmDelete(true);
                          setError(null);
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
                </>
              )
            ) : (
              <>
                {active.caption ? <p className="text-base">{active.caption}</p> : null}
                <p className="mt-1 text-xs text-muted">
                  {active.submitterName} · {relativeTime(active.created_at)}
                </p>
              </>
            )}
            {error ? <p className="mt-3 text-sm text-accent">{error}</p> : null}
          </div>
        </div>
      ) : null}
    </>
  );
}
