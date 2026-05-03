import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function TrendChart({
  title,
  description,
  total,
  data,
  tone
}: {
  title: string;
  description: string;
  total: number;
  data: Array<{ label: string; value: number }>;
  tone: "blue" | "green";
}) {
  const maxValue = Math.max(...data.map((item) => item.value), 1);
  const barTone = {
    blue: "bg-sky-500",
    green: "bg-emerald-500"
  };

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle>{title}</CardTitle>
        <p className="text-sm text-slate-600">{description}</p>
      </CardHeader>
      <CardContent>
        <div className="mb-5 flex items-end justify-between">
          <div>
            <p className="text-3xl font-semibold text-slate-950">{total}</p>
            <p className="text-sm text-slate-500">Últimos 7 dias</p>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-3">
          {data.map((item) => {
            const height = item.value > 0 ? Math.max(16, Math.round((item.value / maxValue) * 100)) : 6;

            return (
              <div key={item.label} className="flex flex-col items-center gap-2">
                <span className="text-xs font-medium text-slate-500">{item.value}</span>
                <div className="flex h-28 w-full items-end rounded-2xl bg-slate-100 px-1.5 py-1.5">
                  <div className={`w-full rounded-xl ${barTone[tone]}`} style={{ height: `${height}%` }} />
                </div>
                <span className="text-xs text-slate-500">{item.label}</span>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
