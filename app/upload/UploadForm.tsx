"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { MAX_CAPTION, MAX_FILES } from "@/lib/images";
import { resizeToJpeg, validateBatchCount, validateClientFile } from "@/lib/resize-client";

export function UploadForm() {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [caption, setCaption] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [progress, setProgress] = useState("");
  const [dragOver, setDragOver] = useState(false);

  function takeFiles(list: FileList | File[]) {
    const incoming = Array.from(list);
    const next = incoming.slice(0, MAX_FILES);
    const firstBad = next.map(validateClientFile).find(Boolean);
    if (firstBad) {
      setError(firstBad);
      return;
    }
    const countError = validateBatchCount(next.length);
    if (countError && incoming.length === 0) {
      setError(countError);
      return;
    }
    setError(incoming.length > MAX_FILES ? "Only the first 10 images will be used." : null);
    setFiles(next);
  }

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const countError = validateBatchCount(files.length);
    if (countError) {
      setError(countError);
      return;
    }

    setPending(true);
    setError(null);

    try {
      for (let index = 0; index < files.length; index += 1) {
        const file = files[index];
        const typeError = validateClientFile(file);
        if (typeError) throw new Error(typeError);

        setProgress(`Preparing ${index + 1} of ${files.length}…`);
        const blob = await resizeToJpeg(file);
        const body = new FormData();
        body.append("file", blob, `${file.name.replace(/\.[^.]+$/, "") || "reference"}.jpg`);
        body.append("caption", caption.trim());

        setProgress(`Uploading ${index + 1} of ${files.length}…`);
        const response = await fetch("/api/references", { method: "POST", body });
        const data = (await response.json().catch(() => null)) as { error?: string } | null;
        if (!response.ok) {
          throw new Error(data?.error ?? "Upload failed.");
        }
      }

      router.push("/board");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
      setPending(false);
      setProgress("");
    }
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-6">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragOver(false);
          if (event.dataTransfer.files.length) takeFiles(event.dataTransfer.files);
        }}
        className={`flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-sm border border-dashed px-4 text-center ${
          dragOver ? "border-accent bg-card" : "border-line bg-card"
        }`}
      >
        <input
          type="file"
          accept="image/*"
          multiple
          className="sr-only"
          onChange={(event) => {
            if (event.target.files?.length) takeFiles(event.target.files);
          }}
        />
        <span className="font-display text-lg uppercase tracking-wide">Drop images here</span>
        <span className="mt-2 text-sm text-muted">or tap to choose up to 10</span>
        {files.length > 0 ? (
          <span className="mt-4 text-sm text-foreground">{files.length} selected</span>
        ) : null}
      </label>

      <label className="flex flex-col gap-2">
        <span className="text-xs uppercase tracking-[0.2em] text-muted">
          What do you like about this?
        </span>
        <input
          type="text"
          maxLength={MAX_CAPTION}
          value={caption}
          onChange={(event) => setCaption(event.target.value)}
          placeholder="Optional — one sentence"
          className="min-h-12 rounded-sm border border-line bg-card px-3 text-base outline-none focus:border-muted"
        />
      </label>

      {error ? <p className="text-sm text-accent">{error}</p> : null}
      {progress ? <p className="text-sm text-muted">{progress}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="min-h-12 rounded-sm bg-foreground text-sm uppercase tracking-[0.18em] text-background disabled:opacity-50"
      >
        {pending ? "Uploading…" : "Add to inbox"}
      </button>
    </form>
  );
}
