import { useState } from 'react';
import { Link } from 'react-router';
import { Container, Section, SectionHeading } from '@/components/Section';
import { Tabs } from '@/components/Tabs';
import { CodeBlock } from '@/components/CodeBlock';
import { IconArrowRight } from '@/components/Icons';
import { cn } from '@/lib/utils';
import { profileBlurbs, profileHighlights, profileNames, type ProfileName } from '@/data/profiles';

export function Profiles() {
  const [profile, setProfile] = useState<ProfileName>('BALANCED');
  const blurb = profileBlurbs[profile];
  const config = `{
  "version": 1,
  "profile": "${profile}"
}`;

  return (
    <Section id="profiles" bleed>
      <Container>
        <SectionHeading
          number="04"
          eyebrow="Profiles"
          title="One setting scales the rigor."
          lead="FAST, BALANCED, or PRODUCTION. Each preset sets concrete keys that the skills branch on; the differences are asserted by tests, not described with adjectives. Touching auth, payments, migrations, infrastructure, or secrets is always treated as high risk, whatever the profile."
        />

        <div className="mt-12 grid gap-8 lg:grid-cols-[1fr_minmax(0,20rem)] lg:gap-12">
          <div>
            <Tabs
              aria-label="Profile"
              variant="segmented"
              value={profile}
              onChange={(id) => setProfile(id as ProfileName)}
              tabs={profileNames.map((p) => ({ id: p, label: p, content: null }))}
            />
            <div className="mt-6 panel overflow-hidden">
              <table className="w-full text-sm">
                <caption className="sr-only">Profile comparison</caption>
                <thead>
                  <tr className="border-b border-border bg-bg-sunken text-left">
                    <th scope="col" className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.04em] text-fg-muted">
                      Setting
                    </th>
                    {profileNames.map((p) => (
                      <th
                        key={p}
                        scope="col"
                        aria-current={p === profile ? 'true' : undefined}
                        className={cn(
                          'px-4 py-3 font-mono text-xs font-medium tracking-[0.04em] transition-colors duration-fast',
                          p === profile ? 'text-fg' : 'text-fg-faint',
                          p !== profile && 'hidden md:table-cell',
                        )}
                      >
                        {p}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {profileHighlights.map((row) => (
                    <tr key={row.label} className="border-b border-border last:border-0">
                      <th scope="row" className="px-4 py-3 text-left font-normal text-fg">
                        {row.label}
                      </th>
                      {profileNames.map((p) => (
                        <td
                          key={p}
                          className={cn(
                            'px-4 py-3 transition-colors duration-fast',
                            p === profile ? 'font-medium text-fg bg-accent-soft/40' : 'text-fg-faint',
                            p !== profile && 'hidden md:table-cell',
                          )}
                        >
                          {row[p]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="space-y-5">
            <div className="panel p-5">
              <p className="eyebrow">{blurb.title}</p>
              <p className="mt-3 text-[0.9375rem] leading-relaxed text-fg-muted [text-wrap:pretty]">{blurb.when}</p>
            </div>
            <CodeBlock code={config} language="json" title=".vz-skills/config.json" />
            <p className="text-sm leading-relaxed text-fg-muted">
              Create it with <code className="font-mono text-fg">/setup {profile}</code>. Fifteen more keys tune planning, testing, review,
              security, documentation, hooks, agents and approvals; unknown keys and bad values are errors with a suggested fix, never
              silent.
            </p>
            <Link to="/docs/configuration" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-4">
              Every key, default and allowed value <IconArrowRight size={14} />
            </Link>
          </div>
        </div>
      </Container>
    </Section>
  );
}
