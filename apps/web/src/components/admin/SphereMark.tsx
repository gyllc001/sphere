import { cn } from '@/lib/cn';

/** Sphere logomark — green disc + soft inner ring + dot. */
export function SphereMark({
  size = 28,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="16" fill="var(--accent)" />
      <circle
        cx="17.6"
        cy="15.4"
        r="9"
        stroke="rgba(255,255,255,0.55)"
        strokeWidth="2"
        fill="none"
      />
      <circle cx="16" cy="16" r="3.6" fill="rgba(255,255,255,0.35)" />
    </svg>
  );
}
