import { Prisma, type PrismaClient } from "@flowdev/db";

// Closed set of audit operation strings. Extended per-story as new mutations
// land (e.g., Story 1.2 adds the auth.* ops, Story 2.5 adds "credential.decrypt").
export type AuditOp =
  | "auth.signin.success"
  | "auth.signin.failure"
  | "auth.session.create"
  | "app.create"
  | "app.update"
  | "app.decommission"
  | "app.delete"
  | "connector.create"
  | "connector.update"
  | "connector.disable"
  | "connector.enable"
  | "connector.delete"
  | "credential.create"
  | "credential.rotate"
  | "credential.decrypt"
  | "credential.delete"
  | "alert.rule.create"
  | "alert.rule.update"
  | "alert.rule.delete"
  | "alert.acknowledge"
  | "alert.resolve"
  | "user.invite"
  | "user.update"
  | "user.remove"
  | "user.role.change"
  | "user.scope.change"
  | "webhook.secret.rotate"
  | "webhook.recipient.unmask"
  | "system.setting.update";

export interface AuditEvent {
  actorId: string | null;
  op: AuditOp;
  appId?: string | null;
  connectorId?: string | null;
  credentialId?: string | null;
  kvKeyVersion?: string | null;
  context?: Prisma.InputJsonValue | null;
}

// Append-only writer for the audit_logs table. MUST be called inside the
// caller's transaction so the audit row commits/rolls back atomically with
// the underlying mutation (NFR-S6, ACs 2 and 3).
//
// The first parameter accepts either a PrismaClient or a Prisma.TransactionClient
// so callers can pass `tx` from `prisma.$transaction(async (tx) => { ... })`.
export async function appendAudit(
  db: PrismaClient | Prisma.TransactionClient,
  event: AuditEvent,
): Promise<void> {
  await db.auditLog.create({
    data: {
      actorId: event.actorId,
      op: event.op,
      appId: event.appId ?? null,
      connectorId: event.connectorId ?? null,
      credentialId: event.credentialId ?? null,
      kvKeyVersion: event.kvKeyVersion ?? null,
      context: event.context ?? Prisma.JsonNull,
    },
  });
}
