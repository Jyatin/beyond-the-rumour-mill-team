import "server-only";

import { eq } from "drizzle-orm";
import { db } from "../db";
import { alumniProfiles } from "../db/schema";
import { getSharedCvMap } from "./cv";

export async function getAlumniProfiles() {
  try {
    const profiles = await db.select().from(alumniProfiles);
    const cleanProfiles = profiles.filter(
      (p) =>
        !p.company.toLowerCase().includes("test") &&
        !p.company.toLowerCase().includes("consensus dynamics") &&
        !p.company.toLowerCase().includes("extraction labs") &&
        !p.company.toLowerCase().includes("dedup tech") &&
        !p.company.toLowerCase().includes("boutique startup") &&
        !p.name.toLowerCase().includes("test")
    );

    const activeList = cleanProfiles.length > 0 ? cleanProfiles : profiles;
    const userIds = activeList.map((p) => p.userId).filter(Boolean) as string[];
    const sharedMap = await getSharedCvMap(userIds);

    return activeList.map((p) => ({
      ...p,
      hasSharedCv: p.userId ? Boolean(sharedMap[p.userId]) : false,
    }));
  } catch (err) {
    console.error("Failed to fetch alumni profiles from DB:", err);
    return [];
  }
}

export async function getAlumniProfileById(id: string) {
  try {
    const result = await db
      .select()
      .from(alumniProfiles)
      .where(eq(alumniProfiles.id, id))
      .limit(1);
    if (!result[0]) return null;
    const p = result[0];
    const sharedMap = p.userId ? await getSharedCvMap([p.userId]) : {};
    return {
      ...p,
      hasSharedCv: p.userId ? Boolean(sharedMap[p.userId]) : false,
    };
  } catch (err) {
    console.error(`Failed to fetch alumni profile ${id} from DB:`, err);
    return null;
  }
}

export async function getAlumniProfilesByCompanyId(companyId: string) {
  const profiles = await db
    .select()
    .from(alumniProfiles)
    .where(eq(alumniProfiles.companyId, companyId));
  const userIds = profiles.map((p) => p.userId).filter(Boolean) as string[];
  const sharedMap = await getSharedCvMap(userIds);

  return profiles.map((p) => ({
    ...p,
    hasSharedCv: p.userId ? Boolean(sharedMap[p.userId]) : false,
  }));
}
