import { NavLink } from 'react-router';
import { docGroups, docPath } from '@/docs/registry';
import { cn } from '@/lib/utils';

export function DocsSidebar({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav aria-label="Documentation" className="space-y-7 text-sm">
      {docGroups.map((g) => (
        <div key={g.id}>
          <p className="eyebrow mb-2.5 px-3">{g.title}</p>
          <ul className="space-y-0.5">
            {g.pages.map((p) => (
              <li key={p.slug || 'index'}>
                <NavLink
                  to={docPath(p.slug)}
                  end
                  onClick={onNavigate}
                  className={({ isActive }) =>
                    cn(
                      'block rounded-md px-3 py-1.5 transition-colors duration-fast',
                      isActive ? 'bg-bg-sunken font-medium text-fg' : 'text-fg-muted hover:bg-bg-sunken/70 hover:text-fg',
                    )
                  }
                >
                  {p.title}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
