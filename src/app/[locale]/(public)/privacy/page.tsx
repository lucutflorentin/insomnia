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
  let title = 'Politica de Confidentialitate | Insomnia Tattoo';
  let description =
    'Politica de confidentialitate GDPR a studioului Insomnia Tattoo din Mamaia Nord, Constanta. Afla cum protejam datele tale personale.';

  try {
    const t = await getTranslations({ locale, namespace: 'metadata.privacy' });
    title = t('title');
    description = t('description');
  } catch {
    // Fallback to hardcoded values
  }

  return {
    title,
    description,
    alternates: getPageAlternates('/privacy', locale),
  };
}

export default async function PrivacyPage({
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
                  {section.list && (
                    <ul className="ml-4 list-disc space-y-1 text-text-secondary">
                      {section.list.map((item, lIndex) => (
                        <li key={lIndex}>{item}</li>
                      ))}
                    </ul>
                  )}
                </div>
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

interface Section {
  heading: string;
  paragraphs: string[];
  list?: string[];
}

interface PrivacyContent {
  title: string;
  lastUpdated: string;
  sections: Section[];
  footer: string;
}

const ro: PrivacyContent = {
  title: 'Politica de Confidentialitate',
  lastUpdated: 'Ultima actualizare: Aprilie 2026',
  sections: [
    {
      heading: '1. Cine suntem',
      paragraphs: [
        'Insomnia Tattoo este un studio de tatuaje situat pe Str. D10, Nr. 11 Bis, Ap. 2, Mamaia Nord, Constanta. Protejam datele tale personale in conformitate cu Regulamentul General privind Protectia Datelor (GDPR) al Uniunii Europene.',
        'Date de contact pentru solicitari GDPR: contact@insomniatattoo.ro',
      ],
    },
    {
      heading: '2. Ce date colectam',
      paragraphs: ['Colectam urmatoarele categorii de date personale:'],
      list: [
        'Nume si prenume',
        'Adresa de email',
        'Numar de telefon',
        'Detalii despre programare (zona corpului, stilul dorit, dimensiunea)',
        'Imagini de referinta incarcate pentru consultatie',
        'Date tehnice (adresa IP, tipul browserului) prin cookie-uri analitice',
      ],
    },
    {
      heading: '3. De ce colectam aceste date',
      paragraphs: ['Folosim datele tale personale in urmatoarele scopuri:'],
      list: [
        'Gestionarea programarilor si comunicarea cu tine',
        'Imbunatatirea serviciilor noastre',
        'Analiza traficului pe site (Google Analytics 4, Meta Pixel) - doar cu consimtamantul tau',
        'Autentificarea in zona de administrare (token JWT)',
      ],
    },
    {
      heading: '4. Temeiul legal',
      paragraphs: [
        'Prelucram datele tale pe baza consimtamantului explicit (Art. 6 alin. 1 lit. a GDPR) cand trimiti formularul de programare si cand accepti cookie-urile analitice.',
        'Pentru administrarea contului si securitatea site-ului, temeiul legal este interesul legitim (Art. 6 alin. 1 lit. f GDPR).',
      ],
    },
    {
      heading: '5. Cat timp pastram datele',
      paragraphs: [
        'Datele de programare sunt pastrate pe durata relatiei cu studioul si inca 2 ani dupa ultima interactiune, pentru evidenta interna.',
        'Imaginile de referinta sunt sterse in termen de 90 de zile dupa finalizarea tatuajului.',
        'Datele analitice sunt anonimizate si agregate conform politicilor Google si Meta.',
      ],
    },
    {
      heading: '6. Unde stocam datele',
      paragraphs: [
        'Datele sunt stocate intr-o baza de date MySQL securizata, gazduita pe servere din Uniunea Europeana.',
        'Imaginile incarcate sunt stocate pe serverul nostru si nu sunt partajate cu terti.',
      ],
    },
    {
      heading: '7. Drepturile tale',
      paragraphs: ['Conform GDPR, ai urmatoarele drepturi:'],
      list: [
        'Dreptul de acces - poti solicita o copie a datelor tale personale',
        'Dreptul la rectificare - poti cere corectarea datelor inexacte',
        'Dreptul la stergere ("dreptul de a fi uitat") - poti cere stergerea datelor tale',
        'Dreptul la restrictionarea prelucrarii',
        'Dreptul la portabilitatea datelor',
        'Dreptul de a te opune prelucrarii',
        'Dreptul de a depune o plangere la ANSPDCP (Autoritatea Nationala de Supraveghere a Prelucrarii Datelor cu Caracter Personal)',
      ],
    },
    {
      heading: '8. Cookie-uri',
      paragraphs: [
        'Folosim cookie-uri esentiale pentru functionarea site-ului (autentificare JWT, preferinta de limba) si cookie-uri analitice (Google Analytics 4, Meta Pixel) care sunt activate doar cu consimtamantul tau explicit.',
        'Pentru detalii complete, consulta Politica noastra de Cookie-uri.',
      ],
    },
    {
      heading: '9. Contact',
      paragraphs: [
        'Pentru orice intrebare legata de protectia datelor personale sau pentru exercitarea drepturilor tale, ne poti contacta la:',
        'Email: contact@insomniatattoo.ro',
        'Adresa: Str. D10, Nr. 11 Bis, Ap. 2, Mamaia Nord, Constanta',
      ],
    },
  ],
  footer:
    'Aceasta politica de confidentialitate poate fi actualizata periodic. Te incurajam sa o consulti regulat.',
};

const en: PrivacyContent = {
  title: 'Privacy Policy',
  lastUpdated: 'Last updated: April 2026',
  sections: [
    {
      heading: '1. Who We Are',
      paragraphs: [
        'Insomnia Tattoo is a tattoo studio located at Str. D10, No. 11 Bis, Apt. 2, Mamaia Nord, Constanta. We protect your personal data in accordance with the European Union General Data Protection Regulation (GDPR).',
        'Contact for GDPR requests: contact@insomniatattoo.ro',
      ],
    },
    {
      heading: '2. What Data We Collect',
      paragraphs: ['We collect the following categories of personal data:'],
      list: [
        'Full name',
        'Email address',
        'Phone number',
        'Booking details (body area, desired style, size)',
        'Reference images uploaded for consultation',
        'Technical data (IP address, browser type) through analytics cookies',
      ],
    },
    {
      heading: '3. Why We Collect This Data',
      paragraphs: ['We use your personal data for the following purposes:'],
      list: [
        'Managing bookings and communicating with you',
        'Improving our services',
        'Website traffic analysis (Google Analytics 4, Meta Pixel) - only with your consent',
        'Authentication for the admin area (JWT token)',
      ],
    },
    {
      heading: '4. Legal Basis',
      paragraphs: [
        'We process your data based on explicit consent (Art. 6(1)(a) GDPR) when you submit the booking form and when you accept analytics cookies.',
        'For account management and website security, the legal basis is legitimate interest (Art. 6(1)(f) GDPR).',
      ],
    },
    {
      heading: '5. How Long We Keep Data',
      paragraphs: [
        'Booking data is retained for the duration of the relationship with the studio and for 2 years after the last interaction, for internal records.',
        'Reference images are deleted within 90 days after the tattoo is completed.',
        'Analytics data is anonymized and aggregated according to Google and Meta policies.',
      ],
    },
    {
      heading: '6. Where We Store Data',
      paragraphs: [
        'Data is stored in a secure MySQL database hosted on servers within the European Union.',
        'Uploaded images are stored on our server and are not shared with third parties.',
      ],
    },
    {
      heading: '7. Your Rights',
      paragraphs: ['Under GDPR, you have the following rights:'],
      list: [
        'Right of access - you can request a copy of your personal data',
        'Right to rectification - you can request correction of inaccurate data',
        'Right to erasure ("right to be forgotten") - you can request deletion of your data',
        'Right to restriction of processing',
        'Right to data portability',
        'Right to object to processing',
        'Right to lodge a complaint with ANSPDCP (National Supervisory Authority for Personal Data Processing)',
      ],
    },
    {
      heading: '8. Cookies',
      paragraphs: [
        'We use essential cookies for website functionality (JWT authentication, language preference) and analytics cookies (Google Analytics 4, Meta Pixel) that are activated only with your explicit consent.',
        'For complete details, please see our Cookie Policy.',
      ],
    },
    {
      heading: '9. Contact',
      paragraphs: [
        'For any questions regarding personal data protection or to exercise your rights, you can contact us at:',
        'Email: contact@insomniatattoo.ro',
        'Address: Str. D10, No. 11 Bis, Apt. 2, Mamaia Nord, Constanta',
      ],
    },
  ],
  footer:
    'This privacy policy may be updated periodically. We encourage you to review it regularly.',
};
