import { db } from "../db";
import { auditLog } from "../db/schema";
import { requireUser } from "../auth-helpers";

export async function createAuditRecord({
  action,
  entityType,
  entityId,
  actorId,
  metadata,
}: {
  action: string;
  entityType: string;
  entityId: string;
  actorId?: string;
  metadata?: Record<string, unknown>;
}) {
  const resolvedActorId = actorId || (await requireUser().catch(() => null))?.id;

  await db.insert(auditLog).values({
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    actorId: resolvedActorId,
    action,
    entityType,
    entityId,
    metadata,
  });
}
