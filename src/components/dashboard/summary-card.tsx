import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SummaryCard({
  title,
  value,
  tone
}: {
  title: string;
  value: number;
  tone: "blue" | "orange" | "yellow" | "slate" | "red" | "violet" | "green";
}) {
  const tones = {
    blue: "bg-sky-50 text-sky-700",
    orange: "bg-orange-50 text-orange-700",
    yellow: "bg-amber-50 text-amber-700",
    slate: "bg-slate-100 text-slate-700",
    red: "bg-rose-50 text-rose-700",
    violet: "bg-violet-50 text-violet-700",
    green: "bg-emerald-50 text-emerald-700"
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`inline-flex rounded-2xl px-4 py-3 text-3xl font-semibold ${tones[tone]}`}>{value}</div>
      </CardContent>
    </Card>
  );
}
