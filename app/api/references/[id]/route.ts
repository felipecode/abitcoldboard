import { getSession } from "@/lib/auth";
import { MAX_CAPTION } from "@/lib/images";
import { deleteReference, StoreError, updateReferenceCaption } from "@/lib/store";

type RouteContext = { params: Promise<{ id: string }> };

function jsonError(error: unknown, fallback: string) {
  if (error instanceof StoreError) {
    return Response.json({ error: error.message }, { status: error.status });
  }
  const message = error instanceof Error ? error.message : fallback;
  return Response.json({ error: message }, { status: 500 });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;
  const body = (await request.json().catch(() => null)) as { caption?: unknown } | null;
  if (typeof body?.caption !== "string" && body?.caption !== null) {
    return Response.json({ error: "Caption is required." }, { status: 400 });
  }

  const caption = typeof body.caption === "string" ? body.caption.trim() : "";
  if (caption.length > MAX_CAPTION) {
    return Response.json({ error: "Caption is too long." }, { status: 400 });
  }

  try {
    const reference = await updateReferenceCaption({
      id,
      memberId: session.memberId,
      caption: caption || null,
    });
    return Response.json({ ok: true, reference });
  } catch (error) {
    return jsonError(error, "Could not update that image.");
  }
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await getSession();
  if (!session) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await context.params;

  try {
    await deleteReference({ id, memberId: session.memberId });
    return Response.json({ ok: true });
  } catch (error) {
    return jsonError(error, "Could not delete that image.");
  }
}
