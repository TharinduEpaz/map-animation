import { COUNTRIES, getCountryName } from "~/lib/countries";
import type { CountryHighlightProps } from "~/remotion/schemata";

export const CountryHighlightControls = ({
  value,
  onChange,
}: {
  value: CountryHighlightProps;
  onChange: (value: CountryHighlightProps) => void;
}) => {
  const controlClass =
    "mt-1 block w-full rounded-geist border border-unfocused-border-color bg-background p-3 text-sm text-foreground";
  return (
    <div className="mb-5 grid gap-3 sm:grid-cols-2">
      <label className="text-xs font-medium text-subtitle">
        Country or territory
        <select
          aria-label="Country or territory"
          className={controlClass}
          value={value.countryId}
          onChange={(event) =>
            onChange({
              ...value,
              countryId: event.target.value,
              displayName: getCountryName(event.target.value),
            })
          }
        >
          {COUNTRIES.map((country) => (
            <option key={country.id} value={country.id}>
              {country.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-xs font-medium text-subtitle">
        Display name
        <input
          className={controlClass}
          maxLength={80}
          value={value.displayName}
          onChange={(event) =>
            onChange({ ...value, displayName: event.target.value })
          }
          placeholder={getCountryName(value.countryId)}
        />
      </label>
      <label className="text-xs font-medium text-subtitle sm:col-span-2">
        Subtitle (optional)
        <input
          className={controlClass}
          maxLength={120}
          value={value.subtitle}
          onChange={(event) =>
            onChange({ ...value, subtitle: event.target.value })
          }
          placeholder="Add a short description"
        />
      </label>
      <label className="text-xs font-medium text-subtitle">
        Framing
        <select
          className={controlClass}
          value={value.framing}
          onChange={(event) =>
            onChange({
              ...value,
              framing: event.target.value as CountryHighlightProps["framing"],
            })
          }
        >
          <option value="all">Entire country, including islands</option>
          <option value="mainland">Largest landmass</option>
        </select>
      </label>
      <label className="text-xs font-medium text-subtitle">
        Highlight color
        <input
          type="color"
          className="mt-1 block h-11 w-full cursor-pointer rounded-geist border border-unfocused-border-color bg-background p-1"
          value={value.highlightColor}
          onChange={(event) =>
            onChange({ ...value, highlightColor: event.target.value })
          }
        />
      </label>
    </div>
  );
};
