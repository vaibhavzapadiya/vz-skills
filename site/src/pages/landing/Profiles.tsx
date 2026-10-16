import { Link } from 'react-router';
import { Container, Section, SectionHeading } from '@/components/Section';
import { IconArrowRight } from '@/components/Icons';
import { profileHighlights, profileNames } from '@/data/profiles';

const shown = ['Write a plan when risk is', 'Tests to run', 'Independent reviewer agent', 'Final report'];
const rows = profileHighlights.filter((r) => shown.includes(r.label));

export function Profiles() {
  return (
    <Section id="profiles">
      <Container>
        <SectionHeading
          number="03"
          eyebrow="Profiles"
          title="One setting scales the rigor."
          lead="Pick FAST, BALANCED or PRODUCTION per repository. Auth, payments, migrations and secrets are always treated as high risk."
        />
        <div className="panel mt-12 overflow-x-auto">
          <table className="w-full min-w-[34rem] text-sm">
            <caption className="sr-only">Profile comparison</caption>
            <thead>
              <tr className="border-b border-border bg-bg-sunken/70 text-left">
                <th scope="col" className="px-5 py-3.5 text-xs font-semibold uppercase tracking-[0.04em] text-fg-muted">
                  Setting
                </th>
                {profileNames.map((p) => (
                  <th key={p} scope="col" className="px-5 py-3.5 font-mono text-xs font-medium tracking-[0.04em] text-fg">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label} className="border-b border-border last:border-0">
                  <th scope="row" className="px-5 py-4 text-left font-normal text-fg">
                    {row.label}
                  </th>
                  {profileNames.map((p) => (
                    <td key={p} className="px-5 py-4 text-fg-muted">
                      {row[p]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <Link to="/docs/configuration" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-4">
          Every setting <IconArrowRight size={14} />
        </Link>
      </Container>
    </Section>
  );
}
