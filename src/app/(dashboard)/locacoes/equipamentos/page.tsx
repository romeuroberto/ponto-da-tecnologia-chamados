import { PageHeader } from "@/components/layout/page-header";
import { EquipmentManager } from "@/components/rentals/equipment-manager";
import { requireRole } from "@/server/auth/session";
import { rentalService } from "@/server/services/rental-service";

export default async function EquipamentosPage() {
  const session = await requireRole(["ADMIN", "ATTENDANT"]);
  const equipment = await rentalService.listEquipment();
  const isAdmin = session.role === "ADMIN";

  const available = equipment.filter((e) => e.status === "DISPONIVEL").length;
  const rented = equipment.filter((e) => e.status === "LOCADO").length;
  const maintenance = equipment.filter((e) => e.status === "MANUTENCAO").length;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Equipamentos"
        description="Patrimônio de impressoras e dispositivos para locação"
      />

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
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
      </div>

      <EquipmentManager equipment={equipment} isAdmin={isAdmin} />
    </div>
  );
}
