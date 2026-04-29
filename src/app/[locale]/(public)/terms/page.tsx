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
        'Insomnia Tattoo tatueaza doar persoane care au implinit 18 ani.',
        'Nu acceptam clienti sub 18 ani sub nicio forma, inclusiv cu acord parental sau tutore legal. Pentru verificare, studioul poate solicita prezentarea unui act de identitate valid inainte de consultatie sau sedinta.',
      ],
    },
    {
      heading: '3. Politica de anulare',
      paragraphs: [
        'Anularile sau reprogramarile trebuie comunicate cu cel putin 24 de ore inainte de data programarii.',
        'Anularile facute cu mai putin de 24 de ore inainte pot atrage pierderea avansului (daca a fost solicitat) sau imposibilitatea de a reprograma pe termen scurt.',
        'In cazul in care nu te prezinti la programare fara o notificare prealabila, ne rezervam dreptul de a refuza programari viitoare.',
      ],
    },
    {
      heading: '4. Regulament de ordine interioara',
      paragraphs: [
        'Accesul in studio si desfasurarea sedintelor se fac strict in functie de programari confirmate, in intervalul Luni - Duminica, 12:00 - 20:00.',
        'Pentru siguranta clientilor si a artistilor, studioul isi rezerva dreptul de a amana sau refuza o sedinta daca regulamentul nu este respectat.',
      ],
      list: [
        'Prezinta-te la ora stabilita si anunta din timp orice intarziere',
        'Nu consuma alcool sau substante recreationale inaintea programarii',
        'Vino cu act de identitate valid atunci cand este solicitat',
        'Respecta indicatiile artistului privind igiena, pregatirea pielii si aftercare',
        'Insotitorii sunt acceptati doar cu acordul artistului si in limita spatiului disponibil',
        'Fotografierea sau filmarea in studio se face doar cu acordul echipei',
      ],
    },
    {
      heading: '5. Cerinte de sanatate',
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
      heading: '6. Ingrijirea dupa sedinta',
      paragraphs: [
        'Dupa realizarea tatuajului, artistul iti va oferi instructiuni detaliate de ingrijire. Responsabilitatea respectarii acestor instructiuni iti apartine in totalitate.',
        'Insomnia Tattoo nu isi asuma responsabilitatea pentru infectii, decolorari sau alte probleme cauzate de nerespectarea instructiunilor de aftercare.',
      ],
    },
    {
      heading: '7. Drepturi de imagine',
      paragraphs: [
        'Studioul nostru isi rezerva dreptul de a fotografia lucrarile finalizate si de a le folosi in scopuri promotionale pe site, retele sociale si materiale de marketing.',
        'Daca nu doresti ca tatuajul tau sa fie fotografiat sau distribuit, te rugam sa informezi artistul inainte de inceperea sedintei.',
      ],
    },
    {
      heading: '8. Preturi',
      paragraphs: [
        'Preturile nu sunt afisate pe site. Fiecare tatuaj este unic, iar costul depinde de complexitate, dimensiune, zona corpului si timpul estimat.',
        'Pretul va fi discutat si agreat in cadrul consultatiei, inainte de inceperea lucrului.',
        'Studioul poate solicita un avans pentru confirmarea programarii, care se deduce din pretul final.',
      ],
    },
    {
      heading: '9. Prelucrarea datelor',
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
        'Insomnia Tattoo tattoos only people who are at least 18 years old.',
        'We do not accept clients under 18 under any circumstances, including with parental or legal guardian consent. The studio may request valid identification before a consultation or session.',
      ],
    },
    {
      heading: '3. Cancellation Policy',
      paragraphs: [
        'Cancellations or rescheduling must be communicated at least 24 hours before the appointment date.',
        'Cancellations made less than 24 hours in advance may result in the loss of the deposit (if one was requested) or inability to reschedule in the short term.',
        'If you fail to show up for your appointment without prior notice, we reserve the right to refuse future bookings.',
      ],
    },
    {
      heading: '4. Studio Rules',
      paragraphs: [
        'Studio access and tattoo sessions are handled strictly by confirmed appointment within Monday - Sunday, 12:00 - 20:00.',
        'For the safety of clients and artists, the studio reserves the right to postpone or refuse a session if these rules are not respected.',
      ],
      list: [
        'Arrive at the agreed time and notify us in advance about any delay',
        'Do not consume alcohol or recreational substances before the appointment',
        'Bring valid identification when requested',
        'Respect the artist\'s instructions regarding hygiene, skin preparation, and aftercare',
        'Companions are accepted only with the artist\'s approval and subject to available space',
        'Photo or video recording in the studio requires team approval',
      ],
    },
    {
      heading: '5. Health Requirements',
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
      heading: '6. Aftercare Responsibility',
      paragraphs: [
        'After the tattoo session, the artist will provide you with detailed aftercare instructions. The responsibility for following these instructions is entirely yours.',
        'Insomnia Tattoo is not responsible for infections, fading, or other issues caused by failure to follow aftercare instructions.',
      ],
    },
    {
      heading: '7. Image Usage Rights',
      paragraphs: [
        'Our studio reserves the right to photograph completed works and use them for promotional purposes on the website, social media, and marketing materials.',
        'If you do not wish your tattoo to be photographed or shared, please inform the artist before the session begins.',
      ],
    },
    {
      heading: '8. Pricing',
      paragraphs: [
        'Prices are not displayed on the website. Each tattoo is unique, and the cost depends on complexity, size, body area, and estimated time.',
        'The price will be discussed and agreed upon during the consultation, before work begins.',
        'The studio may request a deposit to confirm the booking, which is deducted from the final price.',
      ],
    },
    {
      heading: '9. Data Processing',
      paragraphs: [
        'Personal data collected through the booking form is processed in accordance with GDPR. For complete details, please see our Privacy Policy.',
      ],
    },
  ],
  footer:
    'By using Insomnia Tattoo services, you confirm that you have read and agree to these terms and conditions.',
};
