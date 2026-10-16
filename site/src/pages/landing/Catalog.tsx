import { Link } from 'react-router';
import { Container, Section, SectionHeading } from '@/components/Section';
import { Chip } from '@/components/Label';
import { IconArrowRight } from '@/components/Icons';
import { agents, hooks, runsLabel, skillGroups, skills } from '@/data/skills';
import { SITE } from '@/lib/utils';

export function Catalog() {
  return (
    <Section id="skills" bleed>
      <Container>
        <SectionHeading
          number="06"
          eyebrow="What ships"
          title={
            <>
              {SITE.counts.skills} skills, {SITE.counts.agents} agents, {SITE.counts.hooks} hooks.
            </>
          }
          lead="Every skill is a slash command. The commands below are the flat-install form; with the plugin install, prefix them with vz-skills:. “Auto” means Claude can also pick the skill when a request matches its description; “You” means only you can run it."
        />

        <div className="mt-12 space-y-12">
          {skillGroups.map((g) => (
            <div key={g.id} className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-12">
              <div>
                <h3 className="text-lg font-semibold text-fg">{g.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-fg-muted">{g.blurb}</p>
              </div>
              <ul className="panel divide-y divide-border overflow-hidden">
                {skills
                  .filter((s) => s.group === g.id)
                  .map((s) => (
                    <li key={s.name} className="grid gap-x-6 gap-y-1.5 px-4 py-3.5 sm:grid-cols-[11rem_minmax(0,1fr)_auto] sm:items-baseline">
                      <Link to={`/docs/commands#${s.name}`} className="font-mono text-sm text-fg hover:text-accent">
                        {s.command}
                      </Link>
                      <p className="text-sm leading-relaxed text-fg-muted">{s.summary}</p>
                      <Chip className="justify-self-start sm:justify-self-end">{runsLabel[s.runs]}</Chip>
                    </li>
                  ))}
              </ul>
            </div>
          ))}

          <div className="grid gap-6 lg:grid-cols-[minmax(0,16rem)_minmax(0,1fr)] lg:gap-12">
            <div>
              <h3 className="text-lg font-semibold text-fg">Agents and hooks</h3>
              <p className="mt-2 text-sm leading-relaxed text-fg-muted">
                Agents are read-only (Read, Glob, Grep) and exist only because fresh context gives an independent view. Hooks run on
                every matching tool call, whether or not a VZ skill is in use.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <ul className="panel divide-y divide-border overflow-hidden">
                {agents.map((a) => (
                  <li key={a.name} className="px-4 py-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="font-mono text-sm text-fg">{a.name}</span>
                      <Chip>agent · {a.model}</Chip>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{a.purpose}</p>
                  </li>
                ))}
              </ul>
              <ul className="panel divide-y divide-border overflow-hidden">
                {hooks.map((h) => (
                  <li key={h.script} className="px-4 py-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-sm font-medium text-fg">{h.name}</span>
                      <Chip>
                        {h.event} · {h.timeout}
                      </Chip>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-fg-muted">{h.does}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        <div className="mt-10 flex flex-wrap gap-6">
          <Link to="/docs/commands" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-4">
            Full command reference <IconArrowRight size={14} />
          </Link>
          <Link to="/docs/agents" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-4">
            Agents <IconArrowRight size={14} />
          </Link>
          <Link to="/docs/guards" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-4">
            Hooks and guards <IconArrowRight size={14} />
          </Link>
        </div>
      </Container>
    </Section>
  );
}
