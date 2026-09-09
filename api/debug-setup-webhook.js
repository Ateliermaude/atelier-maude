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
    const stale = existing.data.filter((e) => e.url === WEBHOOK_URL);
    for (const e of stale) {
      await stripe.webhookEndpoints.del(e.id);
    }

    const endpoint = await stripe.webhookEndpoints.create({
      url: WEBHOOK_URL,
      enabled_events: ENABLED_EVENTS,
    });

    return res.status(200).json({
      recreated: true,
      deletedStaleIds: stale.map((e) => e.id),
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
