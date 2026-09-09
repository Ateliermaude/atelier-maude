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
    const session = event.data.object;
    console.log('Checkout session completed:', {
      sessionId: session.id,
      product: session.metadata?.product ?? 'unknown',
      customerEmail: session.customer_details?.email ?? session.customer_email ?? 'unknown',
      amountTotal: session.amount_total,
      currency: session.currency,
    });
    // TODO: send the order confirmation email from here in a future step.
  }

  return res.status(200).json({ received: true });
}
