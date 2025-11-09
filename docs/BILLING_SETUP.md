# Stripe Billing Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Set Up Prisma

```bash
# Generate Prisma client
npm run prisma:generate

# Create initial migration
npm run prisma:migrate -- --name init_billing

# (Optional) Open Prisma Studio to view data
npm run prisma:studio
```

### 3. Configure Stripe

#### Create Products & Prices

1. Go to [Stripe Dashboard](https://dashboard.stripe.com/products)
2. Create three products:
   - **Small Pack**: 1,000 tokens
   - **Medium Pack**: 5,000 tokens
   - **Large Pack**: 12,000 tokens
3. Create prices for each product (one-time payment)
4. Copy the Price IDs (starts with `price_...`)

#### Create Webhook Endpoint

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Set endpoint URL: `https://promptbloom.app/api/webhooks/stripe`
4. Select events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `charge.refunded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. Copy the signing secret (starts with `whsec_...`)

### 4. Set Environment Variables

Add to `.env.local` (development) and Vercel (production):

```env
# Stripe Keys
STRIPE_SECRET_KEY=sk_test_...           # From Stripe Dashboard → Developers → API keys
STRIPE_WEBHOOK_SECRET=whsec_...        # From webhook endpoint
STRIPE_PUBLISHABLE_KEY=pk_test_...     # From Stripe Dashboard → Developers → API keys

# Stripe Price IDs (from step 3)
STRIPE_PRICE_TOKENS_SMALL=price_...
STRIPE_PRICE_TOKENS_MEDIUM=price_...
STRIPE_PRICE_TOKENS_LARGE=price_...
STRIPE_PRICE_SUBSCRIPTION_STARTER=price_...  # Optional

# Billing URLs
BILLING_RETURN_URL=https://promptbloom.app/app/billing
BILLING_CANCEL_URL=https://promptbloom.app/app/billing?canceled=1
SITE_URL=https://promptbloom.app

# Database (must match your PostgreSQL connection)
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/soundfoundry
```

### 5. Test Locally

#### Test Webhook with Stripe CLI

```bash
# Install Stripe CLI: https://stripe.com/docs/stripe-cli
stripe login

# Forward webhooks to local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# In another terminal, trigger a test event
stripe trigger checkout.session.completed
```

#### Test Checkout Flow

1. Start dev server: `npm run dev`
2. Navigate to `/app/billing`
3. Click "Buy Now" on a token pack
4. Use Stripe test card: `4242 4242 4242 4242`
5. Complete checkout
6. Verify tokens are credited in database

## Verification Checklist

- [ ] Prisma migrations run successfully
- [ ] Stripe products and prices created
- [ ] Webhook endpoint configured in Stripe
- [ ] Environment variables set
- [ ] Test checkout completes successfully
- [ ] Tokens credited after payment
- [ ] Customer Portal accessible
- [ ] Transaction history displays correctly

## Next Steps

1. **Set up admin RBAC**: Customize admin check in `web/app/api/admin/tokens/credit/route.ts`
2. **Configure refund policy**: Implement `inferRefundTokenAmount()` in `web/lib/billing.ts`
3. **Add monitoring**: Set up alerts for webhook failures
4. **Test subscription flow**: Create subscription product and test monthly credits

## Troubleshooting

See [docs/BILLING.md](./BILLING.md) for detailed troubleshooting guide.

