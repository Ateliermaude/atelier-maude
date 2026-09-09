import Stripe from 'stripe';

const PRICE_IDS = {
  'yun-court': 'price_1UDjgxQ3GhF5uGnWaNLi46kt',
  'hua-long': 'price_1UDjhJQ3GhF5uGnWPEO7z7OD',
  'yun-long': 'price_1UDjhiQ3GhF5uGnWMkCrMhMg',
  'echarpe-wen': 'price_1UDji0Q3GhF5uGnWFSO7ONQN',
  'ceinture-sha': 'price_1UDjiLQ3GhF5uGnWSrGseGcO',
  'ceinture-ze': 'price_1UDjieQ3GhF5uGnWFuSSQSKt',
};

const ALLOWED_HOSTS = new Set(['ateliermaude.com', 'www.ateliermaude.com']);
const DEFAULT_CANCEL_URL = 'https://ateliermaude.com/manteaux.html';
const SUCCESS_URL = 'https://ateliermaude.com/confirmation.html?session_id={CHECKOUT_SESSION_ID}';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { product, cancelUrl } = req.body ?? {};

  if (!product || typeof product !== 'string') {
    return res.status(400).json({ error: 'missing_product' });
  }

  const priceId = PRICE_IDS[product];
  if (!priceId) {
    return res.status(400).json({ error: 'unknown_product' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('Missing STRIPE_SECRET_KEY env var');
    return res.status(500).json({ error: 'server_config_error' });
  }

  // Only ever redirect back to a page on our own domain.
  let safeCancelUrl = DEFAULT_CANCEL_URL;
  if (typeof cancelUrl === 'string') {
    try {
      const parsed = new URL(cancelUrl);
      if (ALLOWED_HOSTS.has(parsed.hostname)) {
        safeCancelUrl = parsed.href;
      }
    } catch {
      // invalid URL, keep the default
    }
  }

  const stripe = new Stripe(secretKey);

  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: [{ price: priceId, quantity: 1 }],
      payment_method_types: ['card'],
      success_url: SUCCESS_URL,
      cancel_url: safeCancelUrl,
      metadata: { product },
    });

    return res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Stripe checkout session error:', err);
    // TEMPORARY DIAGNOSTIC — remove once the root cause is found, revert
    // to the generic { error: 'stripe_error' } response.
    return res.status(500).json({
      error: 'stripe_error',
      message: err.message,
      type: err.type,
      code: err.code,
    });
  }
}
