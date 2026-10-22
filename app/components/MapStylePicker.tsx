import {
  MAP_STYLE_IDS,
  MAP_THEMES,
  type MapStyleId,
} from "~/remotion/map-styles";

export const MapStylePicker = ({
  value,
  onChange,
}: {
  value: MapStyleId;
  onChange: (value: MapStyleId) => void;
}) => (
  <fieldset className="mb-6">
    <legend className="mb-3 text-sm font-medium">Map style</legend>
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
      {MAP_STYLE_IDS.map((id) => {
        const theme = MAP_THEMES[id];
        return (
          <label key={id} className="min-w-0 cursor-pointer">
            <input
              type="radio"
              name="map-style"
              value={id}
              checked={value === id}
              onChange={() => onChange(id)}
              className="peer sr-only"
            />
            <span className="block overflow-hidden rounded-lg border border-unfocused-border-color p-1 peer-checked:border-blue-500 peer-checked:ring-1 peer-checked:ring-blue-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-4 peer-focus-visible:outline-blue-500 hover:border-focused-border-color">
              <svg
                viewBox="0 0 160 76"
                aria-hidden="true"
                className="w-full rounded-md"
              >
                <path fill={theme.water} d="M0 0h160v76H0z" />
                <path
                  fill={theme.land}
                  d="M0 0h112l-9 15-20 7-4 16-21 6-12 20-23 12H0zM142 44l18-9v41h-39l7-17z"
                />
                <path
                  d="M0 23l79 9M23 0l13 76M0 58l100-44M61 0L13 76"
                  fill="none"
                  stroke={theme.road}
                  strokeWidth="3"
                />
                <path
                  d="M30 53Q71 4 132 54"
                  fill="none"
                  stroke={theme.routeColor ?? "#f03b20"}
                  strokeWidth="3"
                  strokeDasharray={id === "vintage" ? "5 3" : undefined}
                />
                <g fill={theme.ink} stroke={theme.halo} strokeWidth="2">
                  <circle cx="30" cy="53" r="4" />
                  <circle cx="132" cy="54" r="4" />
                </g>
              </svg>
              <span className="block px-1 pt-2 text-sm font-medium">
                {theme.label}
              </span>
              <span className="block px-1 pb-2 pt-0.5 text-xs text-subtitle">
                {theme.description}
              </span>
            </span>
          </label>
        );
      })}
    </div>
  </fieldset>
);
