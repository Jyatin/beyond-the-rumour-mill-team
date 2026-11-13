import "server-only";

import { db } from "./db";
import { notifications, user, notificationTypeEnum } from "./db/schema";
import { eq } from "drizzle-orm";

export type NotificationType = (typeof notificationTypeEnum.enumValues)[number];

export interface CreateNotificationParams {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  href?: string;
  metadata?: Record<string, unknown>;
}

export async function createNotification(params: CreateNotificationParams) {
  // Validate recipient exists
  const recipient = await db
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, params.userId))
    .limit(1);

  if (!recipient[0]) {
    return null; // Don't throw to prevent breaking outer action if user was deleted
  }

  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const [created] = await db
    .insert(notifications)
    .values({
      id,
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      href: params.href || null,
      metadata: params.metadata || null,
    })
    .returning();

  return created;
}

export async function createNotificationTx(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  params: CreateNotificationParams
) {
  // Validate recipient exists
  const recipient = await tx
    .select({ id: user.id })
    .from(user)
    .where(eq(user.id, params.userId))
    .limit(1);

  if (!recipient[0]) {
    return null;
  }

  const id = `notif_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

  const [created] = await tx
    .insert(notifications)
    .values({
      id,
      userId: params.userId,
      type: params.type,
      title: params.title,
      body: params.body,
      href: params.href || null,
      metadata: params.metadata || null,
    })
    .returning();

  return created;
}

