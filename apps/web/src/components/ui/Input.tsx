import { InputHTMLAttributes, forwardRef, ReactNode, useId } from 'react';

import { cn } from '@/lib/cn';

export interface InputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> {
  label?: ReactNode;
  /** Helper text shown below the input. Hidden when `error` is set. */
  hint?: ReactNode;
  error?: ReactNode;
  /** Optional class applied to the outer wrapper. */
  wrapperClassName?: string;
}

const INPUT_BASE =
  'w-full bg-surface border border-default rounded-sm px-3 py-2 text-sm text-primary ' +
  'placeholder:text-tertiary ' +
  'focus:border-accent focus:ring-[3px] focus:ring-[rgba(0,198,98,0.15)] focus:outline-none ' +
  'disabled:opacity-60 disabled:cursor-not-allowed';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    label,
    hint,
    error,
    className,
    wrapperClassName,
    type = 'text',
    ...rest
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id || generatedId;
  const hasError = Boolean(error);

  return (
    <div className={cn('flex flex-col gap-1.5', wrapperClassName)}>
      {label && (
        <label
          htmlFor={inputId}
          className="text-[13px] font-medium text-primary"
        >
          {label}
        </label>
      )}
      <input
        ref={ref}
        id={inputId}
        type={type}
        aria-invalid={hasError || undefined}
        aria-describedby={
          hasError
            ? `${inputId}-error`
            : hint
              ? `${inputId}-hint`
              : undefined
        }
        className={cn(
          INPUT_BASE,
          hasError &&
            'border-red-500 focus:border-red-500 focus:ring-[rgba(239,68,68,0.15)]',
          className,
        )}
        {...rest}
      />
      {hasError ? (
        <span id={`${inputId}-error`} className="text-xs text-red-600">
          {error}
        </span>
      ) : hint ? (
        <span id={`${inputId}-hint`} className="text-xs text-tertiary">
          {hint}
        </span>
      ) : null}
    </div>
  );
});
