import { Link } from 'react-router';
import { Container, Section, SectionHeading } from '@/components/Section';
import { Tabs } from '@/components/Tabs';
import { CodeBlock, CommandLine } from '@/components/CodeBlock';
import { Callout } from '@/components/Callout';
import { IconArrowRight } from '@/components/Icons';
import { SITE } from '@/lib/utils';

const methods = [
  {
    id: 'flat',
    label: 'Unprefixed (recommended)',
    command: 'npx vz-skills install --flat',
    looks: '/plan, /discover, /review, /vz-status',
    body:
      'Places the skills, agents, hooks, and scripts into your Claude config, where command names are not prefixed. The only rename is /status, which becomes /vz-status so Claude Code’s own /status keeps working.',
  },
  {
    id: 'plugin',
    label: 'Plugin',
    command: 'npx vz-skills install',
    looks: '/vz-skills:plan, /vz-skills:discover, …',
    body:
      'Copies the plugin to ~/.vz-skills/marketplace, registers it as a Claude Code marketplace, and installs it as one unit. Claude Code prefixes every plugin’s commands with the plugin name.',
  },
  {
    id: 'try',
    label: 'Try it',
    command: 'npx vz-skills try',
    looks: '/vz-skills:… for one session',
    body: 'Starts Claude Code with --plugin-dir pointing at the bundled plugin. Nothing is written to your settings.',
  },
];

export function Install() {
  return (
    <Section id="install">
      <Container>
        <div className="grid gap-12 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] lg:gap-16">
          <div>
            <SectionHeading
              number="07"
              eyebrow="Install"
              title="From zero to a status check in two commands."
              lead={
                <>
                  Requires Claude Code {SITE.minClaude}+ ({SITE.recommendedClaude}+ recommended) and Node.js {SITE.minNode}+. Nothing else is
                  downloaded or installed. Add <code className="font-mono text-fg">--scope project</code> to install into the repository's{' '}
                  <code className="font-mono text-fg">.claude/</code> for your team, or <code className="font-mono text-fg">--scope local</code> for
                  yourself in one repository.
                </>
              }
            />
            <ol className="mt-10 space-y-5">
              {[
                { t: 'Install', d: 'Pick a form on the right. Restart Claude Code or run /reload-plugins.' },
                { t: 'Check', d: 'Run /vz-status for the effective profile, hook status, and a repository brief. Read-only.' },
                { t: 'Configure (optional)', d: 'Run /setup BALANCED to create .vz-skills/config.json. Commit it to share the profile with your team.' },
                { t: 'Work', d: 'Describe a change. The router picks the steps; or call /discover, /plan, /review directly.' },
              ].map((s, i) => (
                <li key={s.t} className="grid grid-cols-[2rem_minmax(0,1fr)] gap-4">
                  <span className="tabular font-mono text-sm text-fg-faint">0{i + 1}</span>
                  <div>
                    <p className="font-medium text-fg">{s.t}</p>
                    <p className="mt-1 text-sm leading-relaxed text-fg-muted">{s.d}</p>
                  </div>
                </li>
              ))}
            </ol>
            <Link to="/docs/installation" className="mt-8 inline-flex items-center gap-1.5 text-sm font-medium text-accent hover:underline underline-offset-4">
              Scopes, update, rollback, uninstall <IconArrowRight size={14} />
            </Link>
          </div>

          <div className="panel p-5 sm:p-6 lg:mt-16">
            <Tabs
              aria-label="Install method"
              tabs={methods.map((m) => ({
                id: m.id,
                label: m.label,
                content: (
                  <div className="pt-5">
                    <CommandLine command={m.command} />
                    <dl className="mt-4 grid grid-cols-[auto_minmax(0,1fr)] gap-x-4 gap-y-2 text-sm">
                      <dt className="text-fg-faint">Commands look like</dt>
                      <dd className="font-mono text-fg">{m.looks}</dd>
                    </dl>
                    <p className="mt-4 text-sm leading-relaxed text-fg-muted [text-wrap:pretty]">{m.body}</p>
                  </div>
                ),
              }))}
            />
            <div className="mt-8">
              <p className="eyebrow mb-3">Then, inside Claude Code</p>
              <CodeBlock
                language="text"
                title="claude"
                code={`/vz-status      # profile, repository brief, hook status
/discover       # stack, commands, tests, git state, with evidence labels
"add rate limiting to the login endpoint"   # clarify -> plan -> implement -> test -> review -> verify`}
              />
            </div>
            <Callout kind="note" title="Not yet on the npm registry" className="mt-6">
              The <code>vz-skills</code> package has not been published yet. Until it is, the same commands work from a packed tarball:
              run <code>npm pack</code> in a clone, then <code>npx --yes ./vz-skills-0.1.0.tgz install --flat</code>. You can also
              load the plugin straight from the clone with <code>claude --plugin-dir ./plugins/vz-skills</code>.
            </Callout>
          </div>
        </div>
      </Container>
    </Section>
  );
}
