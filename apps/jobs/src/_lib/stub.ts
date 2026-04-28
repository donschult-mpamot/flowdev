// Shared stub helper for the seven placeholder Job entrypoints.
// Each Job's owning story replaces its own file with the real implementation:
//   hourly-aggregate.ts    → Story 3.3
//   daily-aggregate.ts     → Story 3.4
//   retention-prune.ts     → Story 10.6
//   cost-data-pull.ts      → Story 4.3 / 4.4
//   resource-snapshot.ts   → Story 3.x
//   sarb-fx-pull.ts        → Story 4.2
//   dek-rewrap-sweep.ts    → Stories 2.5 / 2.8 (master-key rotation)

export function runStubJob(jobName: string): void {
  // eslint-disable-next-line no-console
  console.log(
    JSON.stringify({
      service: "@flowdev/jobs",
      job: jobName,
      msg: "job bootstrap OK (stub — real implementation in owning story)",
      timestamp: new Date().toISOString(),
    }),
  );
}
