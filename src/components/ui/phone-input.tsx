"use client";

import * as React from "react";

import { Input, type InputProps } from "@/components/ui/input";
import { formatBrazilianPhone } from "@/lib/utils";

export interface PhoneInputProps extends Omit<InputProps, "type" | "value" | "defaultValue" | "onChange"> {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
}

export const PhoneInput = React.forwardRef<HTMLInputElement, PhoneInputProps>(
  ({ value, defaultValue, onValueChange, ...props }, ref) => {
    const isControlled = value !== undefined;
    const [internalValue, setInternalValue] = React.useState(() => formatBrazilianPhone(defaultValue ?? ""));
    const displayValue = isControlled ? formatBrazilianPhone(value ?? "") : internalValue;

    function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
      const maskedValue = formatBrazilianPhone(event.target.value);

      if (!isControlled) {
        setInternalValue(maskedValue);
      }

      onValueChange?.(maskedValue);
    }

    return (
      <Input
        {...props}
        ref={ref}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        value={displayValue}
        onChange={handleChange}
      />
    );
  }
);

PhoneInput.displayName = "PhoneInput";
