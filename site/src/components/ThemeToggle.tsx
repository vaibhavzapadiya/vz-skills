import { useTheme } from '@/lib/theme';
import { IconMoon, IconSun } from './Icons';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className }: { className?: string }) {
  const { resolved, toggle } = useTheme();
  const next = resolved === 'dark' ? 'light' : 'dark';
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className={cn(
        'inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted transition-colors duration-fast hover:bg-bg-sunken hover:text-fg',
        className,
      )}
    >
      {resolved === 'dark' ? <IconSun size={18} /> : <IconMoon size={18} />}
    </button>
  );
}
