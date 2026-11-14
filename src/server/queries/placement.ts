import "server-only";

import { eq, and, sql, desc } from "drizzle-orm";
import { db } from "../db";
import {
  placementDrives,
  driveRoles,
  eligibilityRequirements,
  preparationRequirements,
  roleTitles,
  companies,
  driveApplications,
  user,
} from "../db/schema";

export async function getPlacementDrives(companyId: string) {
  try {
    return await db
      .select()
      .from(placementDrives)
      .where(eq(placementDrives.companyId, companyId));
  } catch (err) {
    console.error("Failed to fetch placement drives:", err);
    return [];
  }
}

export async function getPlacementDriveById(id: string) {
  try {
    const result = await db
      .select()
      .from(placementDrives)
      .where(eq(placementDrives.id, id))
      .limit(1);
    return result[0] || null;
  } catch (err) {
    console.error("Failed to fetch placement drive by id:", err);
    return null;
  }
}

export async function getPlacementDriveWithDetails(id: string) {
  try {
    const drive = await getPlacementDriveById(id);
    if (!drive) return null;

    const rolesData = await db
      .select({
        driveRole: driveRoles,
        title: roleTitles.title,
      })
      .from(driveRoles)
      .innerJoin(roleTitles, eq(driveRoles.roleId, roleTitles.id))
      .where(eq(driveRoles.driveId, id));

    const rolesWithDetails = await Promise.all(
      rolesData.map(async ({ driveRole, title }) => {
        const eligibility = await db
          .select()
          .from(eligibilityRequirements)
          .where(eq(eligibilityRequirements.driveRoleId, driveRole.id))
          .limit(1)
          .then((res) => res[0] || null);

        const preparation = await db
          .select()
          .from(preparationRequirements)
          .where(eq(preparationRequirements.driveRoleId, driveRole.id))
          .limit(1)
          .then((res) => res[0] || null);

        return {
          ...driveRole,
          title,
          eligibility,
          preparation,
        };
      })
    );

    return {
      ...drive,
      roles: rolesWithDetails,
    };
  } catch (err) {
    console.error("Failed to fetch placement drive details:", err);
    return null;
  }
}

export async function getCompanyPlacementInformation(companyId: string) {
  try {
    const drives = await getPlacementDrives(companyId);
    const detailedDrives = await Promise.all(
      drives.map((d) => getPlacementDriveWithDetails(d.id))
    );

    return detailedDrives.filter((d) => d !== null);
  } catch (err) {
    console.error("Failed to fetch company placement info:", err);
    return [];
  }
}

export async function getAllPlacementDrivesWithStats() {
  try {
    const drives = await db
      .select({
        drive: placementDrives,
        company: companies,
      })
      .from(placementDrives)
      .innerJoin(companies, eq(placementDrives.companyId, companies.id))
      .orderBy(desc(placementDrives.createdAt));

    const enriched = await Promise.all(
      drives.map(async ({ drive, company }) => {
        const rolesCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(driveRoles)
          .where(eq(driveRoles.driveId, drive.id))
          .then((res) => Number(res[0]?.count || 0));

        const applicantCount = await db
          .select({ count: sql<number>`count(*)` })
          .from(driveApplications)
          .where(eq(driveApplications.driveId, drive.id))
          .then((res) => Number(res[0]?.count || 0));

        return {
          ...drive,
          companyName: company.name,
          companyIndustry: company.industry,
          rolesCount,
          applicantCount,
        };
      })
    );

    return enriched;
  } catch (err) {
    console.error("Failed to fetch all placement drives:", err);
    return [];
  }
}

export async function getDriveApplicationsForDrive(driveId: string) {
  try {
    const apps = await db
      .select({
        application: driveApplications,
        student: {
          id: user.id,
          name: user.name,
          email: user.email,
          image: user.image,
        },
      })
      .from(driveApplications)
      .innerJoin(user, eq(driveApplications.studentId, user.id))
      .where(eq(driveApplications.driveId, driveId))
      .orderBy(desc(driveApplications.appliedAt));

    return apps;
  } catch (err) {
    console.error("Failed to fetch drive applications:", err);
    return [];
  }
}

export async function getStudentApplicationForDrive(driveId: string, studentId: string) {
  try {
    const app = await db
      .select()
      .from(driveApplications)
      .where(and(eq(driveApplications.driveId, driveId), eq(driveApplications.studentId, studentId)))
      .limit(1)
      .then((r) => r[0] || null);

    return app;
  } catch (err) {
    console.error("Failed to fetch student drive application:", err);
    return null;
  }
}

export async function getMyDriveApplications(studentId: string) {
  try {
    const apps = await db
      .select({
        application: driveApplications,
        drive: placementDrives,
        company: companies,
      })
      .from(driveApplications)
      .innerJoin(placementDrives, eq(driveApplications.driveId, placementDrives.id))
      .innerJoin(companies, eq(placementDrives.companyId, companies.id))
      .where(eq(driveApplications.studentId, studentId))
      .orderBy(desc(driveApplications.appliedAt));

    return apps;
  } catch (err) {
    console.error("Failed to fetch user drive applications:", err);
    return [];
  }
}
