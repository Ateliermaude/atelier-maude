import Stripe from 'stripe';

// Stripe signature verification needs the raw, unparsed request body.
export const config = {
  api: {
    bodyParser: false,
  },
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const PRODUCT_NAMES = {
  'hua-long': 'Manteau Huā Long',
  'yun-court': 'Yūn Court Ceinturé',
  'yun-long': 'Yūn Long Ceinturé',
  'ceinture-sha': 'Ceinture Shā',
  'ceinture-ze': 'Ceinture Zé',
  'echarpe-wen': 'Écharpe Wēn',
};

// Model names (Yūn, Huā, Wēn, Shā, Zé) stay untranslated on the English pages — only the
// generic "Manteau" word is dropped, matching en/index.html and en/lookbook.html.
const PRODUCT_NAMES_EN = {
  'hua-long': 'Huā Long',
  'yun-court': 'Yūn Court Ceinturé',
  'yun-long': 'Yūn Long Ceinturé',
  'ceinture-sha': 'Ceinture Shā',
  'ceinture-ze': 'Ceinture Zé',
  'echarpe-wen': 'Écharpe Wēn',
};

const DELAY_BY_PRODUCT = {
  'hua-long': '15 à 21 jours', 'yun-court': '15 à 21 jours', 'yun-long': '15 à 21 jours',
  'ceinture-sha': '8 à 15 jours', 'ceinture-ze': '8 à 15 jours', 'echarpe-wen': '8 à 15 jours',
};
const DELAY_BY_PRODUCT_EN = {
  'hua-long': '15 to 21 days', 'yun-court': '15 to 21 days', 'yun-long': '15 to 21 days',
  'ceinture-sha': '8 to 15 days', 'ceinture-ze': '8 to 15 days', 'echarpe-wen': '8 to 15 days',
};

function formatAmount(amountTotal, currency) {
  // Same formatting confirmation.html already uses in both languages — this site has
  // never lang-branched number formatting, so this doesn't invent a new convention.
  const formatted = (amountTotal / 100).toFixed(2).replace('.', ',');
  const symbol = currency?.toUpperCase() === 'EUR' ? '€' : (currency ?? '').toUpperCase();
  return `${formatted} ${symbol}`;
}

function buildAddressLines(shippingDetails) {
  // Same non-null guard logic as confirmation.html's shipping block: a line is only
  // added if the underlying field is actually present — never a blank/undefined line.
  if (!shippingDetails) return [];
  const lines = [];
  if (shippingDetails.name) lines.push(shippingDetails.name);
  const address = shippingDetails.address ?? {};
  if (address.line1) lines.push(address.line1);
  if (address.line2) lines.push(address.line2);
  const cityLine = [address.postal_code, address.city].filter(Boolean).join(' ');
  if (cityLine) lines.push(cityLine);
  if (address.country) lines.push(address.country);
  return lines;
}

function renderConfirmationHtml({ greeting, intro, received, productLine, amountLine, delayLine, addressHtml, shipNotice, contact, signoff }) {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:#FAF7F2;font-family:Georgia,'Times New Roman',serif;color:#3A2A1E">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FAF7F2">
      <tr>
        <td align="center" style="padding:40px 20px">
          <table role="presentation" width="100%" style="max-width:480px" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-family:Georgia,'Times New Roman',serif;font-size:14px;line-height:1.7;color:#3A2A1E">
                <p style="margin:0 0 20px">${greeting}</p>
                <p style="margin:0 0 20px">${intro}</p>
                <p style="margin:0 0 8px">${received}</p>
                <p style="margin:0 0 4px;font-size:17px">${productLine}</p>
                <p style="margin:0 0 20px">${amountLine}</p>
                <p style="margin:0 0 20px">${delayLine}</p>
                ${addressHtml}
                <p style="margin:0 0 20px">${shipNotice}</p>
                <p style="margin:0 0 20px">${contact}</p>
                <p style="margin:0">${signoff[0]}<br>${signoff[1]}<br>${signoff[2]}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function buildConfirmationEmail(session) {
  const lang = session.metadata?.lang === 'en' ? 'en' : 'fr';
  const product = session.metadata?.product ?? '';
  const size = session.metadata?.size ?? null;
  const amount = formatAmount(session.amount_total, session.currency);
  const shippingDetails = session.collected_information?.shipping_details ?? null;
  const addressLines = buildAddressLines(shippingDetails);

  if (lang === 'en') {
    const productName = PRODUCT_NAMES_EN[product] ?? product;
    const delay = DELAY_BY_PRODUCT_EN[product] ?? '';
    const productLine = size ? `${productName} — Size ${size}` : productName;
    const subject = 'Your Atelier MAUDÉ order';

    const textParts = [
      'Hello,', '', 'Thank you for your trust.', '', 'We have received your order:', '',
      productLine, `Amount paid: ${amount}`, '',
      `Each piece is made to order: please allow ${delay} before shipping, from our atelier in Suzhou.`,
    ];
    if (addressLines.length) {
      textParts.push('', 'It will be shipped to the following address:', addressLines.join('\n'));
    }
    textParts.push(
      '', 'You will receive another email as soon as your order ships.', '',
      'Any questions? Aude and Mathilde will reply within 48 hours, Monday to Friday — write to us at lateliermaude@gmail.com.',
      '', 'Thank you again,', 'Aude & Mathilde', 'Atelier MAUDÉ'
    );

    const addressHtml = addressLines.length
      ? `<p style="margin:0 0 20px">It will be shipped to the following address:<br>${addressLines.join('<br>')}</p>`
      : '';

    const html = renderConfirmationHtml({
      greeting: 'Hello,',
      intro: 'Thank you for your trust.',
      received: 'We have received your order:',
      productLine,
      amountLine: `Amount paid: ${amount}`,
      delayLine: `Each piece is made to order: please allow ${delay} before shipping, from our atelier in Suzhou.`,
      addressHtml,
      shipNotice: 'You will receive another email as soon as your order ships.',
      contact: 'Any questions? Aude and Mathilde will reply within 48 hours, Monday to Friday — write to us at <a href="mailto:lateliermaude@gmail.com" style="color:#3A2A1E">lateliermaude@gmail.com</a>.',
      signoff: ['Thank you again,', 'Aude &amp; Mathilde', 'Atelier MAUDÉ'],
    });

    return { subject, html, text: textParts.join('\n') };
  }

  const productName = PRODUCT_NAMES[product] ?? product;
  const delay = DELAY_BY_PRODUCT[product] ?? '';
  const productLine = size ? `${productName} — Taille ${size}` : productName;
  const subject = 'Votre commande Atelier MAUDÉ';

  const textParts = [
    'Bonjour,', '', 'Merci pour votre confiance.', '', 'Nous avons bien reçu votre commande :', '',
    productLine, `Montant réglé : ${amount}`, '',
    `Chaque pièce est confectionnée à la commande : c'est pourquoi il faut compter ${delay} avant expédition, depuis notre atelier à Suzhou.`,
  ];
  if (addressLines.length) {
    textParts.push('', "Elle sera envoyée à l'adresse suivante :", addressLines.join('\n'));
  }
  textParts.push(
    '', "Vous recevrez un nouveau message dès l'expédition de votre commande.", '',
    'Une question ? Nous vous répondrons personnellement, sous 48h, du lundi au vendredi — écrivez-nous à lateliermaude@gmail.com.',
    '', 'Merci encore,', 'Aude & Mathilde', 'Atelier MAUDÉ'
  );

  const addressHtml = addressLines.length
    ? `<p style="margin:0 0 20px">Elle sera envoyée à l'adresse suivante :<br>${addressLines.join('<br>')}</p>`
    : '';

  const html = renderConfirmationHtml({
    greeting: 'Bonjour,',
    intro: 'Merci pour votre confiance.',
    received: 'Nous avons bien reçu votre commande :',
    productLine,
    amountLine: `Montant réglé : ${amount}`,
    delayLine: `Chaque pièce est confectionnée à la commande : c'est pourquoi il faut compter ${delay} avant expédition, depuis notre atelier à Suzhou.`,
    addressHtml,
    shipNotice: "Vous recevrez un nouveau message dès l'expédition de votre commande.",
    contact: 'Une question ? Nous vous répondrons personnellement, sous 48h, du lundi au vendredi — écrivez-nous à <a href="mailto:lateliermaude@gmail.com" style="color:#3A2A1E">lateliermaude@gmail.com</a>.',
    signoff: ['Merci encore,', 'Aude &amp; Mathilde', 'Atelier MAUDÉ'],
  });

  return { subject, html, text: textParts.join('\n') };
}

async function sendConfirmationEmail({ to, lang, html, text, subject }) {
  const res = await fetch('https://api.mailersend.com/v1/email', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.MAILERSEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: { email: process.env.MAILERSEND_FROM_EMAIL, name: 'Atelier MAUDÉ' },
      to: [{ email: to }],
      subject,
      html,
      text,
    }),
  });
  if (!res.ok) {
    const errBody = await res.text();
    throw new Error(`MailerSend error ${res.status}: ${errBody}`);
  }
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!secretKey || !webhookSecret) {
    console.error('Missing STRIPE_SECRET_KEY or STRIPE_WEBHOOK_SECRET env var');
    return res.status(500).json({ error: 'server_config_error' });
  }

  const signature = req.headers['stripe-signature'];
  const stripe = new Stripe(secretKey);

  let event;
  try {
    const rawBody = await readRawBody(req);
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    console.error('Stripe webhook signature verification failed:', err.message);
    return res.status(400).json({ error: 'invalid_signature' });
  }

  if (event.type === 'checkout.session.completed') {
    // event.data.object is a snapshot of the Checkout Session. `collected_information`
    // (which holds shipping_details) is a plain top-level field on the Session object in
    // this API version (stripe ^22.6.1) — it is NOT an expandable relation, so it is
    // already present here without calling stripe.checkout.sessions.retrieve(). Note the
    // field lives at session.collected_information.shipping_details, not the older
    // session.shipping_details path used in some older Stripe examples/API versions.
    const session = event.data.object;

    // Idempotence without a database: Stripe retries this webhook on non-2xx responses
    // and can also redeliver the same event id later. We use the session's own metadata
    // as the source of truth — once the confirmation email has been sent, we flag it via
    // stripe.checkout.sessions.update() below and skip it here on any later delivery.
    // Honest limitation: this protects against the overwhelming majority of real-world
    // duplicate deliveries (retries are never millisecond-simultaneous), but it is not a
    // hard guarantee — two deliveries of the same event arriving in true parallel could
    // both read confirmation_processed as unset before either writes it back. Closing that
    // gap requires a lock/database this repo doesn't have; without one, this is the best
    // guarantee available and is documented here rather than silently assumed.
    if (session.metadata?.confirmation_processed === 'true') {
      console.log('Session already processed, skipping:', session.id);
      return res.status(200).json({ received: true, skipped: true });
    }

    const email = session.customer_details?.email ?? session.customer_email ?? null;

    if (!email) {
      console.error('No customer email available for session:', session.id);
      // No recipient to send to — nothing a retry would fix, so we accept the event
      // instead of making Stripe retry it forever.
      return res.status(200).json({ received: true, warning: 'no_email' });
    }

    const { subject, html, text } = buildConfirmationEmail(session);

    console.log('Checkout session completed:', {
      sessionId: session.id,
      product: session.metadata?.product ?? 'unknown',
      size: session.metadata?.size ?? null,
      lang: session.metadata?.lang ?? 'fr',
      customerEmail: email,
      amountTotal: session.amount_total,
      currency: session.currency,
      shipping: session.collected_information?.shipping_details ?? null,
    });

    try {
      await sendConfirmationEmail({ to: email, lang: session.metadata?.lang ?? 'fr', html, text, subject });

      await stripe.checkout.sessions.update(session.id, {
        metadata: { ...session.metadata, confirmation_processed: 'true' },
      });

      console.log('Confirmation email sent:', session.id);
    } catch (err) {
      // Never leak err.message to the client — it can contain internal MailerSend
      // details. Server logs only.
      console.error('Failed to send confirmation email:', session.id, err.message);
      // 500 triggers Stripe's own webhook retry (automatic backoff over several days) —
      // no homemade retry system, we rely on Stripe's.
      return res.status(500).json({ error: 'email_send_failed' });
    }
  }

  return res.status(200).json({ received: true });
}
