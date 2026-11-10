import { describe, expect, it } from "vitest";
import { clientSchema } from "@/lib/validations/client";
import { ticketSchema } from "@/lib/validations/ticket";

const validTicket = {
  clientId: "client-1",
  title: "Impressora sem conexão",
  description: "A impressora do financeiro parou de imprimir pela rede.",
  attendanceType: "REMOTE",
  priority: "HIGH",
  requesterName: "Ana",
  requesterEmail: ""
};

describe("ticketSchema", () => {
  it("aceita um chamado válido", () => {
    expect(ticketSchema.safeParse(validTicket).success).toBe(true);
  });

  it("exige cliente, título e descrição", () => {
    const result = ticketSchema.safeParse({ ...validTicket, clientId: "", title: "ab", description: "curta" });
    expect(result.success).toBe(false);
    const fields = result.error?.issues.map((issue) => issue.path[0]);
    expect(fields).toEqual(expect.arrayContaining(["clientId", "title", "description"]));
  });

  it("rejeita prioridade fora da lista", () => {
    expect(ticketSchema.safeParse({ ...validTicket, priority: "URGENT" }).success).toBe(false);
  });

  it("rejeita e-mail inválido do solicitante", () => {
    expect(ticketSchema.safeParse({ ...validTicket, requesterEmail: "ana@" }).success).toBe(false);
  });
});

describe("clientSchema", () => {
  const validClient = { name: "Padaria Central", contactName: "José" };

  it("aceita um cliente mínimo e aplica padrões", () => {
    const result = clientSchema.parse(validClient);
    expect(result.isReseller).toBe(false);
  });

  it("converte valores numéricos do perfil de cobrança", () => {
    const result = clientSchema.parse({
      ...validClient,
      billingProfile: { defaultBillingType: "CONTRATO", hourlyRate: "120", defaultDiscountPercent: "10" }
    });
    expect(result.billingProfile?.hourlyRate).toBe(120);
    expect(result.billingProfile?.defaultDiscountPercent).toBe(10);
  });

  it("limita o desconto a 100%", () => {
    const result = clientSchema.safeParse({
      ...validClient,
      billingProfile: { defaultBillingType: "AVULSO", defaultDiscountPercent: 150 }
    });
    expect(result.success).toBe(false);
  });
});
