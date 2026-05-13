import { ButtonHTMLAttributes, forwardRef, ReactNode } from 'react';

import { cn } from '@/lib/cn';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonVariantProps {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export interface ButtonProps
  extends ButtonHTMLAttributes<HTMLButtonElement>,
    ButtonVariantProps {
  /** Optional icon rendered before the label. */
  leadingIcon?: ReactNode;
  /** Optional icon rendered after the label. */
  trailingIcon?: ReactNode;
}

const BASE =
  'inline-flex items-center justify-center gap-1.5 rounded-sm font-medium transition-colors ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent ' +
  'disabled:opacity-50 disabled:pointer-events-none';

const VARIANT: Record<ButtonVariant, string> = {
  primary: 'bg-accent text-white hover:bg-accent-hover',
  secondary:
    'bg-surface text-primary border border-strong hover:bg-subtle',
  ghost: 'bg-transparent text-secondary hover:bg-subtle hover:text-primary',
};

const SIZE: Record<ButtonSize, string> = {
  sm: 'h-[30px] px-3 text-[13px]',
  md: 'h-9 px-[18px] text-sm',
  lg: 'h-11 px-6 text-[15px]',
};

/**
 * Produce the className string for a Button without rendering one. Use this
 * to style non-button elements (e.g. <Link>) with button visuals so we don't
 * end up with nested interactive elements (<a><button>) — which Lighthouse +
 * axe flag and which can confuse focus / click behavior.
 *
 *   <Link href="/signup" className={buttonClasses({ variant: 'primary', size: 'lg' })}>
 *     Get started
 *   </Link>
 */
export function buttonClasses({
  variant = 'primary',
  size = 'md',
}: ButtonVariantProps = {}) {
  return cn(BASE, VARIANT[variant], SIZE[size]);
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    className,
    variant = 'primary',
    size = 'md',
    type = 'button',
    leadingIcon,
    trailingIcon,
    children,
    ...rest
  },
  ref,
) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(buttonClasses({ variant, size }), className)}
      {...rest}
    >
      {leadingIcon}
      {children}
      {trailingIcon}
    </button>
  );
});
