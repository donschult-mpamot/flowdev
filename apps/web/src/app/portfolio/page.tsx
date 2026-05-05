import { cn } from "@flowdev/shared";
import { auth } from "@/auth";

// Story 1.2 minimum-viable protected destination. Story 1.4 replaces this
// with the FlowDesk shell.
export default async function PortfolioPage() {
  const session = await auth();
  const email = session?.user?.email ?? "(unknown)";
  const role = (session?.user as { role?: string } | undefined)?.role ?? "(none)";

  return (
    <main
      className={cn(
        "flex min-h-screen flex-col items-center justify-center gap-3 p-8",
      )}
    >
      <h1
        className={cn(
          "text-2xl font-semibold tracking-tight",
          "text-[var(--color-brand-purple)]",
        )}
      >
        Portfolio
      </h1>
      <p className="text-sm opacity-70">
        Hi {email} — role: {role}
      </p>
      <p className="max-w-md text-center text-xs opacity-50">
        Story 1.2 placeholder. Story 1.4 replaces this with the FlowDesk shell.
      </p>
      <form action="/api/auth/signout" method="POST">
        <button
          type="submit"
          className={cn(
            "rounded-md border border-black/15 bg-transparent px-4 py-2",
            "text-sm font-medium transition hover:bg-black/5",
            "dark:border-white/15 dark:hover:bg-white/5",
          )}
        >
          Sign out
        </button>
      </form>
    </main>
  );
}
