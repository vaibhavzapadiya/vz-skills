import { Chip } from '@/components/Label';
import { agents, hooks, runsLabel, skillGroups, skills } from '@/data/skills';
import { Heading } from './mdxComponents';

/** Renders the command reference from the same data the landing page uses. */
export function CommandReference() {
  return (
    <>
      {skillGroups.map((g) => (
        <section key={g.id}>
          <Heading level={2}>{g.title}</Heading>
          <p>{g.blurb}</p>
          {skills
            .filter((s) => s.group === g.id)
            .map((s) => (
              <div key={s.name}>
                <Heading level={3}>{s.name}</Heading>
                <p className="!mt-1 flex flex-wrap items-center gap-2 !mb-3">
                  <code>
                    {s.command}
                    {s.args ? ` ${s.args}` : ''}
                  </code>
                  <Chip>{runsLabel[s.runs]}</Chip>
                  {typeof s.step === 'number' && <Chip>pipeline step {s.step}</Chip>}
                </p>
                <p>{s.description}</p>
                <p className="!mt-2 text-sm text-fg-muted">
                  Plugin form: <code>/vz-skills:{s.name}</code>
                </p>
              </div>
            ))}
        </section>
      ))}

      <Heading level={2}>Agents</Heading>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Agent</th>
              <th>Model</th>
              <th>Tools</th>
              <th>Used by</th>
            </tr>
          </thead>
          <tbody>
            {agents.map((a) => (
              <tr key={a.name}>
                <td>
                  <code>{a.name}</code>
                </td>
                <td>{a.model}</td>
                <td>{a.tools}</td>
                <td>{a.usedBy}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Heading level={2}>Hooks</Heading>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Matcher</th>
              <th>Script</th>
              <th>Timeout</th>
            </tr>
          </thead>
          <tbody>
            {hooks.map((h) => (
              <tr key={h.script}>
                <td>
                  <code>{h.event}</code>
                </td>
                <td>
                  <code>{h.matcher}</code>
                </td>
                <td>
                  <code>scripts/hooks/{h.script}</code>
                </td>
                <td>{h.timeout}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
