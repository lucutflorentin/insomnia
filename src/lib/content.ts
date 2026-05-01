export const CONTENT_PREFIX = 'content_';

export const CONTENT_KEYS = [
  'hero_title_ro',
  'hero_title_en',
  'hero_subtitle_ro',
  'hero_subtitle_en',
  'about_title_ro',
  'about_title_en',
  'about_story_ro',
  'about_story_en',
  'about_mission_ro',
  'about_mission_en',
  'aftercare_intro_ro',
  'aftercare_intro_en',
  'faq_intro_ro',
  'faq_intro_en',
  'footer_tagline_ro',
  'footer_tagline_en',
] as const;

const CONTENT_KEY_SET = new Set<string>(CONTENT_KEYS);

export function isContentKey(key: string): boolean {
  return CONTENT_KEY_SET.has(key);
}
