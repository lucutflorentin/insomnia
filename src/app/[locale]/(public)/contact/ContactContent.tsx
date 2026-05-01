'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import SlideUp from '@/components/animations/SlideUp';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface ContactContentProps {
  locale: string;
  siteConfig: {
    email: string;
    phone: string;
    address: string;
    googleMapsUrl: string;
  };
  socialLinks: {
    instagram: string;
    tiktok: string;
    facebook: string;
  };
}

export default function ContactContent({
  locale,
  siteConfig,
  socialLinks,
}: ContactContentProps) {
  const content = locale === 'en' ? en : ro;
  const t = useTranslations('contact.form');
  const { showToast } = useToast();

  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const validateContact = (): boolean => {
    const next: Record<string, string> = {};
    const nameT = form.name.trim();
    const emailT = form.email.trim();
    const msgT = form.message.trim();

    if (nameT.length < 2) next.name = t('nameMin');
    if (!emailT) {
      next.email = t('emailRequired');
    } else if (!EMAIL_RE.test(emailT)) {
      next.email = t('emailInvalid');
    }
    if (!msgT) {
      next.message = t('messageRequired');
    } else if (msgT.length < 10) {
      next.message = t('messageMin');
    }

    setFieldErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateContact()) {
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          message: form.message.trim(),
        }),
      });
      if (res.ok) {
        setIsSuccess(true);
        setForm({ name: '', email: '', phone: '', message: '' });
        setFieldErrors({});
        showToast(t('success'), 'success');
      } else {
        const data = await res.json();
        showToast(data.error || t('error'), 'error');
      }
    } catch {
      showToast(t('error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-16">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SlideUp>
          <div className="mb-12 text-center">
            <h1 className="mb-4 text-3xl font-bold text-text-primary sm:text-4xl">
              {content.title}
            </h1>
            <p className="mx-auto max-w-2xl text-text-secondary">
              {content.subtitle}
            </p>
          </div>
        </SlideUp>

        <div className="grid gap-8 md:grid-cols-2">
          {/* Contact Info */}
          <div className="space-y-6">
            {/* Address */}
            <SlideUp delay={0.1}>
              <div className="rounded-lg border border-border bg-bg-secondary p-6">
                <h2 className="mb-3 text-lg font-semibold text-text-primary">
                  {content.addressLabel}
                </h2>
                <p className="text-text-secondary">{siteConfig.address}</p>
              </div>
            </SlideUp>

            {/* Hours */}
            <SlideUp delay={0.15}>
              <div className="rounded-lg border border-border bg-bg-secondary p-6">
                <h2 className="mb-3 text-lg font-semibold text-text-primary">
                  {content.hoursLabel}
                </h2>
                <div className="space-y-1 text-sm text-text-secondary">
                  {content.hours.map((line, index) => (
                    <div key={index} className="flex justify-between">
                      <span>{line.days}</span>
                      <span className="font-medium text-text-primary">
                        {line.time}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </SlideUp>

            {/* Email & Phone */}
            <SlideUp delay={0.2}>
              <div className="rounded-lg border border-border bg-bg-secondary p-6">
                <h2 className="mb-3 text-lg font-semibold text-text-primary">
                  {content.contactLabel}
                </h2>
                <div className="space-y-2 text-text-secondary">
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="block transition-colors hover:text-accent"
                  >
                    {siteConfig.email}
                  </a>
                  {siteConfig.phone && (
                    <a
                      href={`tel:${siteConfig.phone}`}
                      className="block transition-colors hover:text-accent"
                    >
                      {siteConfig.phone}
                    </a>
                  )}
                </div>
              </div>
            </SlideUp>

            {/* Social Links */}
            <SlideUp delay={0.25}>
              <div className="rounded-lg border border-border bg-bg-secondary p-6">
                <h2 className="mb-3 text-lg font-semibold text-text-primary">
                  {content.socialLabel}
                </h2>
                <div className="flex gap-4">
                  <a
                    href={socialLinks.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-secondary transition-colors hover:text-accent"
                    aria-label="Instagram"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                    </svg>
                  </a>
                  <a
                    href={socialLinks.tiktok}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-secondary transition-colors hover:text-accent"
                    aria-label="TikTok"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z" />
                    </svg>
                  </a>
                  <a
                    href={socialLinks.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-text-secondary transition-colors hover:text-accent"
                    aria-label="Facebook"
                  >
                    <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                    </svg>
                  </a>
                </div>
              </div>
            </SlideUp>
          </div>

          {/* Contact Form + Map */}
          <div className="space-y-6">
            {/* Contact Form */}
            <SlideUp delay={0.15}>
              <div className="rounded-lg border border-border bg-bg-secondary p-6">
                <h2 className="mb-4 text-lg font-semibold text-text-primary">
                  {content.cta.title}
                </h2>

                {isSuccess ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-success/10">
                      <svg className="h-7 w-7 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <p className="text-text-secondary">{t('success')}</p>
                    <button
                      onClick={() => setIsSuccess(false)}
                      className="mt-4 text-sm text-accent hover:underline"
                    >
                      {t('send')}
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                      label={t('name')}
                      value={form.name}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, name: e.target.value }));
                        setFieldErrors((e) => ({ ...e, name: '' }));
                      }}
                      required
                      error={fieldErrors.name}
                    />
                    <Input
                      label={t('email')}
                      type="email"
                      value={form.email}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, email: e.target.value }));
                        setFieldErrors((e) => ({ ...e, email: '' }));
                      }}
                      required
                      error={fieldErrors.email}
                    />
                    <Input
                      label={t('phone')}
                      type="tel"
                      value={form.phone}
                      onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                    />
                    <Textarea
                      label={t('message')}
                      placeholder={t('messagePlaceholder')}
                      value={form.message}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, message: e.target.value }));
                        setFieldErrors((e) => ({ ...e, message: '' }));
                      }}
                      rows={4}
                      required
                      error={fieldErrors.message}
                    />
                    <Button type="submit" isLoading={isSubmitting} className="w-full">
                      {isSubmitting ? t('sending') : t('send')}
                    </Button>
                  </form>
                )}
              </div>
            </SlideUp>

            {/* Map */}
            <SlideUp delay={0.25}>
              <div className="overflow-hidden rounded-lg border border-border bg-bg-secondary">
                <h2 className="p-6 pb-0 text-lg font-semibold text-text-primary">
                  {content.mapLabel}
                </h2>
                <div className="p-6">
                  {siteConfig.googleMapsUrl ? (
                    <iframe
                      src={siteConfig.googleMapsUrl}
                      width="100%"
                      height="250"
                      style={{ border: 0 }}
                      allowFullScreen
                      loading="lazy"
                      referrerPolicy="no-referrer-when-downgrade"
                      title={content.mapLabel}
                      className="rounded-md"
                    />
                  ) : (
                    <div className="flex h-[250px] items-center justify-center rounded-md bg-bg-primary text-text-secondary">
                      <p>{content.mapPlaceholder}</p>
                    </div>
                  )}
                </div>
              </div>
            </SlideUp>
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline content (will be replaced by translation keys later)
// ---------------------------------------------------------------------------

interface HoursLine {
  days: string;
  time: string;
}

interface ContactData {
  title: string;
  subtitle: string;
  addressLabel: string;
  hoursLabel: string;
  contactLabel: string;
  socialLabel: string;
  mapLabel: string;
  mapPlaceholder: string;
  hours: HoursLine[];
  cta: {
    title: string;
    description: string;
    button: string;
  };
}

const ro: ContactData = {
  title: 'Contact',
  subtitle:
    'Suntem aici sa raspundem intrebarilor tale. Scrie-ne sau viziteaza-ne la studio.',
  addressLabel: 'Adresa',
  hoursLabel: 'Program',
  contactLabel: 'Email & Telefon',
  socialLabel: 'Urmareste-ne',
  mapLabel: 'Unde ne gasesti',
  mapPlaceholder: 'Harta va fi disponibila in curand.',
  hours: [
    { days: 'Luni - Duminica', time: '12:00 - 20:00' },
    { days: 'Programari', time: 'Strict in intervalul afisat' },
  ],
  cta: {
    title: 'Vrei sa te programezi?',
    description:
      'Trimite-ne detaliile proiectului tau si te contactam noi.',
    button: 'Programeaza o consultatie',
  },
};

const en: ContactData = {
  title: 'Contact',
  subtitle:
    'We are here to answer your questions. Write to us or visit us at the studio.',
  addressLabel: 'Address',
  hoursLabel: 'Working Hours',
  contactLabel: 'Email & Phone',
  socialLabel: 'Follow Us',
  mapLabel: 'Find Us',
  mapPlaceholder: 'Map will be available soon.',
  hours: [
    { days: 'Monday - Sunday', time: '12:00 - 20:00' },
    { days: 'Appointments', time: 'Strictly within the displayed interval' },
  ],
  cta: {
    title: 'Want to book?',
    description:
      'Send us your project details and we will get back to you.',
    button: 'Book a consultation',
  },
};
