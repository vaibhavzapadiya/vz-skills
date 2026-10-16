import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router';
import { cn } from '@/lib/utils';
import { Wordmark } from './Logo';
import { ThemeToggle } from './ThemeToggle';
import { LinkButton } from './Button';
import { IconMenu, IconX } from './Icons';
import { Container } from './Section';

const landingLinks = [
  { href: '#why', label: 'Why' },
  { href: '#how-it-works', label: 'How it works' },
  { href: '#profiles', label: 'Profiles' },
  { href: '#safety', label: 'Safety' },
  { href: '#faq', label: 'FAQ' },
];

export function SiteHeader({ variant = 'landing', onOpenSearch }: { variant?: 'landing' | 'docs'; onOpenSearch?: () => void }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const onHome = location.pathname === '/';

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-[background-color,border-color,box-shadow] duration-base',
        scrolled || variant === 'docs' ? 'border-border bg-bg/85 backdrop-blur-md supports-[backdrop-filter]:bg-bg/75' : 'border-transparent bg-transparent',
      )}
    >
      <Container size={variant === 'docs' ? 'wide' : 'page'} className="flex h-16 items-center justify-between gap-6">
        <div className="flex items-center gap-8">
          <Link to="/" className="rounded-sm" aria-label="VZ Skills home">
            <Wordmark />
          </Link>
          {variant === 'landing' && (
            <nav aria-label="Page sections" className="hidden items-center gap-1 lg:flex">
              {landingLinks.map((l) => (
                <a
                  key={l.href}
                  href={onHome ? l.href : `/${l.href}`}
                  className="rounded-md px-3 py-1.5 text-sm text-fg-muted transition-colors duration-fast hover:bg-bg-sunken hover:text-fg"
                >
                  {l.label}
                </a>
              ))}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <NavLink
            to="/docs"
            className={({ isActive }) =>
              cn(
                'hidden rounded-md px-3 py-1.5 text-sm transition-colors duration-fast hover:bg-bg-sunken hover:text-fg sm:inline-flex',
                isActive ? 'text-fg font-medium' : 'text-fg-muted',
              )
            }
          >
            Docs
          </NavLink>
          {variant === 'docs' && onOpenSearch && (
            <button
              type="button"
              onClick={onOpenSearch}
              className="hidden h-9 items-center gap-2 rounded-md border border-border bg-bg-raised px-3 text-sm text-fg-muted transition-colors duration-fast hover:border-border-strong hover:text-fg md:inline-flex"
            >
              <span>Search docs</span>
              <kbd className="rounded-xs border border-border bg-bg-sunken px-1.5 py-px font-mono text-[0.6875rem] text-fg-faint">Ctrl K</kbd>
            </button>
          )}
          <ThemeToggle />
          <LinkButton to={onHome ? '#install' : '/docs/getting-started'} size="sm" className="hidden sm:inline-flex">
            Install
          </LinkButton>
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted hover:bg-bg-sunken hover:text-fg lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <IconX size={20} /> : <IconMenu size={20} />}
          </button>
        </div>
      </Container>

      {/* Mobile navigation */}
      <div
        id="mobile-nav"
        hidden={!open}
        className="absolute inset-x-0 top-16 z-40 max-h-[calc(100dvh-4rem)] overflow-y-auto border-b border-border bg-bg shadow-lg lg:hidden motion-safe:animate-fade-in"
      >
        <Container className="flex flex-col gap-1 py-4">
          {variant === 'landing' &&
            landingLinks.map((l) => (
              <a key={l.href} href={onHome ? l.href : `/${l.href}`} onClick={() => setOpen(false)} className="rounded-md px-3 py-2.5 text-base text-fg hover:bg-bg-sunken">
                {l.label}
              </a>
            ))}
          <Link to="/docs" className="rounded-md px-3 py-2.5 text-base text-fg hover:bg-bg-sunken">
            Documentation
          </Link>
          <Link to="/docs/getting-started" className="rounded-md px-3 py-2.5 text-base text-fg hover:bg-bg-sunken">
            Getting started
          </Link>
          <Link to="/docs/commands" className="rounded-md px-3 py-2.5 text-base text-fg hover:bg-bg-sunken">
            Command reference
          </Link>
          {variant === 'docs' && onOpenSearch && (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onOpenSearch();
              }}
              className="rounded-md px-3 py-2.5 text-left text-base text-fg hover:bg-bg-sunken"
            >
              Search docs
            </button>
          )}
          <div className="mt-2 border-t border-border pt-4">
            <LinkButton to={onHome ? '#install' : '/docs/getting-started'} className="w-full">
              Install VZ Skills
            </LinkButton>
          </div>
        </Container>
      </div>
    </header>
  );
}
