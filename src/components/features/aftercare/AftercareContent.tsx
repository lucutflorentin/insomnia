'use client';

import { useTranslations } from 'next-intl';
import SlideUp from '@/components/animations/SlideUp';
import StaggerChildren, { StaggerItem } from '@/components/animations/StaggerChildren';

function StepSection({
  title,
  steps,
  icon,
}: {
  title: string;
  steps: string[];
  icon: string;
}) {
  return (
    <SlideUp>
      <div className="rounded-sm border border-border bg-bg-secondary p-6 sm:p-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent text-lg">
            {icon}
          </div>
          <h2 className="font-heading text-xl font-semibold">{title}</h2>
        </div>
        <ul className="space-y-3">
          {steps.map((step, i) => (
            <li key={i} className="flex items-start gap-3 text-text-secondary">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent/60" />
              <span className="text-sm leading-relaxed">{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </SlideUp>
  );
}

function DosDonts({
  title,
  items,
  type,
}: {
  title: string;
  items: string[];
  type: 'do' | 'dont';
}) {
  return (
    <div className="rounded-sm border border-border bg-bg-secondary p-6">
      <h3 className="font-heading text-lg font-semibold mb-4 flex items-center gap-2">
        <span className={type === 'do' ? 'text-success' : 'text-error'}>
          {type === 'do' ? '✓' : '✗'}
        </span>
        {title}
      </h3>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
            <span className={`mt-1 text-xs ${type === 'do' ? 'text-success' : 'text-error'}`}>
              {type === 'do' ? '✓' : '✗'}
            </span>
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function AftercareContent() {
  const t = useTranslations('aftercare');

  // Parse array translations
  const first24hSteps = Array.from({ length: 5 }, (_, i) => t(`first24h.steps.${i}`));
  const firstWeekSteps = Array.from({ length: 5 }, (_, i) => t(`firstWeek.steps.${i}`));
  const firstMonthSteps = Array.from({ length: 5 }, (_, i) => t(`firstMonth.steps.${i}`));
  const dosItems = Array.from({ length: 5 }, (_, i) => t(`dos.items.${i}`));
  const dontsItems = Array.from({ length: 5 }, (_, i) => t(`donts.items.${i}`));

  return (
    <div className="pt-24">
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        {/* Header */}
        <SlideUp>
          <div className="text-center">
            <h1 className="font-heading text-4xl font-bold sm:text-5xl">
              {t('title')}
            </h1>
            <p className="mt-3 text-lg text-text-secondary">{t('subtitle')}</p>
            <div className="mx-auto mt-6 h-px w-16 bg-accent" />
          </div>
        </SlideUp>

        {/* Intro */}
        <SlideUp delay={0.1} className="mt-10">
          <p className="text-center text-text-secondary leading-relaxed">
            {t('intro')}
          </p>
        </SlideUp>

        {/* Steps */}
        <div className="mt-12 space-y-6">
          <StepSection title={t('first24h.title')} steps={first24hSteps} icon="1" />
          <StepSection title={t('firstWeek.title')} steps={firstWeekSteps} icon="7" />
          <StepSection title={t('firstMonth.title')} steps={firstMonthSteps} icon="30" />
        </div>

        {/* Do's and Don'ts */}
        <StaggerChildren staggerDelay={0.1} className="mt-12 grid gap-6 sm:grid-cols-2">
          <StaggerItem>
            <DosDonts title={t('dos.title')} items={dosItems} type="do" />
          </StaggerItem>
          <StaggerItem>
            <DosDonts title={t('donts.title')} items={dontsItems} type="dont" />
          </StaggerItem>
        </StaggerChildren>
      </div>

      <div className="h-24" />
    </div>
  );
}
