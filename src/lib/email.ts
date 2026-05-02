import nodemailer from 'nodemailer';
import type { SendMailOptions } from 'nodemailer';

/** Escape HTML special characters to prevent injection in email templates */
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const isDryRunEmail =
  process.env.EMAIL_DELIVERY_MODE === 'dry-run' ||
  process.env.SKIP_EMAIL_DELIVERY === '1';

let transporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 465,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  return transporter;
}

async function sendMail(options: SendMailOptions): Promise<void> {
  if (isDryRunEmail) {
    console.info('[email:dry-run]', {
      to: options.to,
      subject: options.subject,
    });
    return;
  }

  await getTransporter().sendMail(options);
}

interface BookingEmailData {
  clientName: string;
  clientEmail: string;
  artistName: string;
  artistEmail: string;
  date: string;
  time: string;
  referenceCode: string;
  bodyArea?: string;
  size?: string;
  style?: string;
  description?: string;
  source?: string;
  clientPhone?: string;
  language: 'ro' | 'en';
  /** Public URLs for reference images uploaded by the client (already validated upstream). */
  referenceImages?: string[];
}

export async function sendBookingConfirmation(
  data: BookingEmailData,
): Promise<void> {
  const isRo = data.language === 'ro';

  const subject = isRo
    ? `Confirmarea cererii tale — Insomnia Tattoo`
    : `Your booking request confirmation — Insomnia Tattoo`;

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0A; color: #F5F5F5; padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; color: #B0B0B0; font-size: 28px; margin: 0;">
          Insomnia Tattoo
        </h1>
      </div>

      <p style="font-size: 16px; line-height: 1.6;">
        ${isRo ? `Salut ${escapeHtml(data.clientName)}!` : `Hi ${escapeHtml(data.clientName)}!`}
      </p>

      <p style="font-size: 16px; line-height: 1.6; color: #A0A0A0;">
        ${
          isRo
            ? `Multumim ca ai ales Insomnia Tattoo. Am primit cererea ta de consultatie cu <strong style="color: #B0B0B0;">${escapeHtml(data.artistName)}</strong>.`
            : `Thank you for choosing Insomnia Tattoo. We've received your consultation request with <strong style="color: #B0B0B0;">${escapeHtml(data.artistName)}</strong>.`
        }
      </p>

      <div style="background-color: #1A1A1A; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 3px solid #B0B0B0;">
        <p style="margin: 8px 0; font-size: 15px;">📅 ${isRo ? 'Data' : 'Date'}: <strong>${data.date}</strong></p>
        <p style="margin: 8px 0; font-size: 15px;">🕐 ${isRo ? 'Ora' : 'Time'}: <strong>${data.time}</strong></p>
        <p style="margin: 8px 0; font-size: 15px;">📍 Insomnia Tattoo, Str. D10, Nr. 11 Bis, Ap. 2, Mamaia Nord, Constanta</p>
      </div>

      <p style="font-size: 16px; line-height: 1.6; color: #A0A0A0;">
        ${
          isRo
            ? 'Te vom contacta in maxim 24h pentru confirmare.'
            : "We'll contact you within 24 hours to confirm."
        }
      </p>

      <p style="font-size: 14px; color: #666666; margin-top: 20px;">
        ${isRo ? 'Cod referinta' : 'Reference code'}: <strong style="color: #B0B0B0;">${data.referenceCode}</strong>
      </p>

      <hr style="border: none; border-top: 1px solid #2A2A2A; margin: 30px 0;" />

      <p style="font-size: 13px; color: #666666; text-align: center;">
        ${isRo ? 'Cu drag,' : 'Best regards,'}<br />
        <strong>Echipa Insomnia Tattoo</strong>
      </p>
    </div>
  `;

  await sendMail({
    from: `"Insomnia Tattoo" <${process.env.SMTP_USER}>`,
    to: data.clientEmail,
    subject,
    html,
  });
}

export async function sendAftercareReminder(data: {
  clientName: string;
  clientEmail: string;
  artistName: string;
  language: 'ro' | 'en';
}): Promise<void> {
  const isRo = data.language === 'ro';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://insomniatattoo.ro';

  const subject = isRo
    ? `Ghid aftercare pentru tatuajul tau — Insomnia Tattoo`
    : `Aftercare guide for your tattoo — Insomnia Tattoo`;

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0A; color: #F5F5F5; padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; color: #B0B0B0; font-size: 28px; margin: 0;">
          Insomnia Tattoo
        </h1>
      </div>

      <p style="font-size: 16px; line-height: 1.6;">
        ${isRo ? `Salut ${escapeHtml(data.clientName)}!` : `Hi ${escapeHtml(data.clientName)}!`}
      </p>

      <p style="font-size: 16px; line-height: 1.6; color: #A0A0A0;">
        ${
          isRo
            ? `A trecut o saptamana de la sesiunea ta cu <strong style="color: #B0B0B0;">${escapeHtml(data.artistName)}</strong>. Sper ca tatuajul tau arata superb!`
            : `It's been a week since your session with <strong style="color: #B0B0B0;">${escapeHtml(data.artistName)}</strong>. Hope your tattoo looks amazing!`
        }
      </p>

      <div style="background-color: #1A1A1A; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 3px solid #B0B0B0;">
        <p style="margin: 0; font-size: 15px; font-weight: bold; color: #B0B0B0;">
          ${isRo ? '🖤 Sfaturi rapide aftercare:' : '🖤 Quick aftercare tips:'}
        </p>
        <ul style="margin: 10px 0 0 0; padding-left: 20px; color: #A0A0A0; font-size: 14px; line-height: 1.8;">
          <li>${isRo ? 'Continua sa hidratezi zona cu crema fara parfum' : 'Continue moisturizing with fragrance-free cream'}</li>
          <li>${isRo ? 'Evita expunerea directa la soare' : 'Avoid direct sun exposure'}</li>
          <li>${isRo ? 'Nu scarpina zona, chiar daca mananca' : "Don't scratch, even if it itches"}</li>
          <li>${isRo ? 'Evita piscina si sauna inca 2-3 saptamani' : 'Avoid pools and saunas for 2-3 more weeks'}</li>
        </ul>
      </div>

      <p style="font-size: 14px; color: #A0A0A0;">
        ${
          isRo
            ? `Ghidul complet de aftercare il gasesti aici:`
            : `Find the complete aftercare guide here:`
        }
        <a href="${siteUrl}/aftercare" style="color: #B0B0B0; text-decoration: underline;">${siteUrl}/aftercare</a>
      </p>

      <hr style="border: none; border-top: 1px solid #2A2A2A; margin: 30px 0;" />

      <p style="font-size: 14px; color: #A0A0A0; text-align: center;">
        ${
          isRo
            ? `Daca esti multumit de tatuajul tau, ne-ar bucura un <a href="https://g.page/r/insomniatattoo/review" style="color: #B0B0B0;">review pe Google</a>! 🖤`
            : `If you love your tattoo, we'd appreciate a <a href="https://g.page/r/insomniatattoo/review" style="color: #B0B0B0;">Google review</a>! 🖤`
        }
      </p>

      <p style="font-size: 13px; color: #666666; text-align: center; margin-top: 20px;">
        ${isRo ? 'Cu drag,' : 'Best regards,'}<br />
        <strong>Echipa Insomnia Tattoo</strong>
      </p>
    </div>
  `;

  await sendMail({
    from: `"Insomnia Tattoo" <${process.env.SMTP_USER}>`,
    to: data.clientEmail,
    subject,
    html,
  });
}

export async function sendReviewRequest(data: {
  clientName: string;
  clientEmail: string;
  artistName: string;
  language: 'ro' | 'en';
}): Promise<void> {
  const isRo = data.language === 'ro';

  const subject = isRo
    ? `Cum arata tatuajul tau? — Insomnia Tattoo`
    : `How does your tattoo look? — Insomnia Tattoo`;

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0A; color: #F5F5F5; padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; color: #B0B0B0; font-size: 28px; margin: 0;">
          Insomnia Tattoo
        </h1>
      </div>

      <p style="font-size: 16px; line-height: 1.6;">
        ${isRo ? `Salut ${escapeHtml(data.clientName)}!` : `Hi ${escapeHtml(data.clientName)}!`}
      </p>

      <p style="font-size: 16px; line-height: 1.6; color: #A0A0A0;">
        ${
          isRo
            ? `A trecut o luna de la sesiunea ta cu ${data.artistName}. Tatuajul tau ar trebui sa fie complet vindecat acum!`
            : `It's been a month since your session with ${escapeHtml(data.artistName)}. Your tattoo should be fully healed by now!`
        }
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <p style="font-size: 16px; color: #F5F5F5; margin-bottom: 15px;">
          ${isRo ? 'Ai fost multumit de experienta?' : 'Were you satisfied with your experience?'}
        </p>
        <a href="https://g.page/r/insomniatattoo/review" style="display: inline-block; background-color: #B0B0B0; color: #0A0A0A; padding: 12px 30px; text-decoration: none; border-radius: 4px; font-weight: bold; font-size: 14px;">
          ${isRo ? '⭐ Lasa un review pe Google' : '⭐ Leave a Google Review'}
        </a>
      </div>

      <p style="font-size: 14px; color: #A0A0A0; text-align: center;">
        ${
          isRo
            ? 'Review-ul tau ne ajuta enorm si dureaza doar 30 de secunde. Multumim!'
            : 'Your review helps us a lot and only takes 30 seconds. Thank you!'
        }
      </p>

      <hr style="border: none; border-top: 1px solid #2A2A2A; margin: 30px 0;" />

      <p style="font-size: 14px; color: #A0A0A0; text-align: center;">
        ${
          isRo
            ? `Pregatit pentru urmatorul tatuaj? <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://insomniatattoo.ro'}/booking" style="color: #B0B0B0;">Programeaza acum</a>`
            : `Ready for your next tattoo? <a href="${process.env.NEXT_PUBLIC_SITE_URL || 'https://insomniatattoo.ro'}/booking" style="color: #B0B0B0;">Book now</a>`
        }
      </p>

      <p style="font-size: 13px; color: #666666; text-align: center; margin-top: 20px;">
        ${isRo ? 'Cu drag,' : 'Best regards,'}<br />
        <strong>Echipa Insomnia Tattoo</strong>
      </p>
    </div>
  `;

  await sendMail({
    from: `"Insomnia Tattoo" <${process.env.SMTP_USER}>`,
    to: data.clientEmail,
    subject,
    html,
  });
}

export async function sendBookingNotification(
  data: BookingEmailData,
): Promise<void> {
  const referenceImages = (data.referenceImages || []).filter(
    (url) => typeof url === 'string' && /^https?:\/\//.test(url),
  );

  const referenceBlock =
    referenceImages.length > 0
      ? `
        <div style="margin: 20px 0; padding: 16px; background-color: #fafafa; border-radius: 4px; border: 1px solid #eee;">
          <p style="margin: 0 0 12px 0; font-size: 13px; font-weight: bold; color: #444;">Imagini de referinta urcate de client (${referenceImages.length})</p>
          <table style="border-collapse: collapse;">
            <tr>
              ${referenceImages
                .map(
                  (url) => `
                  <td style="padding: 4px;">
                    <a href="${url}" target="_blank" rel="noopener noreferrer">
                      <img src="${url}" alt="Referinta" width="120" height="120" style="display: block; width: 120px; height: 120px; object-fit: cover; border-radius: 4px; border: 1px solid #ddd;" />
                    </a>
                  </td>`,
                )
                .join('')}
            </tr>
          </table>
          <p style="margin: 12px 0 0 0; font-size: 12px; color: #888;">Click pe orice imagine pentru a o deschide la dimensiune completa. Tine de tine aceste linkuri private; nu le distribui in afara echipei.</p>
        </div>`
      : '';

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #B0B0B0;">Booking nou — ${escapeHtml(data.clientName)}</h2>

      <p>Ai o cerere noua de consultatie!</p>

      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Client</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.clientName)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Telefon</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.clientPhone || '-')}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Email</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.clientEmail)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Zona</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.bodyArea || '-')}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Dimensiune</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.size || '-')}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Stil</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.style || '-')}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Data</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.date)} la ${escapeHtml(data.time)}</td></tr>
        <tr><td style="padding: 8px; border-bottom: 1px solid #eee; font-weight: bold;">Sursa</td><td style="padding: 8px; border-bottom: 1px solid #eee;">${escapeHtml(data.source || '-')}</td></tr>
      </table>

      ${data.description ? `<p><strong>Descriere:</strong><br/>${escapeHtml(data.description)}</p>` : ''}

      ${referenceBlock}

      <p style="color: #666;">Cod referinta: ${data.referenceCode}</p>
      <p>&rarr; Intra in admin panel pentru detalii complete.</p>
    </div>
  `;

  await sendMail({
    from: `"Insomnia Tattoo" <${process.env.SMTP_USER}>`,
    to: data.artistEmail,
    subject: `Booking nou — ${data.clientName}`,
    html,
  });
}

// --- Loyalty surprise notification (to admin) ---

export async function sendSurpriseNotification(data: {
  clientName: string;
  clientEmail: string;
  totalPoints: number;
}): Promise<void> {
  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;
  if (!adminEmail) return;

  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #B0B0B0;">🎁 Surpriză loyalty — ${escapeHtml(data.clientName)}</h2>

      <p><strong>${escapeHtml(data.clientName)}</strong> (${escapeHtml(data.clientEmail)}) a ajuns la <strong>${data.totalPoints} puncte</strong> de fidelitate!</p>

      <div style="background: #1a1a1a; border-left: 3px solid #B0B0B0; padding: 15px; margin: 20px 0; border-radius: 4px;">
        <p style="margin: 0; color: #e0e0e0;">Conform programului de fidelitate, acest client este eligibil pentru o <strong>surpriză</strong> din partea salonului.</p>
        <p style="margin: 10px 0 0; color: #999;">Optiuni: tatuaj mic gratuit, merch, discount, etc.</p>
      </div>

      <p>→ Intra in <strong>Admin Panel → Loyalty</strong> pentru a acorda surpriza.</p>
    </div>
  `;

  await sendMail({
    from: `"Insomnia Tattoo" <${process.env.SMTP_USER}>`,
    to: adminEmail,
    subject: `🎁 Client eligibil surpriză: ${data.clientName} (${data.totalPoints} puncte)`,
    html,
  });
}

export async function sendBookingCancellationEmail(data: {
  artistName: string;
  artistEmail: string;
  clientName: string;
  referenceCode: string;
  consultationDate: string;
}): Promise<void> {
  if (!data.artistEmail) return;

  const adminEmail = process.env.ADMIN_EMAIL || process.env.SMTP_USER;

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0A; color: #F5F5F5; padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; color: #B0B0B0; font-size: 28px; margin: 0;">
          Insomnia Tattoo
        </h1>
      </div>

      <div style="background-color: #1A1A1A; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 3px solid #EF4444;">
        <p style="font-size: 16px; font-weight: bold; color: #EF4444; margin: 0 0 10px 0;">
          Programare anulata de client
        </p>
        <p style="font-size: 15px; color: #A0A0A0; margin: 5px 0;">
          Client: <strong style="color: #F5F5F5;">${escapeHtml(data.clientName)}</strong>
        </p>
        <p style="font-size: 15px; color: #A0A0A0; margin: 5px 0;">
          Cod referinta: <strong style="color: #B0B0B0;">${data.referenceCode}</strong>
        </p>
        <p style="font-size: 15px; color: #A0A0A0; margin: 5px 0;">
          Data consultatie: <strong style="color: #F5F5F5;">${data.consultationDate}</strong>
        </p>
      </div>

      <p style="font-size: 14px; color: #666666;">
        Clientul a anulat aceasta programare din portalul sau. Slotul este acum disponibil.
      </p>

      <hr style="border: none; border-top: 1px solid #2A2A2A; margin: 30px 0;" />

      <p style="font-size: 13px; color: #666666; text-align: center;">
        <strong>Insomnia Tattoo</strong> — Admin Panel
      </p>
    </div>
  `;

  const recipients = [data.artistEmail];
  if (adminEmail && adminEmail !== data.artistEmail) {
    recipients.push(adminEmail);
  }

  await sendMail({
    from: `"Insomnia Tattoo" <${process.env.SMTP_USER}>`,
    to: recipients.join(', '),
    subject: `Programare anulata — ${data.clientName} (${data.referenceCode})`,
    html,
  });
}

export async function sendEmailVerification(data: {
  email: string;
  name: string;
  verifyUrl: string;
}): Promise<void> {
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0A; color: #F5F5F5; padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; color: #B0B0B0; font-size: 28px; margin: 0;">
          Insomnia Tattoo
        </h1>
      </div>

      <p style="font-size: 16px; line-height: 1.6;">Salut ${escapeHtml(data.name)}!</p>

      <p style="font-size: 16px; line-height: 1.6; color: #A0A0A0;">
        Multumim ca ti-ai creat cont pe Insomnia Tattoo. Apasa butonul de mai jos pentru a verifica adresa de email:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.verifyUrl}" style="display: inline-block; padding: 14px 32px; background-color: #B0B0B0; color: #0A0A0A; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 4px;">
          Verifica email-ul
        </a>
      </div>

      <p style="font-size: 14px; color: #666666;">
        Link-ul expira in 24 de ore. Daca nu ai creat un cont, ignora acest email.
      </p>

      <hr style="border: none; border-top: 1px solid #2A2A2A; margin: 30px 0;" />

      <p style="font-size: 13px; color: #666666; text-align: center;">
        Cu drag,<br />
        <strong>Echipa Insomnia Tattoo</strong>
      </p>
    </div>
  `;

  await sendMail({
    from: `"Insomnia Tattoo" <${process.env.SMTP_USER}>`,
    to: data.email,
    subject: 'Verifica adresa de email — Insomnia Tattoo',
    html,
  });
}

export async function sendPasswordResetEmail(data: {
  email: string;
  name: string;
  resetUrl: string;
}): Promise<void> {
  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0A; color: #F5F5F5; padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; color: #B0B0B0; font-size: 28px; margin: 0;">
          Insomnia Tattoo
        </h1>
      </div>

      <p style="font-size: 16px; line-height: 1.6;">Salut ${escapeHtml(data.name)}!</p>

      <p style="font-size: 16px; line-height: 1.6; color: #A0A0A0;">
        Am primit o cerere de resetare a parolei pentru contul tau. Apasa butonul de mai jos pentru a seta o parola noua:
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.resetUrl}" style="display: inline-block; padding: 14px 32px; background-color: #B0B0B0; color: #0A0A0A; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 4px;">
          Reseteaza parola
        </a>
      </div>

      <p style="font-size: 14px; color: #666666;">
        Link-ul expira in 1 ora. Daca nu ai solicitat aceasta resetare, ignora acest email.
      </p>

      <hr style="border: none; border-top: 1px solid #2A2A2A; margin: 30px 0;" />

      <p style="font-size: 13px; color: #666666; text-align: center;">
        Cu drag,<br />
        <strong>Echipa Insomnia Tattoo</strong>
      </p>
    </div>
  `;

  await sendMail({
    from: `"Insomnia Tattoo" <${process.env.SMTP_USER}>`,
    to: data.email,
    subject: 'Resetare parola — Insomnia Tattoo',
    html,
  });
}

// ─── Welcome Email for Booking-Created Account ──────────────────────────────

/**
 * Sent right after a guest booking when the user opted in to "save my
 * appointments to a new account". The link drops them into the password-reset
 * page where they finish setup.
 */
export async function sendBookingAccountWelcomeEmail(data: {
  email: string;
  name: string;
  setupUrl: string;
  language: 'ro' | 'en';
}): Promise<void> {
  const isRo = data.language === 'ro';

  const subject = isRo
    ? 'Contul tau Insomnia Tattoo e gata sa-l activezi'
    : 'Your Insomnia Tattoo account is ready to activate';

  const intro = isRo
    ? `Ai rezervat o sedinta la Insomnia Tattoo si ai ales sa-ti pastrezi programarile in cont. Ti-am creat unul si trebuie doar sa setezi o parola pentru a-l activa.`
    : `You booked a session at Insomnia Tattoo and chose to keep your appointments in an account. We created one for you — just set a password to activate it.`;

  const cta = isRo ? 'Seteaza parola' : 'Set password';

  const expiry = isRo
    ? 'Link-ul expira in 1 ora. Daca nu ai cerut acest cont, ignora emailul.'
    : 'The link expires in 1 hour. If you didn\'t request this, just ignore this email.';

  const signoff = isRo
    ? 'Cu drag,<br /><strong>Echipa Insomnia Tattoo</strong>'
    : 'With love,<br /><strong>The Insomnia Tattoo team</strong>';

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0A; color: #F5F5F5; padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; color: #B0B0B0; font-size: 28px; margin: 0;">
          Insomnia Tattoo
        </h1>
      </div>

      <p style="font-size: 16px; line-height: 1.6;">${isRo ? 'Salut' : 'Hi'} ${escapeHtml(data.name)}!</p>

      <p style="font-size: 16px; line-height: 1.6; color: #A0A0A0;">${intro}</p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${data.setupUrl}" style="display: inline-block; padding: 14px 32px; background-color: #B0B0B0; color: #0A0A0A; text-decoration: none; font-weight: 600; font-size: 15px; border-radius: 4px;">
          ${cta}
        </a>
      </div>

      <p style="font-size: 14px; color: #666666;">${expiry}</p>

      <hr style="border: none; border-top: 1px solid #2A2A2A; margin: 30px 0;" />

      <p style="font-size: 13px; color: #666666; text-align: center;">${signoff}</p>
    </div>
  `;

  await sendMail({
    from: `"Insomnia Tattoo" <${process.env.SMTP_USER}>`,
    to: data.email,
    subject,
    html,
  });
}

// ─── Guest GDPR data erasure (email confirmation) ───────────────────────────

export async function sendGuestDataErasureEmail(data: {
  email: string;
  confirmUrl: string;
  language: 'ro' | 'en';
}): Promise<void> {
  const isRo = data.language === 'ro';

  const subject = isRo
    ? 'Confirma stergerea datelor — Insomnia Tattoo'
    : 'Confirm data erasure — Insomnia Tattoo';

  const intro = isRo
    ? `Am primit o cerere de anonimizare a datelor personale pentru adresa ${escapeHtml(data.email)}, asociata cu programari facute fara cont pe site.`
    : `We received a request to anonymize personal data for ${escapeHtml(data.email)} from guest bookings made without an account.`;

  const expl = isRo
    ? 'Daca tu ai facut cererea, apasa butonul de mai jos. Dupa confirmare, numele, telefonul, emailul, descrierea si imaginile de referinta din aceste programari vor fi sterse sau inlocuite cu valori anonime. Păstrăm datele strict necesare pentru evidenta interna a studioului (ex: data, artist, status).'
    : 'If you made this request, click the button below. After confirmation, name, phone, email, description, and reference images for those guest bookings will be removed or replaced with anonymous values. We retain only what the studio needs for internal records (e.g. date, artist, status).';

  const cta = isRo ? 'Confirma anonimizarea' : 'Confirm anonymization';

  const expiry = isRo
    ? 'Link-ul expira in 24 de ore. Daca nu ai cerut asta, ignora acest email.'
    : 'This link expires in 24 hours. If you did not request this, ignore this email.';

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0A; color: #F5F5F5; padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; color: #B0B0B0; font-size: 24px; margin: 0;">
          Insomnia Tattoo
        </h1>
      </div>
      <p style="font-size: 15px; line-height: 1.6; color: #A0A0A0;">${intro}</p>
      <p style="font-size: 15px; line-height: 1.6; color: #A0A0A0;">${expl}</p>
      <div style="text-align: center; margin: 28px 0;">
        <a href="${escapeHtml(data.confirmUrl)}" style="display: inline-block; padding: 14px 28px; background-color: #B0B0B0; color: #0A0A0A; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 4px;">
          ${cta}
        </a>
      </div>
      <p style="font-size: 13px; color: #666666;">${expiry}</p>
      <hr style="border: none; border-top: 1px solid #2A2A2A; margin: 24px 0;" />
      <p style="font-size: 12px; color: #666666; text-align: center;">
        <strong>Echipa Insomnia Tattoo</strong> · contact@insomniatattoo.ro
      </p>
    </div>
  `;

  await sendMail({
    from: `"Insomnia Tattoo" <${process.env.SMTP_USER}>`,
    to: data.email,
    subject,
    html,
  });
}

// ─── Booking Status Update Email (to client) ────────────────────────────────

export async function sendBookingStatusUpdateEmail(data: {
  clientName: string;
  clientEmail: string;
  artistName: string;
  referenceCode: string;
  newStatus: string;
  consultationDate?: string;
  consultationTime?: string;
  adminNotes?: string;
  language: 'ro' | 'en';
}): Promise<void> {
  const isRo = data.language === 'ro';
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://insomniatattoo.ro';

  const statusLabels: Record<string, { ro: string; en: string; emoji: string; color: string }> = {
    contacted: { ro: 'Te-am contactat', en: "We've reached out", emoji: '📞', color: '#3B82F6' },
    confirmed: { ro: 'Programare confirmata', en: 'Booking confirmed', emoji: '✅', color: '#22C55E' },
    completed: { ro: 'Sedinta finalizata', en: 'Session completed', emoji: '🖤', color: '#A855F7' },
    cancelled: { ro: 'Programare anulata', en: 'Booking cancelled', emoji: '❌', color: '#EF4444' },
    no_show: { ro: 'Nu te-ai prezentat', en: 'Missed appointment', emoji: '⚠️', color: '#F59E0B' },
  };

  const status = statusLabels[data.newStatus];
  if (!status) return; // Don't email for 'new' (first status, client already got confirmation)

  const subject = isRo
    ? `${status.emoji} ${status.ro} — Insomnia Tattoo`
    : `${status.emoji} ${status.en} — Insomnia Tattoo`;

  const statusMessages: Record<string, { ro: string; en: string }> = {
    contacted: {
      ro: `Am primit cererea ta si te-am contactat. Verifica telefonul si email-ul pentru detalii.`,
      en: `We've received your request and reached out. Check your phone and email for details.`,
    },
    confirmed: {
      ro: `Programarea ta cu <strong style="color: #B0B0B0;">${escapeHtml(data.artistName)}</strong> este confirmata!`,
      en: `Your appointment with <strong style="color: #B0B0B0;">${escapeHtml(data.artistName)}</strong> is confirmed!`,
    },
    completed: {
      ro: `Sedinta ta cu <strong style="color: #B0B0B0;">${escapeHtml(data.artistName)}</strong> a fost finalizata! Multumim ca ai ales Insomnia Tattoo. Vei primi sfaturi de aftercare in curand.`,
      en: `Your session with <strong style="color: #B0B0B0;">${escapeHtml(data.artistName)}</strong> is complete! Thank you for choosing Insomnia Tattoo. You'll receive aftercare tips soon.`,
    },
    cancelled: {
      ro: `Din pacate, programarea ta a fost anulata.`,
      en: `Unfortunately, your booking has been cancelled.`,
    },
    no_show: {
      ro: `Am observat ca nu te-ai prezentat la programare. Daca ai o urgenta, contacteaza-ne.`,
      en: `We noticed you missed your appointment. If something came up, please contact us.`,
    },
  };

  const dateBlock =
    data.newStatus === 'confirmed' && data.consultationDate
      ? `<div style="background-color: #1A1A1A; border-radius: 8px; padding: 20px; margin: 20px 0; border-left: 3px solid ${status.color};">
          <p style="margin: 8px 0; font-size: 15px;">📅 ${isRo ? 'Data' : 'Date'}: <strong>${escapeHtml(data.consultationDate)}</strong></p>
          ${data.consultationTime ? `<p style="margin: 8px 0; font-size: 15px;">🕐 ${isRo ? 'Ora' : 'Time'}: <strong>${escapeHtml(data.consultationTime)}</strong></p>` : ''}
          <p style="margin: 8px 0; font-size: 15px;">📍 Insomnia Tattoo, Str. D10, Nr. 11 Bis, Ap. 2, Mamaia Nord, Constanta</p>
        </div>`
      : '';

  const notesBlock =
    data.adminNotes
      ? `<div style="background-color: #1A1A1A; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p style="font-size: 13px; color: #A0A0A0; margin: 0 0 8px 0;">${isRo ? 'Nota de la echipa:' : 'Note from the team:'}</p>
          <p style="font-size: 14px; color: #F5F5F5; margin: 0; line-height: 1.6;">${escapeHtml(data.adminNotes)}</p>
        </div>`
      : '';

  const html = `
    <div style="font-family: 'Inter', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0A; color: #F5F5F5; padding: 40px 30px;">
      <div style="text-align: center; margin-bottom: 30px;">
        <h1 style="font-family: 'Playfair Display', Georgia, serif; color: #B0B0B0; font-size: 28px; margin: 0;">
          Insomnia Tattoo
        </h1>
      </div>

      <p style="font-size: 16px; line-height: 1.6;">
        ${isRo ? `Salut ${escapeHtml(data.clientName)}!` : `Hi ${escapeHtml(data.clientName)}!`}
      </p>

      <div style="text-align: center; margin: 24px 0;">
        <span style="display: inline-block; padding: 8px 20px; border-radius: 4px; font-size: 15px; font-weight: bold; color: ${status.color}; background-color: ${status.color}15; border: 1px solid ${status.color}40;">
          ${status.emoji} ${isRo ? status.ro : status.en}
        </span>
      </div>

      <p style="font-size: 16px; line-height: 1.6; color: #A0A0A0;">
        ${statusMessages[data.newStatus]?.[isRo ? 'ro' : 'en'] || ''}
      </p>

      ${dateBlock}
      ${notesBlock}

      <p style="font-size: 14px; color: #666666; margin-top: 20px;">
        ${isRo ? 'Cod referinta' : 'Reference code'}: <strong style="color: #B0B0B0;">${escapeHtml(data.referenceCode)}</strong>
      </p>

      <div style="text-align: center; margin: 30px 0;">
        <a href="${siteUrl}/account/bookings" style="display: inline-block; padding: 12px 28px; background-color: #B0B0B0; color: #0A0A0A; text-decoration: none; font-weight: 600; font-size: 14px; border-radius: 4px;">
          ${isRo ? 'Vezi programarile tale' : 'View your bookings'}
        </a>
      </div>

      <hr style="border: none; border-top: 1px solid #2A2A2A; margin: 30px 0;" />

      <p style="font-size: 13px; color: #666666; text-align: center;">
        ${isRo ? 'Cu drag,' : 'Best regards,'}<br />
        <strong>Echipa Insomnia Tattoo</strong>
      </p>
    </div>
  `;

  await sendMail({
    from: `"Insomnia Tattoo" <${process.env.SMTP_USER}>`,
    to: data.clientEmail,
    subject,
    html,
  });
}

// ─── Contact Form Email ──────────────────────────────────────────────────────

interface ContactFormEmailData {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

export async function sendContactFormEmail(data: ContactFormEmailData) {
  const safeName = escapeHtml(data.name);
  const safeEmail = escapeHtml(data.email);
  const safePhone = data.phone ? escapeHtml(data.phone) : '—';
  const safeMessage = escapeHtml(data.message).replace(/\n/g, '<br />');

  const html = `
    <div style="font-family: 'Helvetica Neue', Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #0A0A0A; color: #F5F5F5; padding: 32px;">
      <h1 style="font-size: 22px; margin-bottom: 24px; color: #B0B0B0;">
        Mesaj nou de pe site
      </h1>
      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #2A2A2A; color: #A0A0A0; width: 120px;">Nume</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #2A2A2A;">${safeName}</td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #2A2A2A; color: #A0A0A0;">Email</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #2A2A2A;"><a href="mailto:${safeEmail}" style="color: #B0B0B0;">${safeEmail}</a></td>
        </tr>
        <tr>
          <td style="padding: 10px 12px; border-bottom: 1px solid #2A2A2A; color: #A0A0A0;">Telefon</td>
          <td style="padding: 10px 12px; border-bottom: 1px solid #2A2A2A;">${safePhone}</td>
        </tr>
      </table>
      <div style="margin-top: 20px; padding: 16px; background-color: #1A1A1A; border-radius: 4px;">
        <p style="font-size: 13px; color: #A0A0A0; margin-bottom: 8px;">Mesaj:</p>
        <p style="font-size: 14px; line-height: 1.6;">${safeMessage}</p>
      </div>
    </div>
  `;

  await sendMail({
    from: `"Insomnia Tattoo" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL || process.env.SMTP_USER || 'contact@insomniatattoo.ro',
    replyTo: data.email,
    subject: `Mesaj contact: ${data.name}`,
    html,
  });
}
