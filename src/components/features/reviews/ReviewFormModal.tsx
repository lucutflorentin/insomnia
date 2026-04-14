'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { useToast } from '@/components/ui/Toast';
import { cn } from '@/lib/utils';

interface ReviewFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  bookingId: number;
  artistName: string;
  onSuccess: () => void;
}

export default function ReviewFormModal({
  isOpen,
  onClose,
  bookingId,
  artistName,
  onSuccess,
}: ReviewFormModalProps) {
  const t = useTranslations('account.reviews.form');
  const { showToast } = useToast();

  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (rating === 0) {
      showToast(t('ratingRequired'), 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId,
          rating,
          reviewTextRo: reviewText || undefined,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        showToast(t('success'), 'success');
        onSuccess();
        handleClose();
      } else {
        showToast(data.error || t('error'), 'error');
      }
    } catch {
      showToast(t('error'), 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setRating(0);
    setHoveredRating(0);
    setReviewText('');
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={t('title')}>
      <div className="space-y-6">
        {/* Artist name */}
        <p className="text-sm text-text-secondary">
          {t('forArtist', { artist: artistName })}
        </p>

        {/* Star rating */}
        <div>
          <label className="mb-2 block text-sm font-medium text-text-secondary">
            {t('ratingLabel')}
          </label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoveredRating(star)}
                onMouseLeave={() => setHoveredRating(0)}
                className="p-1 transition-transform hover:scale-110"
              >
                <svg
                  className={cn(
                    'h-8 w-8 transition-colors',
                    star <= (hoveredRating || rating)
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'fill-none text-text-muted',
                  )}
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M11.48 3.499a.562.562 0 011.04 0l2.125 5.111a.563.563 0 00.475.345l5.518.442c.499.04.701.663.321.988l-4.204 3.602a.563.563 0 00-.182.557l1.285 5.385a.562.562 0 01-.84.61l-4.725-2.885a.563.563 0 00-.586 0L6.982 20.54a.562.562 0 01-.84-.61l1.285-5.386a.562.562 0 00-.182-.557l-4.204-3.602a.563.563 0 01.321-.988l5.518-.442a.563.563 0 00.475-.345L11.48 3.5z"
                  />
                </svg>
              </button>
            ))}
          </div>
        </div>

        {/* Review text */}
        <Textarea
          label={t('textLabel')}
          placeholder={t('textPlaceholder')}
          value={reviewText}
          onChange={(e) => setReviewText(e.target.value)}
          rows={4}
        />
        <p className="text-xs text-text-muted">{t('textHint')}</p>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-2">
          <Button variant="ghost" onClick={handleClose}>
            {t('cancel')}
          </Button>
          <Button
            onClick={handleSubmit}
            isLoading={isSubmitting}
            disabled={rating === 0}
          >
            {t('submit')}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
