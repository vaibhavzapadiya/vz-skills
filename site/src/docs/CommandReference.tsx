import { skillGroups, skills } from '@/data/skills';
import { Heading } from './mdxComponents';

const runsText = { auto: 'Auto', you: 'You', 'auto-on-failure': 'Auto', 'auto-on-trigger': 'Auto' } as const;

/** One compact table per group, built from the same data the rest of the site uses. */
export function CommandReference() {
  return (
    <>
      {skillGroups.map((g) => (
        <section key={g.id}>
          <Heading level={2}>{g.title}</Heading>
          <p>{g.blurb}</p>
          <div className="table-wrap" tabIndex={0} role="region" aria-label={`${g.title} skills, scrollable`}>
            <table>
              <thead>
                <tr>
                  <th>Command</th>
                  <th>What it does</th>
                  <th>Runs</th>
                </tr>
              </thead>
              <tbody>
                {skills
                  .filter((s) => s.group === g.id)
                  .map((s) => (
                    <tr key={s.name} id={s.name}>
                      <td>
                        <code>{s.command}</code>
                        {s.args && <div className="mt-1 font-mono text-xs text-fg-faint">{s.args}</div>}
                      </td>
                      <td>{s.summary}</td>
                      <td>{runsText[s.runs]}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </section>
      ))}
    </>
  );
}
