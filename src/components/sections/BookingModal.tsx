'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from '@/i18n/navigation';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Textarea from '@/components/ui/Textarea';
import { cn } from '@/lib/utils';

interface ArtistOption {
  slug: string;
  name: string;
  specialtyRo: string | null;
  specialtyEn: string | null;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedArtist?: string | null;
  artists?: ArtistOption[];
}

export default function BookingModal({
  isOpen,
  onClose,
  preselectedArtist,
  artists: artistsProp,
}: BookingModalProps) {
  const t = useTranslations('bookingModal');
  const [selectedArtist, setSelectedArtist] = useState<string | null>(
    preselectedArtist || null,
  );
  const [formData, setFormData] = useState({
    description: '',
    name: '',
    phone: '',
    email: '',
    gdpr: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Reset when opening with preselected artist
  useEffect(() => {
    if (isOpen && preselectedArtist) {
      setSelectedArtist(preselectedArtist);
    }
  }, [isOpen, preselectedArtist]);

  // Lock body scroll
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEsc);
    return () => document.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!selectedArtist) newErrors.artist = 'required';
    if (!formData.name.trim()) newErrors.name = 'required';
    if (!formData.phone.trim()) newErrors.phone = 'required';
    if (!formData.email.trim()) newErrors.email = 'required';
    if (!formData.gdpr) newErrors.gdpr = 'required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          artistSlug: selectedArtist,
          description: formData.description,
          clientName: formData.name,
          clientPhone: formData.phone,
          clientEmail: formData.email,
          gdprConsent: formData.gdpr,
          source: 'quick_form',
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
      }
    } catch {
      // Error handling
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    onClose();
    // Reset after animation
    setTimeout(() => {
      setIsSuccess(false);
      setSelectedArtist(preselectedArtist || null);
      setFormData({ description: '', name: '', phone: '', email: '', gdpr: false });
      setErrors({});
    }, 300);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/85 backdrop-blur-md"
            onClick={handleClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="relative z-10 w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-sm border border-border bg-bg-primary shadow-2xl"
          >
            {/* Close button */}
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 z-10 text-text-muted transition-colors hover:text-text-primary"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            <div className="p-6 sm:p-8">
              {isSuccess ? (
                /* Success state */
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-8 text-center"
                >
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
                    <svg className="h-8 w-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium text-text-primary">
                    {t('success')}
                  </p>
                  <button
                    onClick={handleClose}
                    className="mt-6 text-sm text-accent hover:text-accent-light transition-colors"
                  >
                    OK
                  </button>
                </motion.div>
              ) : (
                /* Form */
                <form onSubmit={handleSubmit}>
                  {/* Title */}
                  <h2 className="font-heading text-2xl font-bold">
                    {t('title')}
                  </h2>
                  <div className="mt-1 h-px w-12 bg-accent" />

                  {/* Artist selection */}
                  <div className="mt-6">
                    <p className="mb-3 text-sm font-medium text-text-secondary">
                      {t('chooseArtist')}
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      {(artistsProp || []).map((artist) => (
                        <button
                          key={artist.slug}
                          type="button"
                          onClick={() => {
                            setSelectedArtist(artist.slug);
                            setErrors((prev) => ({ ...prev, artist: '' }));
                          }}
                          className={cn(
                            'rounded-sm border p-4 text-left transition-all duration-200',
                            selectedArtist === artist.slug
                              ? 'border-accent bg-accent/5'
                              : 'border-border bg-bg-secondary hover:border-accent/30',
                            errors.artist && 'border-error/50',
                          )}
                        >
                          <p className="font-medium text-text-primary">
                            {artist.name}
                          </p>
                          <p className="mt-0.5 text-xs text-text-muted">
                            {artist.specialtyRo || artist.specialtyEn}
                          </p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Description */}
                  <div className="mt-5">
                    <Textarea
                      label={t('whatsOnYourMind')}
                      placeholder={t('descriptionPlaceholder')}
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value })
                      }
                      className="min-h-[80px]"
                    />
                  </div>

                  {/* Contact info */}
                  <div className="mt-5">
                    <p className="mb-3 text-sm font-medium text-text-secondary">
                      {t('contactInfo')}
                    </p>
                    <div className="space-y-3">
                      <Input
                        placeholder={t('name')}
                        value={formData.name}
                        onChange={(e) => {
                          setFormData({ ...formData, name: e.target.value });
                          setErrors((prev) => ({ ...prev, name: '' }));
                        }}
                        error={errors.name ? t('name') : undefined}
                      />
                      <Input
                        placeholder={t('phone')}
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => {
                          setFormData({ ...formData, phone: e.target.value });
                          setErrors((prev) => ({ ...prev, phone: '' }));
                        }}
                        error={errors.phone ? t('phone') : undefined}
                      />
                      <Input
                        placeholder={t('email')}
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value });
                          setErrors((prev) => ({ ...prev, email: '' }));
                        }}
                        error={errors.email ? t('email') : undefined}
                      />
                    </div>
                  </div>

                  {/* GDPR */}
                  <label className="mt-4 flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.gdpr}
                      onChange={(e) => {
                        setFormData({ ...formData, gdpr: e.target.checked });
                        setErrors((prev) => ({ ...prev, gdpr: '' }));
                      }}
                      className="mt-1 h-4 w-4 rounded border-border bg-bg-secondary accent-accent"
                    />
                    <span
                      className={cn(
                        'text-xs leading-relaxed text-text-muted',
                        errors.gdpr && 'text-error',
                      )}
                    >
                      {t('gdpr')}
                    </span>
                  </label>

                  {/* Submit */}
                  <Button
                    type="submit"
                    className="mt-6 w-full"
                    size="lg"
                    isLoading={isSubmitting}
                  >
                    {isSubmitting ? t('submitting') : t('submit')}
                  </Button>

                  {/* Link to full form */}
                  <div className="mt-4 text-center">
                    <p className="text-xs text-text-muted">{t('wantMore')}</p>
                    <Link
                      href="/booking"
                      onClick={handleClose}
                      className="text-sm text-accent transition-colors hover:text-accent-light"
                    >
                      {t('fullForm')} →
                    </Link>
                  </div>
                </form>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
