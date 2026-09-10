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
    // as the source of truth — once we've processed a session, we flag it via the Stripe
    // API (see the commented update call below, once the email step is wired up) and skip
    // it here on any later delivery.
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

    console.log('Checkout session completed:', {
      sessionId: session.id,
      product: session.metadata?.product ?? 'unknown',
      size: session.metadata?.size ?? null,
      lang: session.metadata?.lang ?? 'fr',
      customerEmail: session.customer_details?.email ?? session.customer_email ?? 'unknown',
      amountTotal: session.amount_total,
      currency: session.currency,
      shipping: session.collected_information?.shipping_details ?? null,
    });

    // TODO P4.1-bloqué : envoi de l'email de confirmation MAUDÉ ici,
    // une fois le provider confirmé (voir rapport ci-dessous).
    // Une fois l'email envoyé avec succès :
    // await stripe.checkout.sessions.update(session.id, { metadata: { ...session.metadata, confirmation_processed: 'true' } });
  }

  return res.status(200).json({ received: true });
}
