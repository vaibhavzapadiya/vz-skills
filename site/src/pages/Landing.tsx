import { useEffect } from 'react';
import { SiteHeader } from '@/components/SiteHeader';
import { SiteFooter } from '@/components/SiteFooter';
import { Hero } from './landing/Hero';
import { Why } from './landing/Why';
import { HowItWorks } from './landing/HowItWorks';
import { Profiles } from './landing/Profiles';
import { Safety } from './landing/Safety';
import { Install } from './landing/Install';
import { Faq } from './landing/Faq';

export function Landing() {
  useEffect(() => {
    document.title = 'VZ Skills — a disciplined development lifecycle for Claude Code';
  }, []);

  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader variant="landing" />
      <main id="main" className="flex-1">
        <Hero />
        <Why />
        <HowItWorks />
        <Profiles />
        <Safety />
        <Install />
        <Faq />
      </main>
      <SiteFooter />
    </div>
  );
}
