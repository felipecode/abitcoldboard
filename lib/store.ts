import "server-only";
import { randomUUID } from "crypto";
import { mkdir, readFile, unlink, writeFile } from "fs/promises";
import path from "path";
import { getMember } from "@/lib/members";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ReferenceCard, ReferenceRecord } from "@/lib/types";

export type { ReferenceCard, ReferenceRecord };

const BUCKET = "references";
const TABLE = "references";
const LOCAL_DIR = path.join(process.cwd(), ".data");
const LOCAL_JSON = path.join(LOCAL_DIR, "references.json");
const LOCAL_UPLOADS = path.join(LOCAL_DIR, "uploads");

function withNames(rows: ReferenceRecord[], urls: string[]): ReferenceCard[] {
  return rows.map((row, index) => ({
    ...row,
    url: urls[index] ?? "",
    submitterName: getMember(row.submitter)?.displayName ?? row.submitter,
  }));
}

async function readLocal(): Promise<ReferenceRecord[]> {
  try {
    const raw = await readFile(LOCAL_JSON, "utf8");
    return JSON.parse(raw) as ReferenceRecord[];
  } catch {
    return [];
  }
}

async function writeLocal(rows: ReferenceRecord[]) {
  await mkdir(LOCAL_DIR, { recursive: true });
  await writeFile(LOCAL_JSON, JSON.stringify(rows, null, 2));
}

export async function listReferences(): Promise<ReferenceCard[]> {
  if (!isSupabaseConfigured()) {
    const rows = (await readLocal()).sort((a, b) =>
      a.created_at < b.created_at ? 1 : -1,
    );
    return withNames(
      rows,
      rows.map((row) => `/api/files/${row.image_path}`),
    );
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, image_path, caption, submitter, status, created_at")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);

  const rows = (data ?? []) as ReferenceRecord[];
  const urls = await Promise.all(
    rows.map(async (row) => {
      const signed = await supabase.storage
        .from(BUCKET)
        .createSignedUrl(row.image_path, 60 * 60);
      if (signed.error || !signed.data?.signedUrl) {
        throw new Error(signed.error?.message ?? "Could not sign image URL");
      }
      return signed.data.signedUrl;
    }),
  );

  return withNames(rows, urls);
}

export async function createReference(input: {
  bytes: Buffer;
  contentType: string;
  caption: string | null;
  submitter: string;
}): Promise<ReferenceRecord> {
  const id = randomUUID();
  const imagePath = `${input.submitter}/${id}.jpg`;

  if (!isSupabaseConfigured()) {
    const dest = path.join(LOCAL_UPLOADS, imagePath);
    await mkdir(path.dirname(dest), { recursive: true });
    await writeFile(dest, input.bytes);

    const row: ReferenceRecord = {
      id,
      image_path: imagePath,
      caption: input.caption,
      submitter: input.submitter,
      status: "inbox",
      created_at: new Date().toISOString(),
    };
    const rows = await readLocal();
    rows.push(row);
    await writeLocal(rows);
    return row;
  }

  const supabase = getSupabase();
  const upload = await supabase.storage.from(BUCKET).upload(imagePath, input.bytes, {
    contentType: input.contentType,
    upsert: false,
  });
  if (upload.error) throw new Error(upload.error.message);

  const insert = await supabase
    .from(TABLE)
    .insert({
      id,
      image_path: imagePath,
      caption: input.caption,
      submitter: input.submitter,
      status: "inbox",
    })
    .select("id, image_path, caption, submitter, status, created_at")
    .single();

  if (insert.error) throw new Error(insert.error.message);
  return insert.data as ReferenceRecord;
}

export class StoreError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
  }
}

async function findReference(id: string): Promise<ReferenceRecord | null> {
  if (!isSupabaseConfigured()) {
    return (await readLocal()).find((row) => row.id === id) ?? null;
  }

  const supabase = getSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select("id, image_path, caption, submitter, status, created_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return (data as ReferenceRecord | null) ?? null;
}

async function requireOwned(id: string, memberId: string): Promise<ReferenceRecord> {
  const row = await findReference(id);
  if (!row) {
    throw new StoreError("That image is gone.", 404);
  }
  if (row.submitter !== memberId) {
    throw new StoreError("You can only change your own images.", 403);
  }
  return row;
}

export async function updateReferenceCaption(input: {
  id: string;
  memberId: string;
  caption: string | null;
}): Promise<ReferenceRecord> {
  const row = await requireOwned(input.id, input.memberId);

  if (!isSupabaseConfigured()) {
    const rows = await readLocal();
    const next = rows.map((item) =>
      item.id === row.id ? { ...item, caption: input.caption } : item,
    );
    await writeLocal(next);
    return { ...row, caption: input.caption };
  }

  const supabase = getSupabase();
  const update = await supabase
    .from(TABLE)
    .update({ caption: input.caption })
    .eq("id", row.id)
    .eq("submitter", input.memberId)
    .select("id, image_path, caption, submitter, status, created_at")
    .maybeSingle();

  if (update.error) throw new Error(update.error.message);
  if (!update.data) {
    throw new StoreError(
      "Could not save that caption. Re-run supabase/schema.sql in the Supabase SQL editor.",
      500,
    );
  }
  return update.data as ReferenceRecord;
}

export async function deleteReference(input: { id: string; memberId: string }): Promise<void> {
  const row = await requireOwned(input.id, input.memberId);

  if (!isSupabaseConfigured()) {
    const filePath = localFilePath(row.image_path);
    if (filePath) {
      await unlink(filePath).catch(() => undefined);
    }
    const rows = (await readLocal()).filter((item) => item.id !== row.id);
    await writeLocal(rows);
    return;
  }

  const supabase = getSupabase();
  const removed = await supabase.storage.from(BUCKET).remove([row.image_path]);
  if (removed.error) throw new Error(removed.error.message);

  const deletion = await supabase
    .from(TABLE)
    .delete({ count: "exact" })
    .eq("id", row.id)
    .eq("submitter", input.memberId);

  if (deletion.error) throw new Error(deletion.error.message);
  if (!deletion.count) {
    throw new StoreError(
      "Could not delete that image. Re-run supabase/schema.sql in the Supabase SQL editor.",
      500,
    );
  }
}

export function localFilePath(imagePath: string): string | null {
  const resolved = path.resolve(LOCAL_UPLOADS, imagePath);
  if (!resolved.startsWith(path.resolve(LOCAL_UPLOADS))) {
    return null;
  }
  return resolved;
}
