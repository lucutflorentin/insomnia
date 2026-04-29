const STYLE_ALIASES: Record<string, string> = {
  realism: 'realism',
  realistic: 'realism',
  portrait: 'portraits',
  portraits: 'portraits',
  portrete: 'portraits',
  graphic: 'graphic',
  linework: 'linework',
  line_work: 'linework',
  blackgrey: 'blackgrey',
  black_grey: 'blackgrey',
  blackwork: 'blackwork',
  color: 'color',
  colour: 'color',
  geometric: 'geometric',
  minimalist: 'minimalist',
  minimalism: 'minimalist',
  nature: 'nature',
};

export function normalizeStyleKey(style?: string | null): string {
  if (!style) return '';

  const normalized = style
    .trim()
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');

  const compact = normalized.replace(/_/g, '');

  return STYLE_ALIASES[normalized] || STYLE_ALIASES[compact] || normalized;
}

export function formatStyleLabel(style?: string | null): string {
  const key = normalizeStyleKey(style);
  if (!key) return '';

  const labels: Record<string, string> = {
    realism: 'Realism',
    portraits: 'Portrete',
    color: 'Color',
    blackgrey: 'Black & Grey',
    nature: 'Natura',
    graphic: 'Graphic',
    linework: 'Line Work',
    geometric: 'Geometric',
    minimalist: 'Minimalist',
    blackwork: 'Blackwork',
  };

  return labels[key] || key.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}
