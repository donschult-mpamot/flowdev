// FlowDev worker — always-on ACA Container App entrypoint.
//
// Story 2.10 wires:
//   - node-cron scheduler (60s HTTP probes, 5s outbox drain)
//   - Postgres LISTEN/NOTIFY for schedule reload
//   - /healthz HTTP endpoint (Container App liveness probe)
//   - pg_try_advisory_lock per (app_id, connector_id) to prevent overlap
//
// This bootstrap stub just proves the workspace builds and runs.

function main(): void {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      service: "@flowdev/worker",
      msg: "worker bootstrap OK",
      timestamp: new Date().toISOString(),
    }),
  );
}

main();
