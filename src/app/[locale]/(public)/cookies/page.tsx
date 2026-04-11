import { getTranslations } from 'next-intl/server';
import type { Metadata } from 'next';
import { getPageAlternates } from '@/lib/seo-utils';
import SlideUp from '@/components/animations/SlideUp';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  let title = 'Politica de Cookie-uri | Insomnia Tattoo';
  let description =
    'Politica de cookie-uri a studioului Insomnia Tattoo. Afla ce cookie-uri folosim si cum le poti gestiona.';

  try {
    const t = await getTranslations({ locale, namespace: 'metadata.cookies' });
    title = t('title');
    description = t('description');
  } catch {
    // Fallback to hardcoded values
  }

  return {
    title,
    description,
    alternates: getPageAlternates('/cookies', locale),
  };
}

export default async function CookiesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const content = locale === 'en' ? en : ro;

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-16">
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <SlideUp>
          <h1 className="mb-2 text-3xl font-bold text-text-primary sm:text-4xl">
            {content.title}
          </h1>
          <p className="mb-12 text-sm text-text-secondary">
            {content.lastUpdated}
          </p>
        </SlideUp>

        <div className="space-y-10">
          {content.sections.map((section, index) => (
            <SlideUp key={index} delay={0.05 * index}>
              <section>
                <h2 className="mb-4 text-xl font-semibold text-text-primary">
                  {section.heading}
                </h2>
                <div className="space-y-3 text-text-secondary leading-relaxed">
                  {section.paragraphs.map((p, pIndex) => (
                    <p key={pIndex}>{p}</p>
                  ))}
                </div>

                {section.cookies && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead>
                        <tr className="border-b border-border">
                          <th className="py-3 pr-4 font-semibold text-text-primary">
                            {content.tableHeaders.name}
                          </th>
                          <th className="py-3 pr-4 font-semibold text-text-primary">
                            {content.tableHeaders.purpose}
                          </th>
                          <th className="py-3 pr-4 font-semibold text-text-primary">
                            {content.tableHeaders.duration}
                          </th>
                          <th className="py-3 font-semibold text-text-primary">
                            {content.tableHeaders.type}
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {section.cookies.map((cookie, cIndex) => (
                          <tr
                            key={cIndex}
                            className="border-b border-border/50"
                          >
                            <td className="py-3 pr-4 font-mono text-xs text-text-primary">
                              {cookie.name}
                            </td>
                            <td className="py-3 pr-4 text-text-secondary">
                              {cookie.purpose}
                            </td>
                            <td className="py-3 pr-4 text-text-secondary">
                              {cookie.duration}
                            </td>
                            <td className="py-3 text-text-secondary">
                              {cookie.type}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </SlideUp>
          ))}
        </div>

        <SlideUp delay={0.4}>
          <div className="mt-12 border-t border-border pt-8">
            <p className="text-sm text-text-secondary">{content.footer}</p>
          </div>
        </SlideUp>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline content (will be replaced by translation keys later)
// ---------------------------------------------------------------------------

interface CookieEntry {
  name: string;
  purpose: string;
  duration: string;
  type: string;
}

interface Section {
  heading: string;
  paragraphs: string[];
  cookies?: CookieEntry[];
}

interface CookiesContent {
  title: string;
  lastUpdated: string;
  tableHeaders: {
    name: string;
    purpose: string;
    duration: string;
    type: string;
  };
  sections: Section[];
  footer: string;
}

const ro: CookiesContent = {
  title: 'Politica de Cookie-uri',
  lastUpdated: 'Ultima actualizare: Aprilie 2026',
  tableHeaders: {
    name: 'Cookie',
    purpose: 'Scop',
    duration: 'Durata',
    type: 'Tip',
  },
  sections: [
    {
      heading: '1. Ce sunt cookie-urile?',
      paragraphs: [
        'Cookie-urile sunt fisiere text de mici dimensiuni care sunt stocate pe dispozitivul tau atunci cand vizitezi un site web. Acestea ajuta site-ul sa functioneze corect si sa ofere o experienta mai buna.',
      ],
    },
    {
      heading: '2. Cookie-uri esentiale',
      paragraphs: [
        'Aceste cookie-uri sunt necesare pentru functionarea de baza a site-ului. Nu pot fi dezactivate deoarece site-ul nu ar functiona corect fara ele.',
      ],
      cookies: [
        {
          name: 'auth_token',
          purpose: 'Autentificare JWT pentru zona de administrare',
          duration: '7 zile',
          type: 'Esential',
        },
        {
          name: 'NEXT_LOCALE',
          purpose: 'Preferinta de limba (RO/EN)',
          duration: '1 an',
          type: 'Esential',
        },
        {
          name: 'cookie_consent',
          purpose: 'Stocarea preferintelor tale de cookie-uri',
          duration: '1 an',
          type: 'Esential',
        },
      ],
    },
    {
      heading: '3. Cookie-uri analitice',
      paragraphs: [
        'Aceste cookie-uri ne ajuta sa intelegem cum este folosit site-ul, ce pagini sunt cele mai vizitate si cum putem imbunatati experienta. Sunt activate doar cu consimtamantul tau explicit.',
      ],
      cookies: [
        {
          name: '_ga, _ga_*',
          purpose: 'Google Analytics 4 - analiza traficului si comportamentului pe site',
          duration: '2 ani',
          type: 'Analitic',
        },
        {
          name: '_fbp',
          purpose: 'Meta Pixel - masurarea eficientei campaniilor publicitare',
          duration: '3 luni',
          type: 'Analitic',
        },
      ],
    },
    {
      heading: '4. Mecanismul de consimtamant',
      paragraphs: [
        'La prima vizita pe site, vei vedea un banner de cookie-uri care iti permite sa alegi ce tipuri de cookie-uri accepti.',
        'Cookie-urile esentiale sunt intotdeauna active deoarece sunt necesare functionarii site-ului.',
        'Cookie-urile analitice (Google Analytics 4, Meta Pixel) sunt incarcate doar dupa ce iti exprimi consimtamantul explicit prin bannerul de cookie-uri.',
        'Poti modifica preferintele tale oricand prin linkul "Setari cookie-uri" din subsolul site-ului.',
      ],
    },
    {
      heading: '5. Cum sa gestionezi cookie-urile',
      paragraphs: [
        'Pe langa bannerul de consimtamant de pe site, poti gestiona cookie-urile direct din setarile browserului tau:',
        'Google Chrome: Setari > Confidentialitate si securitate > Cookie-uri',
        'Mozilla Firefox: Setari > Confidentialitate si securitate',
        'Safari: Preferinte > Confidentialitate',
        'Microsoft Edge: Setari > Cookie-uri si permisiuni pentru site-uri',
        'Stergerea cookie-urilor poate afecta functionarea site-ului si vei fi rugat sa iti exprimi din nou preferintele la urmatoarea vizita.',
      ],
    },
  ],
  footer:
    'Pentru intrebari despre cookie-uri, contacteaza-ne la contact@insomniatattoo.ro.',
};

const en: CookiesContent = {
  title: 'Cookie Policy',
  lastUpdated: 'Last updated: April 2026',
  tableHeaders: {
    name: 'Cookie',
    purpose: 'Purpose',
    duration: 'Duration',
    type: 'Type',
  },
  sections: [
    {
      heading: '1. What Are Cookies?',
      paragraphs: [
        'Cookies are small text files that are stored on your device when you visit a website. They help the site function properly and provide a better experience.',
      ],
    },
    {
      heading: '2. Essential Cookies',
      paragraphs: [
        'These cookies are necessary for the basic operation of the website. They cannot be disabled because the site would not function properly without them.',
      ],
      cookies: [
        {
          name: 'auth_token',
          purpose: 'JWT authentication for the admin area',
          duration: '7 days',
          type: 'Essential',
        },
        {
          name: 'NEXT_LOCALE',
          purpose: 'Language preference (RO/EN)',
          duration: '1 year',
          type: 'Essential',
        },
        {
          name: 'cookie_consent',
          purpose: 'Storage of your cookie preferences',
          duration: '1 year',
          type: 'Essential',
        },
      ],
    },
    {
      heading: '3. Analytics Cookies',
      paragraphs: [
        'These cookies help us understand how the site is used, which pages are most visited, and how we can improve the experience. They are activated only with your explicit consent.',
      ],
      cookies: [
        {
          name: '_ga, _ga_*',
          purpose: 'Google Analytics 4 - website traffic and behavior analysis',
          duration: '2 years',
          type: 'Analytics',
        },
        {
          name: '_fbp',
          purpose: 'Meta Pixel - measuring advertising campaign effectiveness',
          duration: '3 months',
          type: 'Analytics',
        },
      ],
    },
    {
      heading: '4. Consent Mechanism',
      paragraphs: [
        'On your first visit to the site, you will see a cookie banner that allows you to choose which types of cookies you accept.',
        'Essential cookies are always active because they are necessary for the site to function.',
        'Analytics cookies (Google Analytics 4, Meta Pixel) are loaded only after you give your explicit consent through the cookie banner.',
        'You can change your preferences at any time through the "Cookie Settings" link in the site footer.',
      ],
    },
    {
      heading: '5. How to Manage Cookies',
      paragraphs: [
        'In addition to the consent banner on the site, you can manage cookies directly from your browser settings:',
        'Google Chrome: Settings > Privacy and Security > Cookies',
        'Mozilla Firefox: Settings > Privacy & Security',
        'Safari: Preferences > Privacy',
        'Microsoft Edge: Settings > Cookies and Site Permissions',
        'Deleting cookies may affect site functionality and you will be asked to express your preferences again on your next visit.',
      ],
    },
  ],
  footer:
    'For questions about cookies, contact us at contact@insomniatattoo.ro.',
};
