/**
 * Sphere logomark — circle with offset inner ring (brand guide spec).
 * Outer circle: full fill. Inner ring: 3px stroke, 60% opacity, 8° clockwise offset.
 */
export function SphereLogo({
  size = 28,
  className = '',
  color = '#4F46E5',
}: {
  size?: number;
  className?: string;
  /** Fill color for the outer circle. Inner ring uses white at 60% opacity. */
  color?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="16" fill={color} />
      <circle
        cx="17.2"
        cy="15.6"
        r="9.6"
        stroke="rgba(255,255,255,0.6)"
        strokeWidth="3"
        fill="none"
      />
    </svg>
  );
}

/**
 * Full Sphere lockup: logomark + wordmark.
 * Use in nav headers and login screens.
 */
export function SphereWordmark({
  size = 28,
  className = '',
}: {
  size?: number;
  className?: string;
}) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <SphereLogo size={size} />
      <span
        style={{ fontWeight: 600, letterSpacing: '0.02em' }}
        className="text-gray-950"
      >
        Sphere
      </span>
    </span>
  );
}
