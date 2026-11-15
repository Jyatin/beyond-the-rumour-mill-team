import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@/server/db";
import { evidence, alumniProfiles, experiences } from "@/server/db/schema";
import { getCurrentUser } from "@/server/auth-helpers";
import { readPrivateFile } from "@/server/storage";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ evidenceId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { evidenceId } = await context.params;
  if (!evidenceId) {
    return NextResponse.json({ error: "Missing evidence ID" }, { status: 400 });
  }

  const [ev] = await db
    .select()
    .from(evidence)
    .where(eq(evidence.id, evidenceId))
    .limit(1);

  if (!ev || !ev.storageKey) {
    return NextResponse.json({ error: "Evidence file not found" }, { status: 404 });
  }

  let isOwner = false;
  if (ev.employmentId) {
    const [emp] = await db
      .select({ userId: alumniProfiles.userId })
      .from(alumniProfiles)
      .where(eq(alumniProfiles.id, ev.employmentId))
      .limit(1);
    if (emp?.userId === user.id) isOwner = true;
  }
  if (!isOwner && ev.experienceId) {
    const [exp] = await db
      .select({ authorId: experiences.authorId })
      .from(experiences)
      .where(eq(experiences.id, ev.experienceId))
      .limit(1);
    if (exp?.authorId === user.id) isOwner = true;
  }

  if (!isOwner && user.role !== "admin" && user.role !== "tpo") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const fileData = await readPrivateFile(ev.storageKey, {
    folder: "evidence",
    contentType: ev.mimeType || "application/octet-stream",
  });

  if (!fileData) {
    return NextResponse.json({ error: "File not found in storage" }, { status: 404 });
  }

  const safeDownloadName = (ev.fileName || "evidence").replace(/[^a-zA-Z0-9._-]/g, "_");

  return new Response(fileData.buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": ev.mimeType || fileData.contentType || "application/octet-stream",
      "Content-Disposition": `inline; filename="${safeDownloadName}"`,
      "Content-Length": fileData.buffer.length.toString(),
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
