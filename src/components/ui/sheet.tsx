import * as React from 'react';
import { X } from 'lucide-react';
import { cn } from './button';

interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'bottom' | 'right' | 'left';
}

export function Sheet({ open, onOpenChange, children, side = 'bottom' }: SheetProps) {
  if (!open) return null;

  const sideStyles = {
    bottom:
      'bottom-0 left-0 right-0 max-h-[85vh] rounded-t-3xl border-t border-slate-200 dark:border-slate-800 animate-in slide-in-from-bottom duration-200',
    right:
      'top-0 right-0 bottom-0 w-full sm:max-w-md border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200',
    left:
      'top-0 left-0 bottom-0 w-full sm:max-w-xs border-r border-slate-200 dark:border-slate-800 animate-in slide-in-from-left duration-200',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
      />
      <div
        className={cn(
          'fixed z-50 bg-white p-6 shadow-2xl dark:bg-slate-900 overflow-y-auto flex flex-col',
          sideStyles[side]
        )}
      >
        {/* Grab handle for bottom sheet */}
        {side === 'bottom' && (
          <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-slate-300 dark:bg-slate-700" />
        )}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        {children}
      </div>
    </div>
  );
}

export function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('flex flex-col space-y-1.5 text-left mb-4', className)}
      {...props}
    />
  );
}

export function SheetTitle({
  className,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn('text-lg font-bold tracking-tight text-slate-900 dark:text-white', className)}
      {...props}
    />
  );
}

export function SheetDescription({
  className,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p
      className={cn('text-sm text-slate-500 dark:text-slate-400', className)}
      {...props}
    />
  );
}
