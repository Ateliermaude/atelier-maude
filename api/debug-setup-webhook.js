import Stripe from 'stripe';

// TEMPORARY — registers the Stripe webhook endpoint for this account via
// the API instead of the Dashboard, and returns the signing secret once.
// Delete this file right after retrieving the secret.
const WEBHOOK_URL = 'https://ateliermaude.com/api/webhook';
const ENABLED_EVENTS = ['checkout.session.completed'];

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'server_config_error' });
  }

  const stripe = new Stripe(secretKey);

  try {
    const existing = await stripe.webhookEndpoints.list({ limit: 100 });
    const already = existing.data.find((e) => e.url === WEBHOOK_URL);

    if (already) {
      return res.status(200).json({
        created: false,
        message: 'A webhook endpoint for this URL already exists on this account.',
        id: already.id,
        url: already.url,
        status: already.status,
        enabledEvents: already.enabled_events,
      });
    }

    const endpoint = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: ENABLED_EVENTS,
    });

    return res.status(200).json({
      created: true,
      id: endpoint.id,
      url: endpoint.url,
      status: endpoint.status,
      enabledEvents: endpoint.enabled_events,
      secret: endpoint.secret,
    });
  } catch (err) {
    return res.status(500).json({ error: 'stripe_error', message: err.message, type: err.type });
  }
}
