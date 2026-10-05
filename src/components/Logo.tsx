type LogoProps = {
  variant?: 'full' | 'mark';
  size?: number;
  className?: string;
};

export function Logo({ variant = 'full', size = 40, className = '' }: LogoProps) {
  const markSize = variant === 'full' ? size : size;
  const textSize = Math.round(size * 0.62);
  // unique mask id per instance to avoid collisions
  const maskId = `logo-hole-${size}-${variant}`;

  return (
    <span
      role="img"
      aria-label="Patitas"
      className={`inline-flex items-center gap-2.5 ${className}`}
      style={{ color: 'currentColor' }}
    >
      <svg
        width={markSize}
        height={markSize}
        viewBox="0 0 120 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="shrink-0"
      >
        {/* 4 dedos - sol #FFC857 */}
        <ellipse cx="24" cy="48" rx="9" ry="12" transform="rotate(-22 24 48)" fill="#FFC857" />
        <ellipse cx="45" cy="28" rx="9" ry="13" transform="rotate(-8 45 28)" fill="#FFC857" />
        <ellipse cx="75" cy="28" rx="9" ry="13" transform="rotate(8 75 28)" fill="#FFC857" />
        <ellipse cx="96" cy="48" rx="9" ry="12" transform="rotate(22 96 48)" fill="#FFC857" />
        {/* Almohadilla pin con hueco transparente */}
        <defs>
          <mask id={maskId}>
            <rect width="120" height="120" fill="white" />
            <circle cx="60" cy="75" r="8" fill="black" />
          </mask>
        </defs>
        <path
          d="M60 110 C60 110 33 91 33 74 C33 62 44 54 60 54 C76 54 87 62 87 74 C87 91 60 110 60 110Z"
          fill="#FF6B35"
          mask={`url(#${maskId})`}
        />
      </svg>
      {variant === 'full' ? (
        <span
          style={{
            fontFamily: '"Baloo 2", cursive',
            fontWeight: 800,
            fontSize: textSize,
            letterSpacing: '-0.02em',
            lineHeight: 1,
            textTransform: 'lowercase',
          }}
        >
          patitas
        </span>
      ) : null}
    </span>
  );
}

export default Logo;
