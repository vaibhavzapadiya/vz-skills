import { Link } from 'react-router';
import { Container } from '@/components/Section';
import { LinkButton } from '@/components/Button';
import { CommandLine } from '@/components/CodeBlock';
import { IconArrowRight } from '@/components/Icons';
import { SITE } from '@/lib/utils';
import { ReportCard } from './ReportCard';

/** A hand-drawn style underline that draws itself once (CSS, see .draw-underline). */
function Underline() {
  return (
    <svg
      viewBox="0 0 300 14"
      preserveAspectRatio="none"
      aria-hidden="true"
      focusable="false"
      className="draw-underline pointer-events-none absolute -bottom-1 left-0 h-[0.28em] w-full overflow-visible text-accent"
    >
      <path d="M3 9 C 60 2, 120 12, 180 5 S 270 6, 297 4" pathLength={1} fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" />
    </svg>
  );
}

export function Hero() {
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden="true" className="hero-wash pointer-events-none absolute inset-x-0 top-0 h-[46rem]" />
      <div aria-hidden="true" className="rule-grid pointer-events-none absolute inset-x-0 top-0 h-[42rem]" />
      <Container className="relative pt-14 pb-20 sm:pt-20 lg:pt-24 lg:pb-28">
        <div className="grid items-start gap-14 lg:grid-cols-[minmax(0,28rem)_minmax(0,1fr)] lg:gap-16">
          <div className="motion-safe:animate-fade-up">
            <Link
              to="/docs/commands"
              className="group inline-flex items-center gap-2.5 rounded-full border border-border bg-bg-raised/80 py-1 pl-2.5 pr-3 text-xs text-fg-muted shadow-sm backdrop-blur transition-colors duration-fast hover:border-border-strong hover:text-fg"
            >
              <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-ok" />
              <span className="font-mono tracking-[0.02em]">
                {SITE.counts.skills} skills · {SITE.counts.agents} agents · {SITE.counts.hooks} hooks
              </span>
              <IconArrowRight size={12} className="transition-transform duration-fast group-hover:translate-x-0.5" />
            </Link>

            <h1 className="font-display mt-7 text-display text-fg [text-wrap:balance]">
              Evidence <span className="relative inline-block italic">before claims.<Underline /></span>
            </h1>
            <p className="mt-6 max-w-[30rem] text-lg leading-relaxed text-fg-muted [text-wrap:pretty]">
              A disciplined lifecycle for Claude Code: discover, plan, build, test, review, and a final report that says exactly what was
              verified.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <LinkButton to="/docs/getting-started" size="lg">
                Get started
                <IconArrowRight size={16} />
              </LinkButton>
              <LinkButton to="/docs" size="lg" variant="secondary">
                Read the docs
              </LinkButton>
            </div>
            <div className="mt-8 max-w-[26rem]">
              <CommandLine command={SITE.install} />
              <p className="mt-3 text-[0.8125rem] text-fg-faint">
                Needs Claude Code {SITE.minClaude}+ and Node.js {SITE.minNode}+.
              </p>
            </div>
          </div>

          <div className="motion-safe:animate-fade-up [animation-delay:120ms]">
            <ReportCard />
          </div>
        </div>
      </Container>
    </section>
  );
}
