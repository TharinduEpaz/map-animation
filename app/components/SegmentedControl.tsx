import { cn } from "~/lib/utils";

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  disabled,
}: {
  options: readonly { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  disabled?: boolean;
}) {
  return (
    <div
      role="tablist"
      className="inline-flex gap-1 rounded-geist border border-unfocused-border-color p-1"
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={selected}
            disabled={disabled}
            onClick={() => onChange(option.value)}
            className={cn(
              "h-8 rounded-geist px-geist-half font-geist text-sm font-medium transition-colors duration-150 disabled:cursor-not-allowed disabled:opacity-50",
              selected
                ? "bg-foreground text-background"
                : "text-foreground/60 hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
