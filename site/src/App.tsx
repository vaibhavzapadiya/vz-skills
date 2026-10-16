import { Suspense, lazy, useEffect } from 'react';
import { Route, Routes, useLocation } from 'react-router';
import { Landing } from './pages/Landing';

const DocsLayout = lazy(() => import('./pages/DocsLayout'));
const NotFound = lazy(() => import('./pages/NotFound'));

/** Scroll to top on path change; honour hashes on load and change. */
function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const id = decodeURIComponent(hash.slice(1));
      // Lazy pages may not have rendered yet; retry briefly.
      let tries = 0;
      const tick = () => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ block: 'start' });
        else if (tries++ < 20) requestAnimationFrame(tick);
      };
      tick();
    } else {
      window.scrollTo({ top: 0 });
    }
  }, [pathname, hash]);
  return null;
}

function Fallback() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-fg-faint" role="status" aria-live="polite">
      Loading…
    </div>
  );
}

export default function App() {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <ScrollManager />
      <Suspense fallback={<Fallback />}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/docs/*" element={<DocsLayout />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}
