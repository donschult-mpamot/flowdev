import { describe, expect, it, vi } from "vitest";
import { Prisma } from "@prisma/client";
import { appendAudit, type AuditEvent } from "./append.js";

// Mock shape that matches PrismaClient/TransactionClient for the surface we use.
function makeMockDb() {
  const create = vi.fn().mockResolvedValue(undefined);
  return {
    db: { auditLog: { create } } as unknown as Parameters<typeof appendAudit>[0],
    create,
  };
}

describe("appendAudit", () => {
  it("writes a minimal event with all defaults applied", async () => {
    const { db, create } = makeMockDb();

    const event: AuditEvent = {
      actorId: "user-123",
      op: "app.create",
    };

    await appendAudit(db, event);

    expect(create).toHaveBeenCalledTimes(1);
    expect(create).toHaveBeenCalledWith({
      data: {
        actorId: "user-123",
        op: "app.create",
        appId: null,
        connectorId: null,
        credentialId: null,
        kvKeyVersion: null,
        context: Prisma.JsonNull,
      },
    });
  });

  it("writes a full event with every optional field populated", async () => {
    const { db, create } = makeMockDb();

    const event: AuditEvent = {
      actorId: "user-123",
      op: "credential.decrypt",
      appId: "app-abc",
      connectorId: "connector-xyz",
      credentialId: "cred-456",
      kvKeyVersion: "kv-v3",
      context: { reason: "scheduled-collect", ip: "10.0.0.1" },
    };

    await appendAudit(db, event);

    expect(create).toHaveBeenCalledWith({
      data: {
        actorId: "user-123",
        op: "credential.decrypt",
        appId: "app-abc",
        connectorId: "connector-xyz",
        credentialId: "cred-456",
        kvKeyVersion: "kv-v3",
        context: { reason: "scheduled-collect", ip: "10.0.0.1" },
      },
    });
  });

  it("accepts a system event (actorId null) and omitted context", async () => {
    const { db, create } = makeMockDb();

    const event: AuditEvent = {
      actorId: null,
      op: "system.setting.update",
    };

    await appendAudit(db, event);

    expect(create).toHaveBeenCalledWith({
      data: {
        actorId: null,
        op: "system.setting.update",
        appId: null,
        connectorId: null,
        credentialId: null,
        kvKeyVersion: null,
        context: Prisma.JsonNull,
      },
    });
  });
});
