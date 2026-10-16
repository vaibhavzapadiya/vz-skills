import { useEffect } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Container } from '@/components/Section';
import { LinkButton } from '@/components/Button';
import { Label } from '@/components/Label';

export default function NotFound() {
  useEffect(() => {
    document.title = 'Page not found · VZ Skills';
  }, []);
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader variant="docs" />
      <main id="main" className="flex flex-1 items-center">
        <Container size="prose" className="py-24 text-center">
          <Label tone="danger">NOT FOUND</Label>
          <h1 className="font-display mt-6 text-title text-fg">This page does not exist.</h1>
          <p className="mt-4 text-fg-muted">Unknown is a valid answer; a guessed page is not. Try the documentation index instead.</p>
          <div className="mt-8 flex justify-center gap-3">
            <LinkButton to="/docs">Documentation</LinkButton>
            <LinkButton to="/" variant="secondary">
              Home
            </LinkButton>
          </div>
        </Container>
      </main>
      <SiteFooter />
    </div>
  );
}
