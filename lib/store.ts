import "server-only";
import { randomUUID } from "crypto";
import { mkdir, readFile, writeFile } from "fs/promises";
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

export function localFilePath(imagePath: string): string | null {
  const resolved = path.resolve(LOCAL_UPLOADS, imagePath);
  if (!resolved.startsWith(path.resolve(LOCAL_UPLOADS))) {
    return null;
  }
  return resolved;
}
