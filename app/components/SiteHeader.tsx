import React from "react";

const CoffeeIcon: React.FC = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="M17 8h1a4 4 0 1 1 0 8h-1" />
    <path d="M3 8h14v9a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4Z" />
    <line x1="6" x2="6" y1="2" y2="4" />
    <line x1="10" x2="10" y1="2" y2="4" />
    <line x1="14" x2="14" y1="2" y2="4" />
  </svg>
);

export const SiteHeader: React.FC<{ coffeeUrl: string | null }> = ({
  coffeeUrl,
}) => {
  return (
    <header className="border-b border-unfocused-border-color bg-background">
      <div className="max-w-screen-md m-auto flex h-14 items-center justify-between px-4 md:px-0">
        <span className="text-sm font-bold tracking-widest text-foreground sm:text-base">
          FREE MAP ANIMATOR
        </span>
        {coffeeUrl ? (
          <a
            href={coffeeUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 items-center gap-2 rounded-geist bg-[#FFDD00] px-3 text-sm font-semibold text-black transition-opacity hover:opacity-85"
          >
            <CoffeeIcon />
            Buy me a coffee
          </a>
        ) : null}
      </div>
    </header>
  );
};
