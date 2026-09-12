import { readFile } from "fs/promises";
import { getSession } from "@/lib/auth";
import { sniffImageType } from "@/lib/images";
import { isSupabaseConfigured } from "@/lib/supabase";
import { localFilePath } from "@/lib/store";

export async function GET(
  _request: Request,
  context: { params: Promise<{ path: string[] }> },
) {
  const session = await getSession();
  if (!session) {
    return new Response("Unauthorized", { status: 401 });
  }
  if (isSupabaseConfigured()) {
    return new Response("Not found", { status: 404 });
  }

  const { path: parts } = await context.params;
  const imagePath = parts.join("/");
  const filePath = localFilePath(imagePath);
  if (!filePath) {
    return new Response("Not found", { status: 404 });
  }

  try {
    const bytes = await readFile(filePath);
    const type = sniffImageType(bytes) ?? "image/jpeg";
    return new Response(new Uint8Array(bytes), {
      headers: {
        "Content-Type": type,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
