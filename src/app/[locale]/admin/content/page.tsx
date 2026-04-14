'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useToast } from '@/components/ui/Toast';
import Button from '@/components/ui/Button';
import Textarea from '@/components/ui/Textarea';
import { Save, Loader2 } from 'lucide-react';

interface ContentSection {
  id: string;
  titleKey: string;
  fields: { key: string; labelKey: string; type: 'input' | 'textarea'; rows?: number }[];
}

const SECTIONS: ContentSection[] = [
  {
    id: 'hero',
    titleKey: 'hero',
    fields: [
      { key: 'hero_title_ro', labelKey: 'heroTitleRo', type: 'input' },
      { key: 'hero_title_en', labelKey: 'heroTitleEn', type: 'input' },
      { key: 'hero_subtitle_ro', labelKey: 'heroSubtitleRo', type: 'textarea', rows: 2 },
      { key: 'hero_subtitle_en', labelKey: 'heroSubtitleEn', type: 'textarea', rows: 2 },
    ],
  },
  {
    id: 'about',
    titleKey: 'about',
    fields: [
      { key: 'about_title_ro', labelKey: 'aboutTitleRo', type: 'input' },
      { key: 'about_title_en', labelKey: 'aboutTitleEn', type: 'input' },
      { key: 'about_story_ro', labelKey: 'aboutStoryRo', type: 'textarea', rows: 5 },
      { key: 'about_story_en', labelKey: 'aboutStoryEn', type: 'textarea', rows: 5 },
      { key: 'about_mission_ro', labelKey: 'aboutMissionRo', type: 'textarea', rows: 3 },
      { key: 'about_mission_en', labelKey: 'aboutMissionEn', type: 'textarea', rows: 3 },
    ],
  },
  {
    id: 'aftercare',
    titleKey: 'aftercare',
    fields: [
      { key: 'aftercare_intro_ro', labelKey: 'aftercareIntroRo', type: 'textarea', rows: 3 },
      { key: 'aftercare_intro_en', labelKey: 'aftercareIntroEn', type: 'textarea', rows: 3 },
    ],
  },
  {
    id: 'faq',
    titleKey: 'faq',
    fields: [
      { key: 'faq_intro_ro', labelKey: 'faqIntroRo', type: 'textarea', rows: 2 },
      { key: 'faq_intro_en', labelKey: 'faqIntroEn', type: 'textarea', rows: 2 },
    ],
  },
  {
    id: 'footer',
    titleKey: 'footer',
    fields: [
      { key: 'footer_tagline_ro', labelKey: 'footerTaglineRo', type: 'input' },
      { key: 'footer_tagline_en', labelKey: 'footerTaglineEn', type: 'input' },
    ],
  },
];

export default function AdminContentPage() {
  const t = useTranslations('admin.content');
  const { showToast } = useToast();
  const [content, setContent] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('hero');

  useEffect(() => {
    fetch('/api/admin/content')
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setContent(data.data || {});
      })
      .catch(() => showToast(t('loadError'), 'error'))
      .finally(() => setIsLoading(false));
  }, [showToast, t]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(content),
      });
      if (res.ok) {
        showToast(t('saved'), 'success');
      } else {
        showToast(t('saveError'), 'error');
      }
    } catch {
      showToast(t('saveError'), 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const activeSection = SECTIONS.find((s) => s.id === activeTab);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-accent border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-heading text-2xl text-text-primary">{t('title')}</h1>
        <Button onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          {t('save')}
        </Button>
      </div>

      <p className="mb-6 text-sm text-text-muted">{t('description')}</p>

      {/* Section tabs */}
      <div className="mb-6 flex flex-wrap gap-2">
        {SECTIONS.map((section) => (
          <button
            key={section.id}
            onClick={() => setActiveTab(section.id)}
            className={`rounded-full px-4 py-1.5 text-sm transition-colors ${
              activeTab === section.id
                ? 'bg-accent text-bg-primary'
                : 'bg-white/5 text-text-secondary hover:bg-white/10'
            }`}
          >
            {t(`sections.${section.titleKey}`)}
          </button>
        ))}
      </div>

      {/* Active section fields */}
      {activeSection && (
        <div className="rounded-lg border border-white/10 bg-bg-secondary p-6">
          <h2 className="mb-4 font-heading text-lg text-text-primary">
            {t(`sections.${activeSection.titleKey}`)}
          </h2>

          <div className="space-y-4">
            {activeSection.fields.map((field) => (
              <div key={field.key}>
                {field.type === 'textarea' ? (
                  <Textarea
                    label={t(`fields.${field.labelKey}`)}
                    value={content[field.key] || ''}
                    onChange={(e) =>
                      setContent((prev) => ({ ...prev, [field.key]: e.target.value }))
                    }
                    rows={field.rows || 3}
                  />
                ) : (
                  <div>
                    <label className="mb-1 block text-sm text-text-secondary">
                      {t(`fields.${field.labelKey}`)}
                    </label>
                    <input
                      type="text"
                      value={content[field.key] || ''}
                      onChange={(e) =>
                        setContent((prev) => ({ ...prev, [field.key]: e.target.value }))
                      }
                      className="w-full rounded-sm border border-border bg-bg-primary px-3 py-2 text-sm text-text-primary focus:border-accent focus:outline-none"
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
