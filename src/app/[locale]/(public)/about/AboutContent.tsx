'use client';

import SlideUp from '@/components/animations/SlideUp';
import Button from '@/components/ui/Button';
import { Link } from '@/i18n/navigation';

interface AboutContentProps {
  locale: string;
}

export default function AboutContent({ locale }: AboutContentProps) {
  const content = locale === 'en' ? en : ro;

  return (
    <div className="min-h-screen bg-bg-primary pt-24 pb-16">
      {/* Hero / Story Section */}
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <SlideUp>
          <div className="mb-16 text-center">
            <h1 className="mb-6 text-4xl font-bold text-text-primary sm:text-5xl">
              {content.hero.title}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-text-secondary leading-relaxed">
              {content.hero.subtitle}
            </p>
          </div>
        </SlideUp>

        {/* Studio Story */}
        <SlideUp delay={0.1}>
          <section className="mb-20">
            <h2 className="mb-6 text-2xl font-semibold text-text-primary">
              {content.story.title}
            </h2>
            <div className="space-y-4 text-text-secondary leading-relaxed">
              {content.story.paragraphs.map((p, index) => (
                <p key={index}>{p}</p>
              ))}
            </div>
          </section>
        </SlideUp>

        {/* Artists */}
        <section className="mb-20">
          <SlideUp delay={0.15}>
            <h2 className="mb-10 text-center text-2xl font-semibold text-text-primary">
              {content.artists.title}
            </h2>
          </SlideUp>

          <div className="grid gap-8 md:grid-cols-2">
            {content.artists.list.map((artist, index) => (
              <SlideUp key={index} delay={0.2 + index * 0.1}>
                <div className="rounded-lg border border-border bg-bg-secondary p-8">
                  <h3 className="mb-1 text-xl font-bold text-text-primary">
                    {artist.name}
                  </h3>
                  <p className="mb-4 text-sm font-medium text-accent">
                    {artist.specialty}
                  </p>
                  <p className="text-text-secondary leading-relaxed">
                    {artist.description}
                  </p>
                </div>
              </SlideUp>
            ))}
          </div>
        </section>

        {/* Location */}
        <SlideUp delay={0.3}>
          <section className="mb-20">
            <h2 className="mb-6 text-2xl font-semibold text-text-primary">
              {content.location.title}
            </h2>
            <div className="space-y-4 text-text-secondary leading-relaxed">
              {content.location.paragraphs.map((p, index) => (
                <p key={index}>{p}</p>
              ))}
            </div>
          </section>
        </SlideUp>

        {/* Values */}
        <section className="mb-20">
          <SlideUp delay={0.35}>
            <h2 className="mb-10 text-center text-2xl font-semibold text-text-primary">
              {content.values.title}
            </h2>
          </SlideUp>

          <div className="grid gap-6 sm:grid-cols-2">
            {content.values.list.map((value, index) => (
              <SlideUp key={index} delay={0.4 + index * 0.05}>
                <div className="rounded-lg border border-border bg-bg-secondary p-6">
                  <h3 className="mb-2 text-lg font-semibold text-text-primary">
                    {value.title}
                  </h3>
                  <p className="text-sm text-text-secondary leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </SlideUp>
            ))}
          </div>
        </section>

        {/* CTA */}
        <SlideUp delay={0.5}>
          <section className="text-center">
            <div className="rounded-lg border border-border bg-bg-secondary p-10">
              <h2 className="mb-4 text-2xl font-semibold text-text-primary">
                {content.cta.title}
              </h2>
              <p className="mb-8 text-text-secondary">
                {content.cta.description}
              </p>
              <Link href="/booking">
                <Button size="lg">{content.cta.button}</Button>
              </Link>
            </div>
          </section>
        </SlideUp>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Inline content (will be replaced by translation keys later)
// ---------------------------------------------------------------------------

interface Artist {
  name: string;
  specialty: string;
  description: string;
}

interface Value {
  title: string;
  description: string;
}

interface AboutData {
  hero: {
    title: string;
    subtitle: string;
  };
  story: {
    title: string;
    paragraphs: string[];
  };
  artists: {
    title: string;
    list: Artist[];
  };
  location: {
    title: string;
    paragraphs: string[];
  };
  values: {
    title: string;
    list: Value[];
  };
  cta: {
    title: string;
    description: string;
    button: string;
  };
}

const ro: AboutData = {
  hero: {
    title: 'Insomnia Tattoo',
    subtitle:
      'Un studio de tatuaje boutique in Mamaia Nord, unde fiecare design este o poveste scrisa pe piele.',
  },
  story: {
    title: 'Povestea noastra',
    paragraphs: [
      'Insomnia Tattoo s-a nascut din pasiunea pentru arta si dorinta de a crea ceva cu adevarat personal pentru fiecare client. Nu suntem un studio de volum - suntem un spatiu unde fiecare tatuaj primeste timpul si atentia pe care le merita.',
      'Numele "Insomnia" reflecta orele lungi petrecute desenand, perfectionand si visand la urmatorul design. Fiecare proiect incepe cu o conversatie si se termina cu o lucrare care te reprezinta.',
      'Credem ca un tatuaj bun nu e doar o imagine frumoasa - e o colaborare intre artist si client, o piesa unica ce poarta un inteles personal.',
    ],
  },
  artists: {
    title: 'Artistii nostri',
    list: [
      {
        name: 'Madalina',
        specialty: 'Realism & Portrete',
        description:
          'Specializata in realism si portrete, Madalina transforma fotografii si amintiri in tatuaje cu un nivel de detaliu remarcabil. Fiecare portret este tratat ca o lucrare de arta, cu atentie la umbre, texturi si emotia din spatele imaginii.',
      },
      {
        name: 'Florentin',
        specialty: 'Graphic & Line Work',
        description:
          'Cu un stil grafic distinctiv, Florentin combina linii precise cu compozitii bold. Lucrarile sale exploreaza geometria, minimalismul si contrastul, creand tatuaje cu impact vizual puternic si un caracter artistic unic.',
      },
    ],
  },
  location: {
    title: 'Locatia noastra',
    paragraphs: [
      'Studioul nostru se afla in Mamaia Nord, Constanta - la granita dintre energia orasului si linistea marii. Este un loc unde poti sa te relaxezi, sa discuti despre proiectul tau si sa te simti confortabil pe tot parcursul sedintei.',
      'Zona Mamaia Nord ofera un vibe unic: aproape de plaja, departe de aglomeratie, intr-un spatiu care inspira creativitatea.',
    ],
  },
  values: {
    title: 'Valorile noastre',
    list: [
      {
        title: 'Calitate peste cantitate',
        description:
          'Lucram cu un numar limitat de clienti pe zi pentru a oferi fiecaruia toata atentia si timpul necesar.',
      },
      {
        title: 'Design-uri personalizate',
        description:
          'Fiecare tatuaj este creat de la zero, special pentru tine. Nu lucram cu modele prestabilite sau "flash designs" generice.',
      },
      {
        title: 'Abordare personala',
        description:
          'Inainte de fiecare sedinta, avem o consultatie in care discutam ideea, plasarea si asteptarile tale.',
      },
      {
        title: 'Igiena si siguranta',
        description:
          'Folosim exclusiv echipamente sterile si de unica folosinta. Sanatatea ta este prioritatea noastra absoluta.',
      },
    ],
  },
  cta: {
    title: 'Pregatit pentru tatuajul tau?',
    description:
      'Trimite-ne ideea ta si hai sa cream impreuna ceva cu adevarat special.',
    button: 'Programeaza o consultatie',
  },
};

const en: AboutData = {
  hero: {
    title: 'Insomnia Tattoo',
    subtitle:
      'A boutique tattoo studio in Mamaia Nord, where every design is a story written on skin.',
  },
  story: {
    title: 'Our Story',
    paragraphs: [
      'Insomnia Tattoo was born from a passion for art and the desire to create something truly personal for every client. We are not a volume studio - we are a space where every tattoo receives the time and attention it deserves.',
      'The name "Insomnia" reflects the long hours spent drawing, perfecting, and dreaming about the next design. Every project starts with a conversation and ends with a piece that represents you.',
      'We believe that a good tattoo is not just a beautiful image - it is a collaboration between artist and client, a unique piece carrying personal meaning.',
    ],
  },
  artists: {
    title: 'Our Artists',
    list: [
      {
        name: 'Madalina',
        specialty: 'Realism & Portraits',
        description:
          'Specializing in realism and portraits, Madalina transforms photographs and memories into tattoos with a remarkable level of detail. Each portrait is treated as a work of art, with attention to shadows, textures, and the emotion behind the image.',
      },
      {
        name: 'Florentin',
        specialty: 'Graphic & Line Work',
        description:
          'With a distinctive graphic style, Florentin combines precise lines with bold compositions. His work explores geometry, minimalism, and contrast, creating tattoos with strong visual impact and unique artistic character.',
      },
    ],
  },
  location: {
    title: 'Our Location',
    paragraphs: [
      'Our studio is located in Mamaia Nord, Constanta - at the border between the city energy and the calm of the sea. It is a place where you can relax, discuss your project, and feel comfortable throughout the session.',
      'The Mamaia Nord area offers a unique vibe: close to the beach, far from the crowd, in a space that inspires creativity.',
    ],
  },
  values: {
    title: 'Our Values',
    list: [
      {
        title: 'Quality Over Quantity',
        description:
          'We work with a limited number of clients per day to give each one all the attention and time needed.',
      },
      {
        title: 'Custom Designs Only',
        description:
          'Every tattoo is created from scratch, especially for you. We do not work with pre-made templates or generic flash designs.',
      },
      {
        title: 'Personal Approach',
        description:
          'Before each session, we have a consultation where we discuss your idea, placement, and expectations.',
      },
      {
        title: 'Hygiene & Safety',
        description:
          'We use exclusively sterile, single-use equipment. Your health is our absolute priority.',
      },
    ],
  },
  cta: {
    title: 'Ready for your tattoo?',
    description:
      'Send us your idea and let us create something truly special together.',
    button: 'Book a consultation',
  },
};
