export interface TicketCategory {
  value: string;
  label: string;
  suggestedRole: "ATTENDANT" | "TECHNICIAN" | null;
}

export const TICKET_CATEGORIES: TicketCategory[] = [
  { value: "E-mail",               label: "E-mail",                suggestedRole: "ATTENDANT"  },
  { value: "Acesso e cadastro",     label: "Acesso e cadastro",     suggestedRole: "ATTENDANT"  },
  { value: "Rede e infraestrutura", label: "Rede e infraestrutura", suggestedRole: "TECHNICIAN" },
  { value: "Hardware",              label: "Hardware",              suggestedRole: "TECHNICIAN" },
  { value: "Software",              label: "Software",              suggestedRole: "TECHNICIAN" },
  { value: "Impressora",            label: "Impressora",            suggestedRole: "TECHNICIAN" },
  { value: "PDV",                   label: "PDV",                   suggestedRole: "TECHNICIAN" },
  { value: "Telefonia",             label: "Telefonia",             suggestedRole: "TECHNICIAN" },
  { value: "Outros",                label: "Outros",                suggestedRole: null         }
];

export function getCategoryByValue(value?: string) {
  return TICKET_CATEGORIES.find((c) => c.value === value) ?? null;
}
