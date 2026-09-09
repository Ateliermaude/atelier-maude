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
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['line_items.data.price.product'],
    });

    const lineItem = session.line_items?.data?.[0];
    const product = lineItem?.price?.product;

    return res.status(200).json({
      email: session.customer_details?.email ?? session.customer_email ?? null,
      amountTotal: session.amount_total,
      currency: session.currency,
      productName: typeof product === 'object' && product !== null ? product.name : null,
    });
  } catch (err) {
    console.error('Error retrieving checkout session:', err);
    return res.status(500).json({ error: 'stripe_error' });
  }
}
