"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import type { TicketHistoryItem } from "@/types";

const INITIAL_COUNT = 5;

export function TicketHistory({ history }: { history: TicketHistoryItem[] }) {
  const [showAll, setShowAll] = useState(false);
  const items = showAll ? history : history.slice(0, INITIAL_COUNT);
  const hidden = history.length - INITIAL_COUNT;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Histórico</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <p className="font-semibold text-slate-950">{item.authorName}</p>
              <p className="text-xs text-slate-500">{formatDate(item.createdAt)}</p>
            </div>
            <p className="mt-2 text-sm leading-6 text-slate-700">{item.message}</p>
          </div>
        ))}
        {history.length > INITIAL_COUNT ? (
          <Button type="button" variant="outline" className="w-full" onClick={() => setShowAll(!showAll)}>
            {showAll ? "Ver menos" : `Ver mais ${hidden} entrada${hidden !== 1 ? "s" : ""}`}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
