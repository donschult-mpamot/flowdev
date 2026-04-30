-- CreateTable
CREATE TABLE "audit_logs" (
    "id" BIGSERIAL NOT NULL,
    "occurredAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actorId" TEXT,
    "appId" TEXT,
    "connectorId" TEXT,
    "credentialId" TEXT,
    "op" TEXT NOT NULL,
    "kvKeyVersion" TEXT,
    "context" JSONB,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "audit_logs_appId_occurredAt_idx" ON "audit_logs"("appId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_actorId_occurredAt_idx" ON "audit_logs"("actorId", "occurredAt" DESC);

-- CreateIndex
CREATE INDEX "audit_logs_op_occurredAt_idx" ON "audit_logs"("op", "occurredAt" DESC);

-- Story 1.7 (NFR-S6): audit log is immutable. Two layers of defense:
--
--   1. REVOKE UPDATE/DELETE/TRUNCATE from CURRENT_USER. This protects against
--      any future deployment that splits DDL and runtime users — once the
--      runtime user is non-owner, the REVOKE binds.
--
--   2. BEFORE-trigger guards. In FlowDev's current single-DB-user topology,
--      the runtime user OWNS audit_logs (Prisma created it as that user) and
--      Postgres lets owners bypass GRANT/REVOKE. The triggers raise SQLSTATE
--      42501 (insufficient_privilege) on any UPDATE/DELETE/TRUNCATE attempt,
--      regardless of role or ownership.
--
-- Together these satisfy AC1 ("the FlowDev DB user has only INSERT and SELECT
-- on audit_logs") in both current and future deployment topologies.

REVOKE UPDATE, DELETE, TRUNCATE ON TABLE "audit_logs" FROM CURRENT_USER;
GRANT INSERT, SELECT ON TABLE "audit_logs" TO CURRENT_USER;

CREATE OR REPLACE FUNCTION audit_logs_immutable_guard()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  RAISE EXCEPTION 'audit_logs is append-only (NFR-S6)'
    USING ERRCODE = '42501';
END;
$$;

-- Row-level guards: fire on each affected row. They catch the common case
-- (an UPDATE/DELETE that actually changes rows).
CREATE OR REPLACE TRIGGER audit_logs_no_update
  BEFORE UPDATE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable_guard();

CREATE OR REPLACE TRIGGER audit_logs_no_delete
  BEFORE DELETE ON "audit_logs"
  FOR EACH ROW EXECUTE FUNCTION audit_logs_immutable_guard();

-- Statement-level companions: fire even on no-match `WHERE 1=0` style
-- statements that wouldn't otherwise affect any row (and so wouldn't fire
-- the row-level triggers above). Closes the silent-bypass gap.
CREATE OR REPLACE TRIGGER audit_logs_no_update_stmt
  BEFORE UPDATE ON "audit_logs"
  FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_immutable_guard();

CREATE OR REPLACE TRIGGER audit_logs_no_delete_stmt
  BEFORE DELETE ON "audit_logs"
  FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_immutable_guard();

-- TRUNCATE is a statement-level operation by definition.
CREATE OR REPLACE TRIGGER audit_logs_no_truncate
  BEFORE TRUNCATE ON "audit_logs"
  FOR EACH STATEMENT EXECUTE FUNCTION audit_logs_immutable_guard();
