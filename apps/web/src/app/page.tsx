import { cn } from "@flowdev/shared";

// TODO(Story 1.4): replace with the FlowDesk shell
// (sidebar + sticky header + content area, dark-mode toggle, mobile sheet).
export default function Home() {
  return (
    <main
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-4 p-8",
      )}
    >
      <h1
        className={cn(
          "text-3xl font-semibold tracking-tight",
          "text-[--color-brand-purple]",
        )}
      >
        FlowDev — bootstrap OK
      </h1>
      <p className="max-w-md text-center text-sm opacity-70">
        Story 1.1 scaffolded. Subsequent stories layer auth, RBAC, the
        FlowDesk shell, connectors, and dashboards on top of this base.
      </p>
    </main>
  );
}
