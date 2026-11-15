import "server-only";

import { db } from "../db";
import { preparationItems, companies, mockBookings, mockSlots } from "../db/schema";
import { eq, and, asc, isNotNull, count, or, lt } from "drizzle-orm";
import { requireUser } from "../auth-helpers";

export async function getPreparationItems(companyId?: string) {
  const currentUser = await requireUser();

  const conditions = [eq(preparationItems.userId, currentUser.id)];
  if (companyId) {
    conditions.push(eq(preparationItems.companyId, companyId));
  }

  try {
    const rows = await db
      .select({
        id: preparationItems.id,
        userId: preparationItems.userId,
        companyId: preparationItems.companyId,
        driveId: preparationItems.driveId,
        source: preparationItems.source,
        companyName: companies.name,
        title: preparationItems.title,
        description: preparationItems.description,
        category: preparationItems.category,
        completedAt: preparationItems.completedAt,
        createdAt: preparationItems.createdAt,
        updatedAt: preparationItems.updatedAt,
      })
      .from(preparationItems)
      .leftJoin(companies, eq(preparationItems.companyId, companies.id))
      .where(and(...conditions))
      .orderBy(asc(preparationItems.createdAt));

    return rows;
  } catch (err) {
    console.error("Failed to fetch preparation items:", err);
    return [];
  }
}

export async function getPreparationProgress(companyId?: string) {
  const currentUser = await requireUser();

  const conditions = [eq(preparationItems.userId, currentUser.id)];
  if (companyId) {
    conditions.push(eq(preparationItems.companyId, companyId));
  }

  try {
    const totalResult = await db
      .select({ total: count() })
      .from(preparationItems)
      .where(and(...conditions));

    const completedResult = await db
      .select({ completed: count() })
      .from(preparationItems)
      .where(and(...conditions, isNotNull(preparationItems.completedAt)));

    const total = Number(totalResult[0]?.total || 0);
    const completed = Number(completedResult[0]?.completed || 0);
    const remaining = total - completed;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      remaining,
      percentage,
    };
  } catch (err) {
    console.error("Failed to compute preparation progress:", err);
    return {
      total: 0,
      completed: 0,
      remaining: 0,
      percentage: 0,
    };
  }
}

export async function getUserHasCompletedMock(userId: string) {
  try {
    const now = new Date();
    const rows = await db
      .select({ id: mockBookings.id })
      .from(mockBookings)
      .innerJoin(mockSlots, eq(mockBookings.slotId, mockSlots.id))
      .where(
        and(
          eq(mockBookings.studentId, userId),
          or(
            eq(mockBookings.status, "completed"),
            and(
              eq(mockBookings.status, "confirmed"),
              lt(mockSlots.endsAt, now)
            )
          )
        )
      )
      .limit(1);

    return rows.length > 0;
  } catch (err) {
    console.error("Failed to check completed mock interviews:", err);
    return false;
  }
}
