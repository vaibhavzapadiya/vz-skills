import { useEffect } from 'react';
import { SITE } from '@/lib/utils';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Reveal } from '@/components/Reveal';
import { Hero } from './landing/Hero';
import { Why } from './landing/Why';
import { Proof } from './landing/Proof';
import { HowItWorks } from './landing/HowItWorks';
import { SkillsExplorer } from './landing/SkillsExplorer';
import { DashboardPreview } from './landing/DashboardPreview';
import { Profiles } from './landing/Profiles';
import { Safety } from './landing/Safety';
import { Install } from './landing/Install';
import { Faq } from './landing/Faq';

export function Landing() {
  useEffect(() => {
    document.title = SITE.title;
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader variant="landing" />
      <main id="main" className="flex-1">
        <Hero />
        <Reveal>
          <Why />
        </Reveal>
        <Reveal>
          <Proof />
        </Reveal>
        <Reveal>
          <HowItWorks />
        </Reveal>
        <Reveal>
          <SkillsExplorer />
        </Reveal>
        <Reveal>
          <DashboardPreview />
        </Reveal>
        <Reveal>
          <Profiles />
        </Reveal>
        <Reveal>
          <Safety />
        </Reveal>
        <Reveal>
          <Install />
        </Reveal>
        <Reveal>
          <Faq />
        </Reveal>
      </main>
      <SiteFooter />
    </div>
  );
}
