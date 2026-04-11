'use client';

import { useTranslations } from 'next-intl';
import SlideUp from '@/components/animations/SlideUp';
import StaggerChildren, {
  StaggerItem,
} from '@/components/animations/StaggerChildren';

const stats = [
  { key: 'experience', icon: '✦', value: '6+' },
  { key: 'location', icon: '◆', value: '★' },
  { key: 'consultation', icon: '◇', value: '∞' },
] as const;

export default function SocialProof() {
  const t = useTranslations('home.whyUs');

  return (
    <section className="py-24 sm:py-32">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <SlideUp>
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold sm:text-4xl">
              {t('title')}
            </h2>
            <div className="mx-auto mt-6 h-px w-16 bg-accent" />
          </div>
        </SlideUp>

        {/* USPs */}
        <StaggerChildren
          staggerDelay={0.15}
          className="mt-16 grid gap-8 md:grid-cols-3"
        >
          {stats.map((stat) => (
            <StaggerItem key={stat.key}>
              <div className="rounded-sm border border-border bg-bg-secondary p-8 text-center transition-all duration-300 hover:border-accent/30">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-2xl text-accent">
                  {stat.icon}
                </div>
                <h3 className="mt-5 font-heading text-xl font-semibold">
                  {t(stat.key)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-text-secondary">
                  {t(`${stat.key}Desc`)}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerChildren>

        {/* Google Rating */}
        <SlideUp delay={0.4}>
          <div className="mt-16 text-center">
            <div className="inline-flex items-center gap-3 rounded-full border border-accent/20 bg-accent/5 px-6 py-3">
              <div className="flex text-accent">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className="h-5 w-5"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="text-lg font-semibold text-text-primary">
                {t('rating')}
              </span>
            </div>
          </div>
        </SlideUp>
      </div>
    </section>
  );
}
