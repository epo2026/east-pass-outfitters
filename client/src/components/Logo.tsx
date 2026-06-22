interface LogoProps {
  className?: string;
  showText?: boolean;
}

// East Pass Outfitters mark: a fish-hook tucked inside a stylized water drop / pass inlet.
export function Logo({ className = "", showText = true }: LogoProps) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg
        width="34"
        height="34"
        viewBox="0 0 32 32"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <path
          d="M16 4 C10.5 10 10.5 16 16 22 C21.5 16 21.5 10 16 4 Z"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M16 21.5 v3.5 a4.2 4.2 0 0 0 7.4 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
        <circle cx="23.4" cy="26.4" r="1.5" fill="currentColor" />
      </svg>
      {showText && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-base font-700 tracking-tight">
            EAST PASS
          </span>
          <span className="text-[0.6rem] font-500 uppercase tracking-[0.28em] text-muted-foreground">
            Outfitters
          </span>
        </span>
      )}
    </span>
  );
}
