import { cookies } from "next/headers";
import { getMember } from "@/lib/members";
import { passwordsMatch } from "@/lib/password";
import {
  SESSION_COOKIE,
  cookieOptions,
  createSessionPayload,
  signSession,
} from "@/lib/session";

export async function POST(request: Request) {
  const body = (await request.json().catch(() => null)) as {
    memberId?: string;
    password?: string;
  } | null;

  const member = body?.memberId ? getMember(body.memberId) : undefined;
  const expected = process.env.APP_PASSWORD ?? "";

  if (!member || !body?.password || !expected || !passwordsMatch(body.password, expected)) {
    return Response.json({ error: "Wrong name or password." }, { status: 401 });
  }

  const token = await signSession(createSessionPayload(member.id, member.displayName));
  const store = await cookies();
  store.set(SESSION_COOKIE, token, cookieOptions());

  return Response.json({ ok: true, name: member.displayName });
}
