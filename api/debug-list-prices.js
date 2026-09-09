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
    const [allPrices, allProducts, account] = await Promise.all([
      stripe.prices.list({ limit: 100, expand: ['data.product'] }),
      stripe.products.list({ limit: 100 }),
      stripe.accounts.retrieve().catch((e) => ({ error: e.message })),
    ]);

    const prices = allPrices.data.map((p) => ({
      priceId: p.id,
      active: p.active,
      livemode: p.livemode,
      amount: p.unit_amount,
      currency: p.currency,
      productId: typeof p.product === 'string' ? p.product : p.product.id,
      productName: typeof p.product === 'string' ? null : p.product.name,
      productActive: typeof p.product === 'string' ? null : p.product.active,
    }));

    const products = allProducts.data.map((prod) => ({
      productId: prod.id,
      name: prod.name,
      active: prod.active,
    }));

    return res.status(200).json({
      accountId: account.id ?? account.error ?? null,
      priceCount: prices.length,
      prices,
      productCount: products.length,
      products,
    });
  } catch (err) {
    return res.status(500).json({ error: 'stripe_error', message: err.message, type: err.type });
  }
}
