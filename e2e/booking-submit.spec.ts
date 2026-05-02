import { expect, test, type APIRequestContext } from '@playwright/test';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const hasDatabaseUrl = Boolean(process.env.DATABASE_URL?.trim());

async function findFirstOpenSlot(request: APIRequestContext) {
  const artistsRes = await request.get('/api/artists');
  expect(artistsRes.ok()).toBeTruthy();
  const artistsJson = await artistsRes.json();
  const artist = artistsJson.data?.find((a: { slug: string }) => a.slug === 'florentin') ??
    artistsJson.data?.[0];
  expect(artist?.slug).toBeTruthy();

  const now = new Date();
  for (let offset = 0; offset < 2; offset++) {
    const monthDate = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const month = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
    const availabilityRes = await request.get(
      `/api/artists/${artist.slug}/availability?month=${month}`,
    );
    expect(availabilityRes.ok()).toBeTruthy();
    const availabilityJson = await availabilityRes.json();
    const day = availabilityJson.data?.find(
      (item: { isAvailable: boolean; slots: string[] }) =>
        item.isAvailable && item.slots.length > 0,
    );
    if (day) {
      return {
        artist,
        month,
        date: day.date as string,
        time: day.slots[0] as string,
      };
    }
  }

  throw new Error(`No available booking slot found for ${artist.slug}`);
}

test.describe('booking submit', () => {
  test.skip(!hasDatabaseUrl, 'DATABASE_URL is required for booking persistence');

  test.afterAll(async () => {
    await prisma.notification.deleteMany({
      where: { title: { contains: 'E2E Booking Test' } },
    });
    await prisma.booking.deleteMany({
      where: { clientEmail: { contains: '@e2e.invalid' } },
    });
    await prisma.$disconnect();
  });

  test('submits a full booking request without sending real email', async ({
    page,
    request,
  }) => {
    expect(process.env.EMAIL_DELIVERY_MODE).toBe('dry-run');

    const slot = await findFirstOpenSlot(request);
    const unique = Date.now();
    const clientName = `E2E Booking Test ${unique}`;
    const clientEmail = `booking-${unique}@e2e.invalid`;

    await page.goto('/ro/booking');

    await page.getByRole('button', { name: new RegExp(slot.artist.name, 'i') }).click();
    await page.getByRole('button', { name: 'Continua' }).click();

    await page.getByLabel('Zona corpului').selectOption('forearm');
    await page.getByLabel('Dimensiune aproximativa').selectOption('small');
    await page
      .getByLabel('Descrierea ideii tale')
      .fill('Test end-to-end pentru fluxul complet de booking, fara email real.');
    await page.getByRole('button', { name: 'Continua' }).click();

    const currentMonth = new Date();
    const expectedMonth = `${currentMonth.getFullYear()}-${String(currentMonth.getMonth() + 1).padStart(2, '0')}`;
    if (slot.month !== expectedMonth) {
      await page.getByRole('button', { name: '→' }).click();
    }

    const day = String(Number(slot.date.slice(-2)));
    await page.getByRole('button', { name: day, exact: true }).click();
    await page.getByRole('button', { name: slot.time, exact: true }).click();
    await page.getByRole('button', { name: 'Continua' }).click();

    await page.getByLabel('Nume complet').fill(clientName);
    await page.getByLabel('Telefon (WhatsApp)').fill('+40700000000');
    await page.getByRole('textbox', { name: 'Email' }).fill(clientEmail);
    await page.getByLabel(/Sunt de acord cu prelucrarea datelor personale/).check();
    await page.getByRole('button', { name: 'Continua' }).click();

    await page.getByRole('button', { name: 'Trimite cererea' }).click();
    await expect(
      page.getByRole('heading', { name: 'Cererea ta a fost trimisa!' }),
    ).toBeVisible();

    const booking = await prisma.booking.findFirst({
      where: { clientEmail },
      select: {
        id: true,
        referenceCode: true,
        clientName: true,
        artist: { select: { slug: true } },
        consultationTime: true,
      },
    });

    expect(booking).toBeTruthy();
    expect(booking?.clientName).toBe(clientName);
    expect(booking?.artist.slug).toBe(slot.artist.slug);
    expect(booking?.consultationTime).toBe(slot.time);
  });
});
