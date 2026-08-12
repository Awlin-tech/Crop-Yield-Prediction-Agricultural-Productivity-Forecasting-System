import type { InputHTMLAttributes } from "react";

interface FieldInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  unit?: string;
  error?: string;
}

/**
 * A single ledger row: label on the left, instrument-style monospace
 * input on the right, unit tag if applicable. Used across auth and
 * farm-onboarding forms so every numeric reading reads like a field log.
 */
export default function FieldInput({ label, unit, error, id, ...rest }: FieldInputProps) {
  const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <div className="border-b border-line py-3">
      <div className="flex items-baseline justify-between gap-4">
        <label htmlFor={inputId} className="text-sm text-ink/70">
          {label}
        </label>
        {unit && <span className="text-xs font-mono text-ink/40">{unit}</span>}
      </div>
      <input
        id={inputId}
        {...rest}
        className="mt-1 w-full bg-transparent font-mono text-base text-ink placeholder:text-ink/30 focus:outline-none"
      />
      {error && <p className="mt-1 text-xs text-clay">{error}</p>}
    </div>
  );
}
