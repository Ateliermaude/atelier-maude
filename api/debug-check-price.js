import Stripe from 'stripe';

// TEMPORARY diagnostic — directly retrieves each expected Price ID from
// Stripe to confirm, one by one, whether it exists in the account behind
// STRIPE_SECRET_KEY. Delete once the mismatch is resolved.
const PRICE_IDS = {
  'yun-court': 'price_1UDjgxQ3GhF5uGnWaNLi46kt',
  'hua-long': 'price_1UDjhJQ3GhF5uGnWPEO7z7OD',
  'yun-long': 'price_1UDjhiQ3GhF5uGnWMkCrMhMg',
  'echarpe-wen': 'price_1UDji0Q3GhF5uGnWFSO7ONQN',
  'ceinture-sha': 'price_1UDjiLQ3GhF5uGnWSrGseGcO',
  'ceinture-ze': 'price_1UDjieQ3GhF5uGnWFuSSQSKt',
};

export default async function handler(req, res) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'server_config_error' });
  }

  const stripe = new Stripe(secretKey);
  const account = await stripe.accounts.retrieve().catch((e) => ({ error: e.message }));

  const results = {};
  for (const [slug, priceId] of Object.entries(PRICE_IDS)) {
    try {
      const price = await stripe.prices.retrieve(priceId, { expand: ['product'] });
      results[slug] = {
        found: true,
        priceId: price.id,
        active: price.active,
        livemode: price.livemode,
        amount: price.unit_amount,
        currency: price.currency,
        productName: typeof price.product === 'string' ? price.product : price.product.name,
      };
    } catch (err) {
      results[slug] = { found: false, priceId, error: err.message, type: err.type, code: err.code };
    }
  }

  return res.status(200).json({ accountId: account.id ?? account.error ?? null, results });
}
