import { getSession } from "@/lib/auth";
import { MAX_CAPTION, MAX_FILE_BYTES, rejectReason, sniffImageType } from "@/lib/images";
import { createReference, listReferences } from "@/lib/store";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const references = await listReferences();
    return Response.json({ references });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Could not load the board.";
    return Response.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await request.formData();
  const file = form.get("file");
  const captionRaw = String(form.get("caption") ?? "").trim();

  if (!(file instanceof File)) {
    return Response.json({ error: "Choose an image." }, { status: 400 });
  }

  const typeHint = file.type || "image/jpeg";
  const sizeReason = rejectReason(typeHint, file.size);
  if (sizeReason) {
    return Response.json({ error: sizeReason }, { status: 400 });
  }
  if (file.size > MAX_FILE_BYTES) {
    return Response.json({ error: "Each image must be under 8 MB." }, { status: 400 });
  }
  if (captionRaw.length > MAX_CAPTION) {
    return Response.json({ error: "Caption is too long." }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImageType(bytes);
  if (!sniffed) {
    return Response.json({ error: "That file type is not supported." }, { status: 400 });
  }

  try {
    const row = await createReference({
      bytes,
      contentType: sniffed,
      caption: captionRaw || null,
      submitter: session.memberId,
    });
    return Response.json({ ok: true, reference: row });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return Response.json({ error: message }, { status: 500 });
  }
}
