import Stripe from 'stripe';

// This API route creates a Stripe Checkout session for a recurring
// subscription. It expects environment variables STRIPE_SECRET_KEY and
// STRIPE_PRICE_ID to be defined. The client can then redirect to the returned
// URL to complete the checkout. On success or failure, the user is
// redirected back to the plans page.
export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    res.status(405).end('Method Not Allowed');
    return;
  }
  const stripeSecret = process.env.STRIPE_SECRET_KEY;
  const priceId = process.env.STRIPE_PRICE_ID;
  if (!stripeSecret || !priceId) {
    res.status(500).json({ error: 'Stripe not configured' });
    return;
  }
  const stripe = new Stripe(stripeSecret);
  try {
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.origin}/plans?status=success`,
      cancel_url: `${req.headers.origin}/plans?status=cancelled`,
    });
    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
}