import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <div className="max-w-md text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-700">404</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950">Pagina nao encontrada</h1>
        <p className="mt-3 text-sm text-slate-600">O recurso solicitado nao existe ou ainda nao foi implementado.</p>
        <div className="mt-6">
          <Link href="/dashboard">
            <Button>Voltar ao dashboard</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
