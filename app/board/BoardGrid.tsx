"use client";

import { useEffect, useState } from "react";
import type { ReferenceCard } from "@/lib/types";
import { relativeTime } from "@/lib/relative-time";

export function BoardGrid({ references }: { references: ReferenceCard[] }) {
  const [active, setActive] = useState<ReferenceCard | null>(null);

  useEffect(() => {
    if (!active) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setActive(null);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active]);

  if (references.length === 0) {
    return (
      <p className="mt-16 text-sm text-muted">No references yet. Upload the first one.</p>
    );
  }

  return (
    <>
      <div className="mt-8 columns-1 gap-4 sm:columns-2 lg:columns-3">
        {references.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setActive(item)}
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
          onClick={() => setActive(null)}
        >
          <button
            type="button"
            className="self-end text-sm uppercase tracking-[0.18em] text-muted hover:text-foreground"
            onClick={() => setActive(null)}
          >
            Close
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={active.url}
            alt={active.caption || "Reference"}
            className="mx-auto my-auto max-h-[80vh] max-w-full object-contain"
          />
          <div className="mx-auto max-w-xl text-center">
            {active.caption ? <p className="text-base">{active.caption}</p> : null}
            <p className="mt-1 text-xs text-muted">
              {active.submitterName} · {relativeTime(active.created_at)}
            </p>
          </div>
        </div>
      ) : null}
    </>
  );
}
