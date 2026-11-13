import { NextRequest, NextResponse } from "next/server";
import { getAlumniCvAccess } from "@/server/queries/cv";
import { readPrivateFile } from "@/server/storage";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  const { userId } = await context.params;
  if (!userId) {
    return NextResponse.json({ error: "Missing user ID" }, { status: 400 });
  }

  const access = await getAlumniCvAccess(userId);

  if (!access.allowed || !access.cv) {
    if (access.reason === "unauthenticated") {
      return NextResponse.json(
        { error: "Authentication required to access CV documents" },
        { status: 401 }
      );
    }
    if (access.reason === "private") {
      return NextResponse.json(
        { error: "This alumni's CV is private and not shared" },
        { status: 403 }
      );
    }
    return NextResponse.json({ error: "CV not found" }, { status: 404 });
  }

  const fileData = await readPrivateFile(access.cv.storageKey);
  if (!fileData) {
    return NextResponse.json(
      { error: "Document file not found on storage" },
      { status: 404 }
    );
  }

  const safeFileName = (access.cv.fileName || "cv.pdf").replace(/[^a-zA-Z0-9._-]/g, "_");

  return new Response(fileData.buffer as unknown as BodyInit, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${safeFileName}"`,
      "Content-Length": fileData.buffer.length.toString(),
      "Cache-Control": "private, no-cache, no-store, must-revalidate",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
