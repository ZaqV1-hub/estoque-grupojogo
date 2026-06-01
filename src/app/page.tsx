import { AppShell } from "@/components/app-shell";
import { LoginForm } from "@/components/login-form";
import { getSessionUserId } from "@/lib/auth/session";
import { getInventoryRepository } from "@/lib/data";
import { buildDashboardView } from "@/lib/inventory/dashboard";

export default async function Home() {
  const repository = getInventoryRepository();
  const userId = await getSessionUserId();
  const user = userId ? await repository.getUserById(userId) : null;

  if (!user) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top_left,var(--hero-glow),transparent_32%),var(--background)] px-4 py-10">
        <section className="w-full max-w-[530px] rounded-[30px] border border-[var(--line)] bg-[var(--panel)] p-7 shadow-[0_30px_120px_var(--shadow-strong)]">
          <div className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-4xl font-semibold tracking-tight text-[var(--text)]">
                Estoque
              </p>
              <p className="mt-2 text-base text-[var(--muted)]">
                Entrar no painel
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--line)] bg-[var(--panel-2)] px-3 py-2 text-xs uppercase tracking-[0.16em] text-[var(--muted)]">
              {repository.mode === "demo" ? "Demo local" : "Google Sheets"}
            </div>
          </div>

          <div className="rounded-[24px] border border-[var(--line)] bg-[var(--panel-2)] p-5">
            <LoginForm />
          </div>
        </section>
      </main>
    );
  }

  const database = await repository.getDatabase();
  const dashboard = buildDashboardView(database);

  return (
    <AppShell
      mode={repository.mode}
      currentUser={user}
      localStocks={database.localStocks}
      products={database.products}
      dashboard={dashboard}
    />
  );
}
