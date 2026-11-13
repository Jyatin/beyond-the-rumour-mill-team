"use server";

import { z } from "zod";
import { requireUser } from "../auth-helpers";
import { buildConsensusSnapshot } from "../consensus/builder";
import { revalidatePath } from "next/cache";

const generateSnapshotSchema = z.object({
  companyId: z.string().min(1, "Company ID is required"),
  roleTitleId: z.string().optional(),
});

export async function generateConsensusSnapshotAction(params: {
  companyId: string;
  roleTitleId?: string;
}) {
  const parsed = generateSnapshotSchema.safeParse(params);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message || "Invalid input");
  }

  const user = await requireUser();
  if (user.role !== "admin" && user.role !== "alumni") {
    throw new Error("Unauthorized: Only verified alumni and admins can trigger consensus calculation");
  }

  const result = await buildConsensusSnapshot({
    companyId: params.companyId,
    roleTitleId: params.roleTitleId,
  });

  revalidatePath(`/companies/${params.companyId}`);

  return {
    success: true,
    snapshotId: result.snapshot.id,
    itemCount: result.items.length,
    verificationScore: result.snapshot.verificationScore,
    totalEligibleExperiences: result.snapshot.totalEligibleExperiences,
  };
}
