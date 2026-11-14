"use server";

import { revalidatePath } from "next/cache";
import { db } from "../db";
import {
  placementDrives,
  driveRoles,
  eligibilityRequirements,
  preparationRequirements,
  roleTitles,
  driveApplications,
  companies,
  user,
} from "../db/schema";
import { requireUser, requireTpoOrAdmin } from "../auth-helpers";
import { eq, and } from "drizzle-orm";
import {
  createDriveSchema,
  updateDriveSchema,
  applyToDriveSchema,
  updateApplicationStatusSchema,
  type CreateDriveInput,
  type UpdateDriveInput,
} from "../validators/placement";

type DbExecutor = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function findOrCreateRoleTitle(tx: DbExecutor, companyId: string, title: string) {
  const existing = await tx
    .select()
    .from(roleTitles)
    .where(and(eq(roleTitles.companyId, companyId), eq(roleTitles.title, title)))
    .limit(1)
    .then((res) => res[0]);

  if (existing) return existing;

  const titleId = `rt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await tx.insert(roleTitles).values({
    id: titleId,
    companyId,
    title,
  });

  return { id: titleId, companyId, title, createdAt: new Date() };
}

export async function createPlacementDriveAction(input: CreateDriveInput) {
  const currentUser = await requireTpoOrAdmin();
  const parsed = createDriveSchema.parse(input);

  const driveId = `drive_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  await db.transaction(async (tx) => {
    const company = await tx
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.id, parsed.companyId))
      .limit(1)
      .then((r) => r[0]);

    if (!company) {
      throw new Error("Target company does not exist");
    }

    await tx.insert(placementDrives).values({
      id: driveId,
      companyId: parsed.companyId,
      season: parsed.season || "Placement Season",
      date: parsed.date || "Date TBA",
      deadline: parsed.deadline,
      location: parsed.location,
      status: parsed.status || "Upcoming",
      eligibleStudentInformation: parsed.eligibleStudentInformation,
      tpoCoordinatorId: currentUser.id,
    });

    if (parsed.roles && parsed.roles.length > 0) {
      for (const roleInput of parsed.roles) {
        const roleTitleRecord = await findOrCreateRoleTitle(tx, parsed.companyId, roleInput.title);

        const driveRoleId = `dr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
        await tx.insert(driveRoles).values({
          id: driveRoleId,
          driveId,
          roleId: roleTitleRecord.id,
          ctc: roleInput.ctc,
          location: roleInput.location || parsed.location,
          employmentType: roleInput.employmentType || "Full-time",
        });

        await tx.insert(eligibilityRequirements).values({
          id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          driveRoleId,
          cgpa: roleInput.cgpa,
          branches: roleInput.branches || [],
          backlog: roleInput.backlog,
          otherCriteria: roleInput.otherCriteria,
        });

        await tx.insert(preparationRequirements).values({
          id: `prep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          driveRoleId,
          requiredSkills: roleInput.requiredSkills || [],
          suggestedTopics: roleInput.suggestedTopics || [],
          preparationResources: roleInput.preparationResources || [],
        });
      }
    }
  });

  revalidatePath("/admin/drives");
  revalidatePath(`/companies/${parsed.companyId}`);
  revalidatePath("/companies");
  revalidatePath("/prepare");

  return { success: true, driveId };
}

export async function updatePlacementDriveAction(driveId: string, input: UpdateDriveInput) {
  await requireTpoOrAdmin();
  if (!driveId || !driveId.trim()) {
    throw new Error("Drive ID is required");
  }
  const parsed = updateDriveSchema.parse(input);

  const result = await db.transaction(async (tx) => {
    const drive = await tx
      .select()
      .from(placementDrives)
      .where(eq(placementDrives.id, driveId))
      .limit(1)
      .then((r) => r[0]);

    if (!drive) {
      throw new Error("Drive not found");
    }

    const targetCompanyId = parsed.companyId || drive.companyId;
    if (parsed.companyId && parsed.companyId !== drive.companyId) {
      const targetCompany = await tx
        .select({ id: companies.id })
        .from(companies)
        .where(eq(companies.id, parsed.companyId))
        .limit(1)
        .then((r) => r[0]);
      if (!targetCompany) {
        throw new Error("Target company does not exist");
      }
    }

    const resolvedLocation = parsed.location !== undefined ? parsed.location : drive.location;

    await tx
      .update(placementDrives)
      .set({
        companyId: targetCompanyId,
        season: parsed.season !== undefined ? parsed.season : drive.season,
        date: parsed.date !== undefined ? parsed.date : drive.date,
        deadline: parsed.deadline !== undefined ? parsed.deadline : drive.deadline,
        location: resolvedLocation,
        status: parsed.status !== undefined ? parsed.status : drive.status,
        eligibleStudentInformation:
          parsed.eligibleStudentInformation !== undefined
            ? parsed.eligibleStudentInformation
            : drive.eligibleStudentInformation,
        updatedAt: new Date(),
      })
      .where(eq(placementDrives.id, driveId));

    if (parsed.roles !== undefined) {
      const existingRoles = await tx
        .select()
        .from(driveRoles)
        .where(eq(driveRoles.driveId, driveId));
      const existingById = new Map(existingRoles.map((r) => [r.id, r]));
      const retainedRoleIds = new Set<string>();

      for (const roleInput of parsed.roles) {
        const roleTitleRecord = await findOrCreateRoleTitle(tx, targetCompanyId, roleInput.title);

        if (roleInput.id && existingById.has(roleInput.id)) {
          const driveRoleId = roleInput.id;
          retainedRoleIds.add(driveRoleId);

          await tx
            .update(driveRoles)
            .set({
              roleId: roleTitleRecord.id,
              ctc: roleInput.ctc ?? null,
              location: roleInput.location || resolvedLocation,
              employmentType: roleInput.employmentType || "Full-time",
            })
            .where(eq(driveRoles.id, driveRoleId));

          const existingElig = await tx
            .select({ id: eligibilityRequirements.id })
            .from(eligibilityRequirements)
            .where(eq(eligibilityRequirements.driveRoleId, driveRoleId))
            .limit(1)
            .then((r) => r[0]);

          if (existingElig) {
            await tx
              .update(eligibilityRequirements)
              .set({
                cgpa: roleInput.cgpa ?? null,
                branches: roleInput.branches || [],
                backlog: roleInput.backlog ?? null,
                otherCriteria: roleInput.otherCriteria ?? null,
              })
              .where(eq(eligibilityRequirements.id, existingElig.id));
          } else {
            await tx.insert(eligibilityRequirements).values({
              id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              driveRoleId,
              cgpa: roleInput.cgpa,
              branches: roleInput.branches || [],
              backlog: roleInput.backlog,
              otherCriteria: roleInput.otherCriteria,
            });
          }

          const existingPrep = await tx
            .select({ id: preparationRequirements.id })
            .from(preparationRequirements)
            .where(eq(preparationRequirements.driveRoleId, driveRoleId))
            .limit(1)
            .then((r) => r[0]);

          if (existingPrep) {
            await tx
              .update(preparationRequirements)
              .set({
                requiredSkills: roleInput.requiredSkills || [],
                suggestedTopics: roleInput.suggestedTopics || [],
                preparationResources: roleInput.preparationResources || [],
              })
              .where(eq(preparationRequirements.id, existingPrep.id));
          } else {
            await tx.insert(preparationRequirements).values({
              id: `prep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
              driveRoleId,
              requiredSkills: roleInput.requiredSkills || [],
              suggestedTopics: roleInput.suggestedTopics || [],
              preparationResources: roleInput.preparationResources || [],
            });
          }
        } else {
          const driveRoleId = `dr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
          await tx.insert(driveRoles).values({
            id: driveRoleId,
            driveId,
            roleId: roleTitleRecord.id,
            ctc: roleInput.ctc,
            location: roleInput.location || resolvedLocation,
            employmentType: roleInput.employmentType || "Full-time",
          });

          await tx.insert(eligibilityRequirements).values({
            id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            driveRoleId,
            cgpa: roleInput.cgpa,
            branches: roleInput.branches || [],
            backlog: roleInput.backlog,
            otherCriteria: roleInput.otherCriteria,
          });

          await tx.insert(preparationRequirements).values({
            id: `prep_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            driveRoleId,
            requiredSkills: roleInput.requiredSkills || [],
            suggestedTopics: roleInput.suggestedTopics || [],
            preparationResources: roleInput.preparationResources || [],
          });
        }
      }

      for (const oldRole of existingRoles) {
        if (!retainedRoleIds.has(oldRole.id)) {
          await tx
            .update(driveApplications)
            .set({ driveRoleId: null })
            .where(eq(driveApplications.driveRoleId, oldRole.id));
          await tx.delete(driveRoles).where(eq(driveRoles.id, oldRole.id));
        }
      }
    }

    return { previousCompanyId: drive.companyId, targetCompanyId };
  });

  revalidatePath("/admin/drives");
  revalidatePath(`/admin/drives/${driveId}/edit`);
  revalidatePath(`/admin/drives/${driveId}/applications`);
  revalidatePath(`/companies/${result.previousCompanyId}`);
  if (result.targetCompanyId !== result.previousCompanyId) {
    revalidatePath(`/companies/${result.targetCompanyId}`);
  }
  revalidatePath("/companies");
  revalidatePath("/prepare");

  return { success: true };
}

export async function deletePlacementDriveAction(driveId: string) {
  await requireTpoOrAdmin();
  if (!driveId || !driveId.trim()) {
    throw new Error("Drive ID is required");
  }

  const drive = await db
    .select()
    .from(placementDrives)
    .where(eq(placementDrives.id, driveId))
    .limit(1)
    .then((r) => r[0]);
  if (!drive) throw new Error("Drive not found");

  await db.delete(placementDrives).where(eq(placementDrives.id, driveId));

  revalidatePath("/admin/drives");
  revalidatePath(`/companies/${drive.companyId}`);
  revalidatePath("/companies");
  revalidatePath("/prepare");
  return { success: true };
}

export async function applyToDriveAction(input: {
  driveId: string;
  driveRoleId?: string;
  notes?: string;
  resumeUrl?: string;
}) {
  const currentUser = await requireUser();
  const parsed = applyToDriveSchema.parse(input);

  const drive = await db
    .select()
    .from(placementDrives)
    .where(eq(placementDrives.id, parsed.driveId))
    .limit(1)
    .then((r) => r[0]);

  if (!drive) {
    throw new Error("Placement drive not found");
  }

  if (drive.status === "Completed" || drive.status === "Cancelled") {
    return { success: false, message: "Applications are closed for this placement drive." };
  }

  const existing = await db
    .select()
    .from(driveApplications)
    .where(
      and(
        eq(driveApplications.driveId, parsed.driveId),
        eq(driveApplications.studentId, currentUser.id)
      )
    )
    .limit(1)
    .then((r) => r[0]);

  if (existing) {
    return { success: false, message: "You have already applied to this drive." };
  }

  const appId = `app_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  await db.insert(driveApplications).values({
    id: appId,
    driveId: parsed.driveId,
    driveRoleId: parsed.driveRoleId,
    studentId: currentUser.id,
    status: "applied",
    notes: parsed.notes,
    resumeUrl: parsed.resumeUrl,
  });

  revalidatePath("/profile");
  revalidatePath("/companies");
  revalidatePath(`/companies/${drive.companyId}`);
  revalidatePath(`/admin/drives/${drive.id}/applications`);
  return { success: true, applicationId: appId };
}

export async function updateApplicationStatusAction(input: {
  applicationId: string;
  status: "applied" | "shortlisted" | "interviewing" | "offered" | "rejected" | "withdrawn";
  notes?: string;
}) {
  await requireTpoOrAdmin();
  const parsed = updateApplicationStatusSchema.parse(input);

  const appRecord = await db
    .select({
      app: driveApplications,
      drive: placementDrives,
      company: companies,
      student: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    })
    .from(driveApplications)
    .innerJoin(placementDrives, eq(driveApplications.driveId, placementDrives.id))
    .innerJoin(companies, eq(placementDrives.companyId, companies.id))
    .innerJoin(user, eq(driveApplications.studentId, user.id))
    .where(eq(driveApplications.id, parsed.applicationId))
    .limit(1)
    .then((r) => r[0]);

  if (!appRecord) {
    throw new Error("Application not found");
  }

  await db
    .update(driveApplications)
    .set({
      status: parsed.status,
      notes: parsed.notes !== undefined ? parsed.notes : undefined,
      updatedAt: new Date(),
    })
    .where(eq(driveApplications.id, parsed.applicationId));

  try {
    const { createNotification } = await import("../notifications");
    await createNotification({
      userId: appRecord.student.id,
      type: "verification_completed",
      title: `Drive Update: ${appRecord.company.name}`,
      body: `Your application status for ${appRecord.company.name} (${appRecord.drive.season}) has been updated to "${parsed.status.toUpperCase()}".`,
      href: `/prepare?company=${appRecord.company.id}`,
    });

    const { sendDriveApplicationAlert } = await import("../email");
    await sendDriveApplicationAlert({
      to: appRecord.student.email,
      studentName: appRecord.student.name,
      companyName: appRecord.company.name,
      status: parsed.status,
      notes: parsed.notes,
    });
  } catch (err) {
    console.error("Failed to send notification for drive application:", err);
  }

  revalidatePath("/admin/drives");
  revalidatePath(`/admin/drives/${appRecord.drive.id}/applications`);
  revalidatePath("/profile");
  revalidatePath("/prepare");
  return { success: true };
}
