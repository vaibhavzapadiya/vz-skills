import { Link } from 'react-router';
import { Container, Section, SectionHeading } from '@/components/Section';
import { Tabs } from '@/components/Tabs';
import { IconArrowRight } from '@/components/Icons';
import { skills, skillGroups } from '@/data/skills';
import { SITE } from '@/lib/utils';

/** Every skill, grouped as in the plugin's folders. Read from the site's skill data, so it never drifts. */
const GROUP_LABEL: Record<string, string> = { entry: 'Start here', lifecycle: 'Lifecycle', specialists: 'Specialists', productivity: 'Around the work' };

function SkillGrid({ group }: { group: string }) {
  const meta = skillGroups.find((g) => g.id === group);
  const list = skills.filter((s) => s.group === group);
  return (
    <div className="pt-6">
      {meta && <p className="max-w-[46rem] text-[0.9375rem] leading-relaxed text-fg-muted [text-wrap:pretty]">{meta.blurb}</p>}
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((s) => (
          <li key={s.name} className="panel panel-hover flex flex-col p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <code className="font-mono text-[0.9375rem] font-medium text-fg">{s.command}</code>
              <span className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-fg-faint">{s.runs === 'you' ? 'you run it' : 'auto'}</span>
            </div>
            {s.args && <code className="mt-1 truncate font-mono text-xs text-fg-faint">{s.args}</code>}
            <p className="mt-2.5 text-sm leading-relaxed text-fg-muted [text-wrap:pretty]">{s.summary}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function SkillsExplorer() {
  const tabs = skillGroups.map((g) => ({
    id: g.id,
    label: (
      <span className="inline-flex items-center gap-2">
        {GROUP_LABEL[g.id] ?? g.title}
        <span className="tabular rounded-full bg-bg-sunken px-1.5 text-[0.6875rem] text-fg-faint">{skills.filter((s) => s.group === g.id).length}</span>
      </span>
    ),
    content: <SkillGrid group={g.id} />,
  }));
  return (
    <Section id="skills" bleed>
      <Container>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHeading
            number="04"
            eyebrow="Skills"
            title={`${SITE.counts.skills} skills, one per job.`}
            lead="Slash commands Claude can also pick on its own when a request matches. Shown with their short names; the plugin install prefixes them with vz-skills:."
          />
          <Link to="/docs/commands" className="inline-flex items-center gap-1.5 text-sm font-medium text-accent underline-offset-4 hover:underline">
            Full command reference <IconArrowRight size={14} />
          </Link>
        </div>
        <Tabs className="mt-10" listClassName="max-w-full flex-wrap" tabs={tabs} defaultTab="lifecycle" variant="segmented" aria-label="Skill groups" />
      </Container>
    </Section>
  );
}
