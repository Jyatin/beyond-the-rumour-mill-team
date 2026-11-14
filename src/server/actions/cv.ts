"use server";

import { db } from "../db";
import { alumniCvs } from "../db/schema";
import { requireUser } from "../auth-helpers";
import { eq } from "drizzle-orm";
import { savePrivateFile, deletePrivateFile } from "../storage";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

export async function uploadCvAction(formData: FormData) {
  const user = await requireUser();

  if (user.role !== "alumni" && user.role !== "admin") {
    throw new Error("Unauthorized: Only alumni accounts can manage a CV");
  }

  const file = formData.get("file");
  if (!file || !(file instanceof File)) {
    throw new Error("No CV file provided");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new Error("File size exceeds 5MB limit");
  }

  if (file.size === 0) {
    throw new Error("Uploaded file is empty");
  }

  // Validate filename and MIME
  const fileName = file.name.trim();
  if (!fileName.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
    throw new Error("Invalid file format: Only PDF documents (.pdf) are permitted");
  }

  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);

  // Validate PDF header magic bytes (%PDF-)
  const header = buffer.subarray(0, 5).toString("utf-8");
  if (!header.startsWith("%PDF-")) {
    throw new Error("Invalid file content: The file is not a valid PDF document");
  }

  // Check if existing CV exists for this user
  const existing = await db
    .select()
    .from(alumniCvs)
    .where(eq(alumniCvs.userId, user.id))
    .limit(1);

  if (existing[0]) {
    // Delete previous physical file
    await deletePrivateFile(existing[0].storageKey);
  }

  const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storageKey = `cv_${user.id}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.pdf`;

  await savePrivateFile(storageKey, buffer);

  const id = existing[0]?.id || `cv_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const isShared = existing[0]?.isShared ?? false; // Retain existing setting or default FALSE (private by default)

  if (existing[0]) {
    await db
      .update(alumniCvs)
      .set({
        storageKey,
        fileName: sanitizedFileName,
        fileSize: buffer.length,
        mimeType: "application/pdf",
        updatedAt: new Date(),
      })
      .where(eq(alumniCvs.id, existing[0].id));
  } else {
    await db.insert(alumniCvs).values({
      id,
      userId: user.id,
      storageKey,
      fileName: sanitizedFileName,
      fileSize: buffer.length,
      mimeType: "application/pdf",
      isShared: false, // Explicitly private by default
    });
  }

  revalidatePath("/profile");
  revalidatePath("/connect");

  return {
    success: true,
    cv: {
      id,
      fileName: sanitizedFileName,
      fileSize: buffer.length,
      isShared,
    },
  };
}

export async function toggleCvSharingAction(isShared: boolean) {
  const user = await requireUser();

  if (user.role !== "alumni" && user.role !== "admin") {
    throw new Error("Unauthorized: Only alumni accounts can manage CV sharing");
  }

  const existing = await db
    .select()
    .from(alumniCvs)
    .where(eq(alumniCvs.userId, user.id))
    .limit(1);

  if (!existing[0]) {
    throw new Error("No CV found. Please upload a CV first.");
  }

  await db
    .update(alumniCvs)
    .set({
      isShared: Boolean(isShared),
      updatedAt: new Date(),
    })
    .where(eq(alumniCvs.id, existing[0].id));

  revalidatePath("/profile");
  revalidatePath("/connect");

  return {
    success: true,
    isShared: Boolean(isShared),
  };
}

export async function deleteCvAction() {
  const user = await requireUser();

  if (user.role !== "alumni" && user.role !== "admin") {
    throw new Error("Unauthorized: Only alumni accounts can delete a CV");
  }

  const existing = await db
    .select()
    .from(alumniCvs)
    .where(eq(alumniCvs.userId, user.id))
    .limit(1);

  if (existing[0]) {
    await deletePrivateFile(existing[0].storageKey);
    await db.delete(alumniCvs).where(eq(alumniCvs.id, existing[0].id));
  }

  revalidatePath("/profile");
  revalidatePath("/connect");

  return { success: true };
}
