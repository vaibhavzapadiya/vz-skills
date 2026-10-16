import { forwardRef, type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link } from 'react-router';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse';
type Size = 'sm' | 'md' | 'lg';

const baseClass =
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium transition-[background-color,border-color,color,box-shadow,transform] duration-fast ease-out select-none disabled:opacity-50 disabled:pointer-events-none motion-safe:active:scale-[0.985]';

const variants: Record<Variant, string> = {
  primary:
    'bg-gradient-to-b from-accent to-accent-hover text-accent-fg shadow-[inset_0_1px_0_rgb(255_255_255/0.22),0_1px_2px_rgb(0_0_0/0.18),0_8px_20px_-10px_var(--accent)] hover:brightness-110',
  secondary:
    'bg-bg-raised text-fg border border-border-strong shadow-[inset_0_1px_0_var(--panel-highlight),0_1px_2px_rgb(0_0_0/0.05)] hover:border-fg/40 hover:bg-bg-sunken',
  ghost: 'text-fg-muted hover:text-fg hover:bg-bg-sunken',
  inverse: 'bg-bg-inverse text-fg-inverse hover:opacity-90',
};

const sizes: Record<Size, string> = {
  sm: 'h-8 px-3 text-[0.8125rem]',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-[0.9375rem]',
};

type Common = { variant?: Variant; size?: Size; className?: string; children: ReactNode };

export type ButtonProps = Common & ButtonHTMLAttributes<HTMLButtonElement>;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', className, children, type = 'button', ...rest },
  ref,
) {
  return (
    <button ref={ref} type={type} className={cn(baseClass, variants[variant], sizes[size], className)} {...rest}>
      {children}
    </button>
  );
});

type LinkButtonProps = Common & { to: string } & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'>;

/** Renders a router Link for internal paths, a plain anchor for external URLs and hashes. */
export function LinkButton({ variant = 'primary', size = 'md', className, children, to, ...rest }: LinkButtonProps) {
  const classes = cn(baseClass, variants[variant], sizes[size], className);
  const external = /^https?:\/\//.test(to);
  if (external) {
    return (
      <a href={to} className={classes} target="_blank" rel="noreferrer" {...rest}>
        {children}
      </a>
    );
  }
  if (to.startsWith('#')) {
    return (
      <a href={to} className={classes} {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link to={to} className={classes} {...rest}>
      {children}
    </Link>
  );
}
