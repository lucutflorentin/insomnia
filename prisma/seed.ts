import { PrismaClient, UserRole } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  const defaultPassword = process.env.SEED_ADMIN_PASSWORD || 'insomnia2024';
  const passwordHash = await hash(defaultPassword, 12);

  // --- Super Admin (separate account) ---
  const superAdminUser = await prisma.user.upsert({
    where: { email: 'admin@insomniatattoo.ro' },
    update: {},
    create: {
      email: 'admin@insomniatattoo.ro',
      passwordHash,
      role: UserRole.SUPER_ADMIN,
      name: 'Admin Insomnia',
      isActive: true,
    },
  });
  console.log(`Super Admin: ${superAdminUser.email}`);

  // --- Artist Users ---
  const madalinaUser = await prisma.user.upsert({
    where: { email: 'madalina@insomniatattoo.ro' },
    update: {},
    create: {
      email: 'madalina@insomniatattoo.ro',
      passwordHash,
      role: UserRole.ARTIST,
      name: 'Madalina',
      isActive: true,
    },
  });

  const florentinUser = await prisma.user.upsert({
    where: { email: 'florentin@insomniatattoo.ro' },
    update: {},
    create: {
      email: 'florentin@insomniatattoo.ro',
      passwordHash,
      role: UserRole.ARTIST,
      name: 'Florentin',
      isActive: true,
    },
  });

  // --- Artist Profiles ---
  const madalina = await prisma.artist.upsert({
    where: { slug: 'madalina' },
    update: {},
    create: {
      userId: madalinaUser.id,
      name: 'Madalina',
      slug: 'madalina',
      bioRo: 'Specializata in realism, portrete si lucrari color cu detalii exceptionale. Cu o pasiune pentru arta care transcende pielea, fiecare tatuaj este o poveste unica.',
      bioEn: 'Specialized in realism, portraits and color work with exceptional detail. With a passion for art that transcends skin, each tattoo is a unique story.',
      specialtyRo: 'Realism & Portrete',
      specialtyEn: 'Realism & Portraits',
      specialties: ['realism', 'portraits', 'color', 'black_grey', 'nature'],
      instagramUrl: 'https://instagram.com/madalina.insomnia',
      profileImage: '/images/artist-madalina.png',
      sortOrder: 1,
      isActive: true,
    },
  });

  const florentin = await prisma.artist.upsert({
    where: { slug: 'florentin' },
    update: {},
    create: {
      userId: florentinUser.id,
      name: 'Florentin',
      slug: 'florentin',
      bioRo: 'Pasionat de graphic design, line work, geometric si minimalism. Fiecare linie este trasata cu precizie, fiecare design spune o poveste.',
      bioEn: 'Passionate about graphic design, line work, geometric and minimalism. Every line is drawn with precision, every design tells a story.',
      specialtyRo: 'Graphic & Line Work',
      specialtyEn: 'Graphic & Line Work',
      specialties: ['graphic', 'linework', 'geometric', 'minimalist', 'blackwork'],
      instagramUrl: 'https://instagram.com/florentin.insomnia',
      profileImage: '/images/artist-florentin.png',
      sortOrder: 2,
      isActive: true,
    },
  });

  console.log(`Artists: ${madalina.name}, ${florentin.name}`);

  // --- Availability Templates (Mon-Sun 12-20, appointment-only) ---
  for (const artist of [madalina, florentin]) {
    for (let day = 0; day <= 6; day++) {
      await prisma.availabilityTemplate.upsert({
        where: {
          unique_artist_day: { artistId: artist.id, dayOfWeek: day },
        },
        update: {
          startTime: '12:00',
          endTime: '20:00',
          isActive: true,
        },
        create: {
          artistId: artist.id,
          dayOfWeek: day,
          startTime: '12:00',
          endTime: '20:00',
          isActive: true,
        },
      });
    }
  }

  console.log('Availability templates created');

  // --- Sample Reviews (pre-approved for seed data) ---
  const reviews = [
    {
      clientName: 'Alexandra M.',
      artistId: madalina.id,
      rating: 5,
      reviewTextRo: 'Portretul este incredibil! Madalina a captat fiecare detaliu perfect. Recomand cu toata increderea.',
      reviewTextEn: 'The portrait is incredible! Madalina captured every detail perfectly. I recommend with full confidence.',
      source: 'google',
      isApproved: true,
      isVisible: true,
    },
    {
      clientName: 'Andrei P.',
      artistId: florentin.id,
      rating: 5,
      reviewTextRo: 'Design geometric superb. Florentin are o viziune artistica unica. Calitate exceptionala.',
      reviewTextEn: 'Superb geometric design. Florentin has a unique artistic vision. Exceptional quality.',
      source: 'google',
      isApproved: true,
      isVisible: true,
    },
    {
      clientName: 'Maria C.',
      artistId: madalina.id,
      rating: 5,
      reviewTextRo: 'Am facut un tatuaj color si sunt extrem de multumita. Studio curat, atmosfera relaxanta.',
      reviewTextEn: 'I got a color tattoo and I am extremely satisfied. Clean studio, relaxing atmosphere.',
      source: 'instagram',
      isApproved: true,
      isVisible: true,
    },
    {
      clientName: 'Radu S.',
      artistId: florentin.id,
      rating: 5,
      reviewTextRo: 'Line work impecabil. Exact ce mi-am dorit. Profesionalism de la inceput pana la sfarsit.',
      reviewTextEn: 'Impeccable line work. Exactly what I wanted. Professionalism from start to finish.',
      source: 'instagram',
      isApproved: true,
      isVisible: true,
    },
  ];

  for (const review of reviews) {
    await prisma.review.create({ data: review });
  }

  console.log(`${reviews.length} reviews created`);

  // --- Default Settings ---
  await prisma.setting.upsert({
    where: { settingKey: 'studio_hours' },
    update: {
      settingValue: JSON.stringify({
        'mon-sun': '12:00 - 20:00',
        note: 'Se lucreaza strict in functie de programari in intervalul afisat',
      }),
    },
    create: {
      settingKey: 'studio_hours',
      settingValue: JSON.stringify({
        'mon-sun': '12:00 - 20:00',
        note: 'Se lucreaza strict in functie de programari in intervalul afisat',
      }),
    },
  });

  await prisma.setting.upsert({
    where: { settingKey: 'studio_address' },
    update: {
      settingValue: 'Str. D10, Nr. 11 Bis, Ap. 2, Mamaia Nord, Constanta',
    },
    create: {
      settingKey: 'studio_address',
      settingValue: 'Str. D10, Nr. 11 Bis, Ap. 2, Mamaia Nord, Constanta',
    },
  });

  console.log('Settings created');
  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
