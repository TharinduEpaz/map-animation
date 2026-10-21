import { type RouteMapProps } from "../schemata";

// Top-down twin-engine airliner, with its nose pointing north for route bearings.
const planeSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="128" height="128" viewBox="0 0 64 64">
  <defs>
    <linearGradient id="fuselage" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0" stop-color="#94a3b8"/>
      <stop offset="0.35" stop-color="#f8fafc"/>
      <stop offset="0.6" stop-color="#ffffff"/>
      <stop offset="1" stop-color="#94a3b8"/>
    </linearGradient>
    <linearGradient id="wing" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0" stop-color="#f8fafc"/>
      <stop offset="1" stop-color="#94a3b8"/>
    </linearGradient>
  </defs>
  <g stroke="#334155" stroke-width="0.8" stroke-linejoin="round">
    <path d="M29 44 L18 54 L18 57 L31 53 L33 53 L46 57 L46 54 L35 44Z" fill="url(#wing)"/>
    <rect x="18.5" y="28" width="4.5" height="12" rx="2.2" fill="url(#fuselage)"/>
    <rect x="41" y="28" width="4.5" height="12" rx="2.2" fill="url(#fuselage)"/>
    <path d="M29 22 L4 38 L3 43 L28 35 L36 35 L61 43 L60 38 L35 22Z" fill="url(#wing)"/>
    <path d="M4 38 L3 35 L2 42 L3 43 M60 38 L61 35 L62 42 L61 43" fill="#2563eb"/>
    <path d="M32 2 C29 3 27.5 8 27.5 15 L28 43 C28 51 30 58 32 61 C34 58 36 51 36 43 L36.5 15 C36.5 8 35 3 32 2Z" fill="url(#fuselage)"/>
  </g>
  <path d="M28.7 10 Q32 7.5 35.3 10 L34.7 13 Q32 11.5 29.3 13Z" fill="#0f2742"/>
  <path d="M32 9 L32 12" stroke="#cbd5e1" stroke-width="0.6"/>
  <path d="M29.2 17 L29.2 29 M34.8 17 L34.8 29 M29.7 37 L29.7 45 M34.3 37 L34.3 45" stroke="#334155" stroke-width="0.9" stroke-dasharray="0.8 1.8" stroke-linecap="round"/>
  <path d="M7 39 L26 32 M38 32 L57 39 M20 54 L28 50 M36 50 L44 54" fill="none" stroke="#64748b" stroke-width="0.6"/>
  <path d="M19.2 30 L22.3 30 M41.7 30 L44.8 30" stroke="#0f172a" stroke-width="1.8"/>
  <path d="M32 44 L30.5 56 L32 61 L33.5 56Z" fill="#2563eb" stroke="#1e40af" stroke-width="0.5"/>
  <circle cx="3" cy="41" r="0.8" fill="#ef4444"/>
  <circle cx="61" cy="41" r="0.8" fill="#22c55e"/>
</svg>`;

// Top-down car, with its hood pointing north to match the route bearing.
const carSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64">
  <g fill="#17212b" stroke="#ffffff" stroke-width="1.5">
    <rect x="15" y="14" width="7" height="12" rx="2.5"/>
    <rect x="42" y="14" width="7" height="12" rx="2.5"/>
    <rect x="15" y="42" width="7" height="12" rx="2.5"/>
    <rect x="42" y="42" width="7" height="12" rx="2.5"/>
  </g>
  <path d="M23 4 Q32 1 41 4 Q46 7 46 16 L46 48 Q46 59 40 60 L24 60 Q18 59 18 48 L18 16 Q18 7 23 4Z" fill="#2563eb" stroke="#ffffff" stroke-width="2"/>
  <path d="M24 8 Q32 5 40 8 L41 16 L23 16Z" fill="#60a5fa"/>
  <path d="M23 20 Q32 17 41 20 L39 30 L25 30Z" fill="#172b46" stroke="#bfdbfe" stroke-width="1"/>
  <path d="M21 25 L24 33 L24 43 L21 47Z M43 25 L40 33 L40 43 L43 47Z" fill="#172b46"/>
  <rect x="26" y="32" width="12" height="12" rx="2" fill="#60a5fa"/>
  <path d="M25 46 L39 46 L41 53 Q32 56 23 53Z" fill="#172b46" stroke="#bfdbfe" stroke-width="1"/>
  <path d="M18 23 L13 25 L13 29 L18 28 M46 23 L51 25 L51 29 L46 28" fill="#2563eb" stroke="#ffffff" stroke-width="1.5" stroke-linejoin="round"/>
  <path d="M22 9 L25 8 M39 8 L42 9" stroke="#fef3c7" stroke-width="3" stroke-linecap="round"/>
  <path d="M22 56 L26 57 M38 57 L42 56" stroke="#fb7185" stroke-width="2.5" stroke-linecap="round"/>
</svg>`;

const svgToDataUrl = (svg: string) =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

const loadIcon = (svg: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = svgToDataUrl(svg);
  });
};

export const vehicleIconId = (vehicle: RouteMapProps["vehicle"]) => {
  return vehicle === "car" ? "car-icon" : "plane-icon";
};

export const vehicleIconSize = (vehicle: RouteMapProps["vehicle"]) =>
  vehicle === "car" ? 0.7 : 1.1;

export const loadVehicleImages = async () => {
  const [plane, car] = await Promise.all([
    loadIcon(planeSvg),
    loadIcon(carSvg),
  ]);
  return { plane, car };
};
