import { getSlaInfo } from "@/lib/sla";
import type { Ticket } from "@/types";

const priorityWeight = {
  CRITICAL: 4,
  HIGH: 3,
  MEDIUM: 2,
  LOW: 1
} as const;

const slaWeight = {
  breached: 3,
  warning: 2,
  on_track: 1,
  paused: 0,
  stopped: 0
} as const;

export function compareAvailableFieldTickets(left: Ticket, right: Ticket) {
  const leftSla = slaWeight[getSlaInfo(left).state];
  const rightSla = slaWeight[getSlaInfo(right).state];

  if (leftSla !== rightSla) {
    return rightSla - leftSla;
  }

  const leftPriority = priorityWeight[left.priority];
  const rightPriority = priorityWeight[right.priority];

  if (leftPriority !== rightPriority) {
    return rightPriority - leftPriority;
  }

  return Date.parse(right.updatedAt) - Date.parse(left.updatedAt);
}
