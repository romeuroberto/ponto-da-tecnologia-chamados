"use client";

import * as React from "react";

import { Input, type InputProps } from "@/components/ui/input";

interface CurrencyInputProps extends Omit<InputProps, "type" | "value" | "defaultValue" | "onChange"> {
  name: string;
  defaultValue?: number;
}

function formatDisplay(cents: number): string {
  return (cents / 100).toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function CurrencyInput({ name, defaultValue, disabled, required, placeholder, ...props }: CurrencyInputProps) {
  const initialCents = defaultValue !== undefined && defaultValue > 0 ? Math.round(defaultValue * 100) : 0;
  const [cents, setCents] = React.useState(initialCents);
  const [touched, setTouched] = React.useState(initialCents > 0);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, "");
    setCents(parseInt(digits || "0", 10));
    setTouched(true);
  }

  const displayValue = touched ? formatDisplay(cents) : "";
  const numericValue = cents > 0 ? (cents / 100).toFixed(2) : "";

  return (
    <>
      <Input
        {...props}
        type="text"
        inputMode="numeric"
        value={displayValue}
        onChange={handleChange}
        disabled={disabled}
        required={required}
        placeholder={placeholder ?? "0,00"}
      />
      <input type="hidden" name={name} value={numericValue} />
    </>
  );
}
