import Stripe from 'stripe';

// TEMPORARY diagnostic endpoint — lists active Stripe prices with their
// product names, to reconcile against api/checkout.js's PRICE_IDS mapping.
// Delete this file once the mapping has been corrected.
export default async function handler(req, res) {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    return res.status(500).json({ error: 'server_config_error' });
  }

  const stripe = new Stripe(secretKey);

  try {
    const prices = await stripe.prices.list({
      active: true,
      limit: 100,
      expand: ['data.product'],
    });

    const result = prices.data.map((p) => ({
      priceId: p.id,
      amount: p.unit_amount,
      currency: p.currency,
      productId: typeof p.product === 'string' ? p.product : p.product.id,
      productName: typeof p.product === 'string' ? null : p.product.name,
      productActive: typeof p.product === 'string' ? null : p.product.active,
    }));

    return res.status(200).json({ livemode: prices.data[0]?.livemode ?? null, count: result.length, prices: result });
  } catch (err) {
    return res.status(500).json({ error: 'stripe_error', message: err.message, type: err.type });
  }
}
