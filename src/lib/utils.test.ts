import { describe, expect, it } from "vitest";
import { formatBrazilianPhone, formatCurrency, normalizeBrazilianPhone, parseCurrencyInput } from "@/lib/utils";

describe("formatBrazilianPhone", () => {
  it("formata celular com 11 dígitos", () => {
    expect(formatBrazilianPhone("11987654321")).toBe("(11) 98765-4321");
  });

  it("formata telefone fixo com 10 dígitos", () => {
    expect(formatBrazilianPhone("1134567890")).toBe("(11) 3456-7890");
  });

  it("formata parcialmente durante a digitação", () => {
    expect(formatBrazilianPhone("1")).toBe("(1");
    expect(formatBrazilianPhone("1198")).toBe("(11) 98");
  });

  it("ignora caracteres não numéricos e excesso de dígitos", () => {
    expect(formatBrazilianPhone("(11) 98765-4321 0000")).toBe("(11) 98765-4321");
  });
});

describe("normalizeBrazilianPhone", () => {
  it("retorna undefined para valores vazios", () => {
    expect(normalizeBrazilianPhone(undefined)).toBeUndefined();
    expect(normalizeBrazilianPhone("")).toBeUndefined();
    expect(normalizeBrazilianPhone("---")).toBeUndefined();
  });

  it("normaliza telefones digitados em qualquer formato", () => {
    expect(normalizeBrazilianPhone("11 98765 4321")).toBe("(11) 98765-4321");
  });
});

describe("moeda", () => {
  it("converte valores digitados no padrão brasileiro", () => {
    expect(parseCurrencyInput("R$ 1.234,56")).toBe(1234.56);
    expect(parseCurrencyInput("150")).toBe(150);
    expect(parseCurrencyInput("abc")).toBe(0);
  });

  it("formata em reais", () => {
    expect(formatCurrency(1234.5).replace(/\s/g, " ")).toBe("R$ 1.234,50");
  });
});
