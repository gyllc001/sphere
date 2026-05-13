'use client';

import {
  forwardRef,
  HTMLAttributes,
  ComponentPropsWithoutRef,
  ElementRef,
  ReactNode,
} from 'react';
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { X } from 'lucide-react';

import { cn } from '@/lib/cn';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;
export const DialogPortal = DialogPrimitive.Portal;

const OVERLAY_CLASSES =
  'fixed inset-0 z-40 bg-black/50 backdrop-blur-sm ' +
  'data-[state=open]:animate-[dialog-overlay-fade-in_150ms_ease-out] ' +
  'data-[state=closed]:animate-[dialog-overlay-fade-out_120ms_ease-in]';

export const DialogOverlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function DialogOverlay({ className, ...rest }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn(OVERLAY_CLASSES, className)}
      {...rest}
    />
  );
});

const CONTENT_CLASSES =
  'fixed left-1/2 top-1/2 z-50 -translate-x-1/2 -translate-y-1/2 ' +
  'w-full max-w-md bg-surface text-primary border border-default rounded-md shadow-card p-6 ' +
  'focus:outline-none ' +
  'data-[state=open]:animate-[dialog-content-show_150ms_ease-out] ' +
  'data-[state=closed]:animate-[dialog-content-hide_120ms_ease-in]';

export interface DialogContentProps
  extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** Hide the default top-right close (X) button. Defaults to false. */
  hideCloseButton?: boolean;
  children?: ReactNode;
}

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent(
  { className, children, hideCloseButton = false, ...rest },
  ref,
) {
  return (
    <DialogPortal>
      <DialogOverlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(CONTENT_CLASSES, className)}
        {...rest}
      >
        {children}
        {!hideCloseButton && (
          <DialogPrimitive.Close
            aria-label="Close"
            className="absolute right-3 top-3 inline-flex h-7 w-7 items-center justify-center rounded-sm text-secondary hover:bg-subtle hover:text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
          >
            <X size={16} strokeWidth={1.75} />
          </DialogPrimitive.Close>
        )}
      </DialogPrimitive.Content>
    </DialogPortal>
  );
});

export type DialogHeaderProps = HTMLAttributes<HTMLDivElement>;

export function DialogHeader({ className, ...rest }: DialogHeaderProps) {
  return <div className={cn('flex flex-col gap-1', className)} {...rest} />;
}

export type DialogFooterProps = HTMLAttributes<HTMLDivElement>;

export function DialogFooter({ className, ...rest }: DialogFooterProps) {
  return (
    <div
      className={cn('flex justify-end gap-2 mt-6', className)}
      {...rest}
    />
  );
}

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...rest }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn(
        'font-display text-lg font-semibold text-primary',
        className,
      )}
      {...rest}
    />
  );
});

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...rest }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('text-sm text-secondary mt-1', className)}
      {...rest}
    />
  );
});
