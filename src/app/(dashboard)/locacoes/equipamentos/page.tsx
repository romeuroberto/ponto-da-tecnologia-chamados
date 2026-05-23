import { PageHeader } from "@/components/layout/page-header";
import { EquipmentManager } from "@/components/rentals/equipment-manager";
import { ReserveLoanPanel } from "@/components/rentals/reserve-loan-panel";
import { requireRole } from "@/server/auth/session";
import { rentalService } from "@/server/services/rental-service";
import { clientService } from "@/server/services/client-service";

export default async function EquipamentosPage() {
  const session = await requireRole(["ADMIN", "ATTENDANT"]);
  const isAdmin = session.role === "ADMIN";

  const [equipment, activeLoans, clients] = await Promise.all([
    rentalService.listEquipment(),
    rentalService.listActiveLoans(),
    clientService.listClients()
  ]);

  const available = equipment.filter((e) => e.status === "DISPONIVEL" && !e.isReserve).length;
  const rented = equipment.filter((e) => e.status === "LOCADO" && !e.isReserve).length;
  const maintenance = equipment.filter((e) => e.status === "MANUTENCAO").length;
  const reserves = equipment.filter((e) => e.isReserve).length;

  const reserveEquipment = equipment.filter((e) => e.isReserve);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipamentos"
        description="Patrimônio de impressoras e dispositivos para locação"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-5">
        <div className="rounded-xl border bg-white p-4 shadow-sm">
          <p className="text-xs text-slate-500 uppercase tracking-wide font-semibold">Total</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{equipment.length}</p>
        </div>
        <div className="rounded-xl border bg-emerald-50 p-4 shadow-sm">
          <p className="text-xs text-emerald-700 uppercase tracking-wide font-semibold">Disponíveis</p>
          <p className="mt-1 text-2xl font-bold text-emerald-800">{available}</p>
        </div>
        <div className="rounded-xl border bg-blue-50 p-4 shadow-sm">
          <p className="text-xs text-blue-700 uppercase tracking-wide font-semibold">Locados</p>
          <p className="mt-1 text-2xl font-bold text-blue-800">{rented}</p>
        </div>
        <div className="rounded-xl border bg-amber-50 p-4 shadow-sm">
          <p className="text-xs text-amber-700 uppercase tracking-wide font-semibold">Manutenção</p>
          <p className="mt-1 text-2xl font-bold text-amber-800">{maintenance}</p>
        </div>
        <div className="rounded-xl border bg-violet-50 p-4 shadow-sm">
          <p className="text-xs text-violet-700 uppercase tracking-wide font-semibold">Reservas</p>
          <p className="mt-1 text-2xl font-bold text-violet-800">{reserves}</p>
        </div>
      </div>

      <ReserveLoanPanel
        activeLoans={activeLoans}
        reserveEquipment={reserveEquipment}
        allEquipment={equipment}
        clients={clients}
        isAdmin={isAdmin}
      />

      <EquipmentManager equipment={equipment} isAdmin={isAdmin} />
    </div>
  );
}
