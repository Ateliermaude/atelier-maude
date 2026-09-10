import Stripe from 'stripe';

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'method_not_allowed' });
  }

  const { session_id: sessionId } = req.query ?? {};

  if (!sessionId || typeof sessionId !== 'string') {
    return res.status(400).json({ error: 'missing_session_id' });
  }

  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) {
    console.error('Missing STRIPE_SECRET_KEY env var');
    return res.status(500).json({ error: 'server_config_error' });
  }

  const stripe = new Stripe(secretKey);

  try {
    // `collected_information` (which holds shipping_details) is a plain top-level field on
    // the Checkout Session in this API version (stripe ^22.6.1), not an expandable relation,
    // so it comes back below without adding it to `expand`.
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product'],
    });

    const lineItem = session.line_items?.data?.[0];
    const product = lineItem?.price?.product;
    const shippingDetails = session.collected_information?.shipping_details;

    return res.status(200).json({
      email: session.customer_details?.email ?? session.customer_email ?? null,
      amountTotal: session.amount_total,
      currency: session.currency,
      productName: typeof product === 'object' && product !== null ? product.name : null,
      size: session.metadata?.size ?? null,
      shipping: shippingDetails ? {
        name: shippingDetails.name ?? null,
        line1: shippingDetails.address?.line1 ?? null,
        line2: shippingDetails.address?.line2 ?? null,
        postalCode: shippingDetails.address?.postal_code ?? null,
        city: shippingDetails.address?.city ?? null,
        country: shippingDetails.address?.country ?? null,
      } : null,
    });
  } catch (err) {
    console.error('Error retrieving checkout session:', err);
    return res.status(500).json({ error: 'stripe_error' });
  }
}
