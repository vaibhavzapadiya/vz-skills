import { Suspense, useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { MDXProvider } from '@mdx-js/react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { DocsSidebar } from '@/components/DocsSidebar';
import { SearchDialog } from '@/components/SearchDialog';
import { Toc } from '@/components/Toc';
import { Container } from '@/components/Section';
import { IconArrowRight, IconChevronRight, IconX } from '@/components/Icons';
import { docPath, findDoc, groupOf, neighbours } from '@/docs/registry';
import { mdxComponents } from '@/docs/mdxComponents';
import NotFound from './NotFound';

export default function DocsLayout() {
  const { pathname } = useLocation();
  const slug = pathname.replace(/^\/docs\/?/, '').replace(/\/$/, '');
  const page = findDoc(slug);
  const [searchOpen, setSearchOpen] = useState(false);
  const [navOpen, setNavOpen] = useState(false);

  const openSearch = useCallback(() => setSearchOpen(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((v) => !v);
      } else if (e.key === '/' && !(e.target instanceof HTMLElement && /^(input|textarea|select)$/i.test(e.target.tagName)) && !(e.target instanceof HTMLElement && e.target.isContentEditable)) {
        e.preventDefault();
        setSearchOpen(true);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    setNavOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (page) document.title = `${page.title} · VZ Skills docs`;
  }, [page]);

  if (!page) return <NotFound />;

  const group = groupOf(slug);
  const { prev, next } = neighbours(slug);
  const Body = page.component;

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader variant="docs" onOpenSearch={openSearch} />
      <Container size="wide" className="flex-1">
        <div className="lg:grid lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-10 xl:grid-cols-[15rem_minmax(0,1fr)_14rem] xl:gap-14">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block">
            <div className="sticky top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto py-8 pr-2">
              <DocsSidebar />
            </div>
          </aside>

          {/* Mobile section switcher */}
          <div className="sticky top-16 z-30 -mx-4 border-b border-border bg-bg/90 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:hidden">
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setNavOpen(true)}
                aria-haspopup="dialog"
                className="inline-flex h-9 items-center gap-2 rounded-md border border-border bg-bg-raised px-3 text-sm text-fg"
              >
                <span className="text-fg-faint">Docs</span>
                <IconChevronRight size={14} className="text-fg-faint" />
                <span className="font-medium">{page.title}</span>
              </button>
              <button
                type="button"
                onClick={openSearch}
                className="inline-flex h-9 items-center rounded-md border border-border bg-bg-raised px-3 text-sm text-fg-muted"
              >
                Search
              </button>
            </div>
          </div>

          {navOpen && (
            <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Documentation navigation">
              <div className="absolute inset-0 bg-bg-inverse/40 motion-safe:animate-fade-in" onClick={() => setNavOpen(false)} aria-hidden="true" />
              <div className="absolute inset-y-0 left-0 w-[min(20rem,88vw)] overflow-y-auto border-r border-border bg-bg p-5 shadow-lg motion-safe:animate-fade-in">
                <div className="mb-4 flex items-center justify-between">
                  <span className="font-medium">Documentation</span>
                  <button type="button" onClick={() => setNavOpen(false)} aria-label="Close navigation" className="inline-flex h-9 w-9 items-center justify-center rounded-md text-fg-muted hover:bg-bg-sunken">
                    <IconX size={18} />
                  </button>
                </div>
                <DocsSidebar onNavigate={() => setNavOpen(false)} />
              </div>
            </div>
          )}

          {/* Article */}
          <main id="main" className="min-w-0 py-10 lg:py-12">
            <nav aria-label="Breadcrumb" className="mb-6 text-sm text-fg-muted">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link to="/docs" className="hover:text-fg">
                    Docs
                  </Link>
                </li>
                {group && slug !== '' && (
                  <>
                    <li aria-hidden="true">
                      <IconChevronRight size={12} className="text-fg-faint" />
                    </li>
                    <li>{group.title}</li>
                  </>
                )}
                <li aria-hidden="true">
                  <IconChevronRight size={12} className="text-fg-faint" />
                </li>
                <li aria-current="page" className="text-fg">
                  {page.title}
                </li>
              </ol>
            </nav>

            <article id="doc-article" className="max-w-prose">
              <header className="mb-6">
                <h1 className="font-display text-title text-fg [text-wrap:balance]">{page.title}</h1>
              </header>
              <div className="prose" key={slug}>
                <MDXProvider components={mdxComponents}>
                  <Suspense fallback={<p className="text-fg-faint" role="status">Loading…</p>}>
                    <Body />
                  </Suspense>
                </MDXProvider>
              </div>

              <nav aria-label="Previous and next pages" className="mt-16 grid gap-4 border-t border-border pt-8 sm:grid-cols-2">
                {prev ? (
                  <Link to={docPath(prev.slug)} className="group rounded-lg border border-border bg-bg-raised p-4 transition-colors duration-fast hover:border-border-strong">
                    <span className="eyebrow">Previous</span>
                    <span className="mt-1 block font-medium text-fg group-hover:text-accent">{prev.title}</span>
                  </Link>
                ) : (
                  <span />
                )}
                {next && (
                  <Link to={docPath(next.slug)} className="group rounded-lg border border-border bg-bg-raised p-4 text-right transition-colors duration-fast hover:border-border-strong sm:col-start-2">
                    <span className="eyebrow">Next</span>
                    <span className="mt-1 flex items-center justify-end gap-1.5 font-medium text-fg group-hover:text-accent">
                      {next.title} <IconArrowRight size={14} />
                    </span>
                  </Link>
                )}
              </nav>
            </article>
          </main>

          {/* Table of contents (xl) */}
          <aside className="hidden xl:block">
            <div className="sticky top-16 max-h-[calc(100dvh-4rem)] overflow-y-auto py-12 pl-1">
              <Toc containerId="doc-article" deps={slug} />
            </div>
          </aside>
        </div>
      </Container>
      <SiteFooter />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}
