import { auth } from "@/auth";
import { PortalSignOutButton } from "@/components/portal/portal-sign-out-button";

export async function FieldAppTopbar() {
  const session = await auth();
  const user = session?.user;

  return (
    <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/92 backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-between gap-3 px-4 pb-3 pt-[calc(env(safe-area-inset-top)+0.75rem)]">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-emerald-700">Modo técnico</p>
          <p className="truncate text-sm font-semibold text-slate-950">{user?.name ?? "Técnico"}</p>
        </div>

        <PortalSignOutButton callbackUrl="/field-app-login?callbackUrl=/field-app" />
      </div>
    </header>
  );
}
