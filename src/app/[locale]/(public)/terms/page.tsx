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
  let title = 'Termeni si Conditii | Insomnia Tattoo';
  let description =
    'Termenii si conditiile studioului Insomnia Tattoo din Mamaia Nord, Constanta. Informatii despre programari, anulari si politica studioului.';

  try {
    const t = await getTranslations({ locale, namespace: 'metadata.terms' });
    title = t('title');
    description = t('description');
  } catch {
    // Fallback to hardcoded values
  }

  return {
    title,
    description,
    alternates: getPageAlternates('/terms', locale),
  };
}

export default async function TermsPage({
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

interface TermsContent {
  title: string;
  lastUpdated: string;
  sections: Section[];
  footer: string;
}

const ro: TermsContent = {
  title: 'Termeni si Conditii',
  lastUpdated: 'Ultima actualizare: Aprilie 2026',
  sections: [
    {
      heading: '1. Programari',
      paragraphs: [
        'Trimiterea formularului de programare de pe site-ul nostru reprezinta o solicitare de consultatie, nu o programare confirmata. Echipa noastra te va contacta pentru a discuta detaliile si a stabili o data convenabila.',
        'Confirmarea finala a programarii se face doar dupa comunicarea directa cu unul dintre artistii nostri.',
      ],
    },
    {
      heading: '2. Varsta minima',
      paragraphs: [
        'Trebuie sa ai cel putin 18 ani pentru a te tatua la Insomnia Tattoo.',
        'Persoanele cu varsta intre 16 si 18 ani pot fi tatuate doar cu acordul scris al unui parinte sau tutore legal, care trebuie sa fie prezent in studio la momentul sedintei. Este necesara prezentarea actului de identitate atat pentru minor, cat si pentru parinte/tutore.',
      ],
    },
    {
      heading: '3. Politica de anulare',
      paragraphs: [
        'Anularile sau reprogramarile trebuie comunicate cu cel putin 24 de ore inainte de data programarii.',
        'Reprogramarile pot fi facute direct din contul tau cu cel putin 48 de ore inainte. Pentru intervale mai scurte, te rugam sa contactezi artistul.',
        'In cazul in care nu te prezinti la programare fara o notificare prealabila, ne rezervam dreptul de a refuza programari viitoare.',
      ],
    },
    {
      heading: '4. Cerinte de sanatate',
      paragraphs: [
        'Pentru siguranta ta si pentru calitatea tatuajului, te rugam sa respecti urmatoarele cerinte:',
      ],
      list: [
        'Nu consuma alcool cu cel putin 24 de ore inainte de sedinta',
        'Nu consuma substante recreationale inainte de sedinta',
        'Nu te prezenta cu arsuri solare in zona de tatuat',
        'Informeaza artistul despre orice afectiune medicala, alergie sau tratament medicamentos',
        'Prezinta-te odihnit si hidratat, dupa ce ai mancat',
        'Nu te prezenta bolnav (raceala, gripa, infectii)',
      ],
    },
    {
      heading: '5. Ingrijirea dupa sedinta',
      paragraphs: [
        'Dupa realizarea tatuajului, artistul iti va oferi instructiuni detaliate de ingrijire. Responsabilitatea respectarii acestor instructiuni iti apartine in totalitate.',
        'Insomnia Tattoo nu isi asuma responsabilitatea pentru infectii, decolorari sau alte probleme cauzate de nerespectarea instructiunilor de aftercare.',
      ],
    },
    {
      heading: '6. Drepturi de imagine',
      paragraphs: [
        'Studioul nostru isi rezerva dreptul de a fotografia lucrarile finalizate si de a le folosi in scopuri promotionale pe site, retele sociale si materiale de marketing.',
        'Daca nu doresti ca tatuajul tau sa fie fotografiat sau distribuit, te rugam sa informezi artistul inainte de inceperea sedintei.',
      ],
    },
    {
      heading: '7. Preturi',
      paragraphs: [
        'Trimiterea formularului de programare este gratuita si reprezinta doar o solicitare de consultatie. Nu se solicita avans pentru rezervarea programarii.',
        'Preturile nu sunt afisate pe site. Fiecare tatuaj este unic, iar costul depinde de complexitate, dimensiune, zona corpului si timpul estimat.',
        'Pretul final va fi discutat si agreat in cadrul consultatiei, inainte de inceperea lucrului, si se achita la finalul sedintei la fata locului.',
      ],
    },
    {
      heading: '8. Prelucrarea datelor',
      paragraphs: [
        'Datele personale colectate prin formularul de programare sunt prelucrate in conformitate cu GDPR. Pentru detalii complete, consulta Politica noastra de Confidentialitate.',
      ],
    },
  ],
  footer:
    'Prin utilizarea serviciilor Insomnia Tattoo, confirmi ca ai citit si esti de acord cu acesti termeni si conditii.',
};

const en: TermsContent = {
  title: 'Terms & Conditions',
  lastUpdated: 'Last updated: April 2026',
  sections: [
    {
      heading: '1. Bookings',
      paragraphs: [
        'Submitting the booking form on our website represents a consultation request, not a confirmed appointment. Our team will contact you to discuss details and set a convenient date.',
        'Final booking confirmation is made only after direct communication with one of our artists.',
      ],
    },
    {
      heading: '2. Age Requirement',
      paragraphs: [
        'You must be at least 18 years old to get tattooed at Insomnia Tattoo.',
        'Individuals between 16 and 18 years old may be tattooed only with written consent from a parent or legal guardian, who must be present at the studio during the session. Valid identification is required for both the minor and the parent/guardian.',
      ],
    },
    {
      heading: '3. Cancellation Policy',
      paragraphs: [
        'Cancellations or rescheduling must be communicated at least 24 hours before the appointment date.',
        'Rescheduling can be done directly from your account at least 48 hours in advance. For shorter intervals, please contact the artist.',
        'If you fail to show up for your appointment without prior notice, we reserve the right to refuse future bookings.',
      ],
    },
    {
      heading: '4. Health Requirements',
      paragraphs: [
        'For your safety and the quality of the tattoo, please respect the following requirements:',
      ],
      list: [
        'Do not consume alcohol at least 24 hours before the session',
        'Do not consume recreational substances before the session',
        'Do not come with sunburn on the area to be tattooed',
        'Inform the artist about any medical conditions, allergies, or medications',
        'Come well-rested and hydrated, after having eaten',
        'Do not come if you are sick (cold, flu, infections)',
      ],
    },
    {
      heading: '5. Aftercare Responsibility',
      paragraphs: [
        'After the tattoo session, the artist will provide you with detailed aftercare instructions. The responsibility for following these instructions is entirely yours.',
        'Insomnia Tattoo is not responsible for infections, fading, or other issues caused by failure to follow aftercare instructions.',
      ],
    },
    {
      heading: '6. Image Usage Rights',
      paragraphs: [
        'Our studio reserves the right to photograph completed works and use them for promotional purposes on the website, social media, and marketing materials.',
        'If you do not wish your tattoo to be photographed or shared, please inform the artist before the session begins.',
      ],
    },
    {
      heading: '7. Pricing',
      paragraphs: [
        'Submitting the booking form is free and only represents a consultation request. No deposit is required to reserve the appointment.',
        'Prices are not displayed on the website. Each tattoo is unique, and the cost depends on complexity, size, body area, and estimated time.',
        'The final price will be discussed and agreed upon during the consultation, before work begins, and is paid at the end of the session on-site.',
      ],
    },
    {
      heading: '8. Data Processing',
      paragraphs: [
        'Personal data collected through the booking form is processed in accordance with GDPR. For complete details, please see our Privacy Policy.',
      ],
    },
  ],
  footer:
    'By using Insomnia Tattoo services, you confirm that you have read and agree to these terms and conditions.',
};
