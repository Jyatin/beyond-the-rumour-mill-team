"use server";

import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { preparationItems, companies } from "../db/schema";
import { requireUser } from "../auth-helpers";
import { revalidatePath } from "next/cache";

const createPreparationItemSchema = z.object({
  companyId: z.string().optional(),
  title: z.string().min(1, "Task title is required").max(255),
  description: z.string().max(1000).optional(),
  category: z.string().min(1, "Category is required"),
});

export async function createPreparationItemAction(data: z.infer<typeof createPreparationItemSchema>) {
  const currentUser = await requireUser();
  const parsed = createPreparationItemSchema.parse(data);

  // Validate company if provided
  if (parsed.companyId) {
    const company = await db
      .select({ id: companies.id })
      .from(companies)
      .where(eq(companies.id, parsed.companyId))
      .limit(1);

    if (!company[0]) {
      throw new Error("Specified company does not exist");
    }
  }

  const id = `prep_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const [item] = await db
    .insert(preparationItems)
    .values({
      id,
      userId: currentUser.id,
      companyId: parsed.companyId || null,
      title: parsed.title,
      description: parsed.description || null,
      category: parsed.category,
    })
    .returning();

  revalidatePath("/profile");
  if (parsed.companyId) {
    revalidatePath(`/companies/${parsed.companyId}`);
  }

  return { success: true, item };
}

export async function togglePreparationItemAction(itemId: string, completed: boolean) {
  const currentUser = await requireUser();

  const [existing] = await db
    .select()
    .from(preparationItems)
    .where(eq(preparationItems.id, itemId))
    .limit(1);

  if (!existing) {
    throw new Error("Preparation task not found");
  }

  // Authorization: Only task owner can toggle status
  if (existing.userId !== currentUser.id) {
    throw new Error("Unauthorized: Cannot modify another student's preparation checklist");
  }

  const [updated] = await db
    .update(preparationItems)
    .set({
      completedAt: completed ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(preparationItems.id, itemId))
    .returning();

  revalidatePath("/profile");
  if (existing.companyId) {
    revalidatePath(`/companies/${existing.companyId}`);
  }

  return { success: true, item: updated };
}

export async function deletePreparationItemAction(itemId: string) {
  const currentUser = await requireUser();

  const [existing] = await db
    .select()
    .from(preparationItems)
    .where(eq(preparationItems.id, itemId))
    .limit(1);

  if (!existing) {
    throw new Error("Preparation task not found");
  }

  // Authorization: Only task owner can delete
  if (existing.userId !== currentUser.id) {
    throw new Error("Unauthorized: Cannot delete another student's preparation checklist");
  }

  await db
    .delete(preparationItems)
    .where(eq(preparationItems.id, itemId));

  revalidatePath("/profile");
  if (existing.companyId) {
    revalidatePath(`/companies/${existing.companyId}`);
  }

  return { success: true };
}
