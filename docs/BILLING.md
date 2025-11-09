# Billing & Token System Documentation

## Overview

The billing system integrates Stripe Checkout and Customer Portal to enable users to purchase token packs and manage subscriptions. All token transactions are tracked in a secure ledger with idempotency guarantees.

## Architecture

### Components

1. **Next.js API Routes** (`web/app/api/billing/`)
   - `create-checkout-session` - Creates Stripe Checkout sessions
   - `create-portal-session` - Creates Stripe Customer Portal sessions

2. **Token Management** (`web/app/api/tokens/`)
   - `balance` - Get current token balance
   - `ledger` - Get transaction history

3. **Stripe Webhook** (`web/app/api/webhooks/stripe/`)
   - Handles Stripe events and credits tokens
   - Maintains idempotency via `stripeEventId`

4. **Admin Endpoints** (`web/app/api/admin/tokens/`)
   - `credit` - Manual token credits (admin only)

5. **Database Models** (Prisma)
   - `BillingCustomer` - Maps users to Stripe customers
   - `TokenLedger` - Transaction history
   - `TokenBalance` - Current balances

## Environment Variables

### Required

```env
STRIPE_SECRET_KEY=sk_test_...           # Stripe secret key
STRIPE_WEBHOOK_SECRET=whsec_...         # Webhook signing secret
STRIPE_PUBLISHABLE_KEY=pk_test_...      # Stripe publishable key

# Stripe Price IDs (create in Stripe Dashboard)
STRIPE_PRICE_TOKENS_SMALL=price_...
STRIPE_PRICE_TOKENS_MEDIUM=price_...
STRIPE_PRICE_TOKENS_LARGE=price_...
STRIPE_PRICE_SUBSCRIPTION_STARTER=price_...  # Optional

# Billing URLs
BILLING_RETURN_URL=https://promptbloom.app/app/billing
BILLING_CANCEL_URL=https://promptbloom.app/app/billing?canceled=1
SITE_URL=https://promptbloom.app

# Database
DATABASE_URL=postgresql://...
```

### Optional

```env
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_GA_ID=G-XXXXXXX
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=promptbloom.app
```

## Price → Token Mapping

The server maintains a single source of truth for price-to-token mappings:

```typescript
// web/lib/stripe.ts
export const TOKEN_MAP: Record<string, { tokens: number; label: string }> = {
  [process.env.STRIPE_PRICE_TOKENS_SMALL]: { tokens: 1000, label: "Small Pack" },
  [process.env.STRIPE_PRICE_TOKENS_MEDIUM]: { tokens: 5000, label: "Medium Pack" },
  [process.env.STRIPE_PRICE_TOKENS_LARGE]: { tokens: 12000, label: "Large Pack" },
};

export const SUBSCRIPTION_PRICE_MAP: Record<string, { monthlyTokens: number; label: string }> = {
  [process.env.STRIPE_PRICE_SUBSCRIPTION_STARTER]: { monthlyTokens: 6000, label: "Starter Monthly" },
};
```

**Important**: Never trust client-provided token amounts. Always map from server-side price IDs.

## Webhook Events Handled

### `checkout.session.completed`
- **Action**: Credits tokens for one-time purchases
- **Token Amount**: Mapped from `priceId` in session metadata
- **Idempotency**: Uses `event.id` as unique key

### `invoice.paid`
- **Action**: Credits monthly token allotment for subscriptions
- **Token Amount**: Mapped from subscription price ID
- **Frequency**: Monthly (on each invoice payment)

### `charge.refunded`
- **Action**: Deducts tokens associated with refunded charge
- **Amount**: Conservative deduction (doesn't go below zero)
- **Note**: Implement `inferRefundTokenAmount()` to trace original credit

### `customer.subscription.updated`
- **Action**: Logs subscription changes
- **Future**: Can trigger plan upgrades/downgrades

### `customer.subscription.deleted`
- **Action**: Logs subscription cancellation
- **Effect**: Future `invoice.paid` events won't credit tokens

## Security

### Authentication
- All billing endpoints require authenticated sessions
- Uses NextAuth session validation

### Rate Limiting
- Billing endpoints: 5 requests/minute per user+IP
- In-memory rate limiter (use Redis in production)

### Idempotency
- Webhook events use `stripeEventId` as unique constraint
- Prevents double-crediting on retries

### Input Validation
- Zod schemas validate all request bodies
- Price IDs validated against server-side maps

### RBAC
- Admin endpoints check for admin role
- Default: email domain check (customize in `web/app/api/admin/tokens/credit/route.ts`)

## Database Schema

### BillingCustomer
```prisma
model BillingCustomer {
  id        String   @id @default(cuid())
  userId    String   @unique
  stripeId  String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### TokenLedger
```prisma
model TokenLedger {
  id            String   @id @default(cuid())
  userId        String
  delta         Int      // +credits, -debits
  reason        String
  source        String   // 'stripe_checkout', 'stripe_invoice', 'manual', 'consume', 'stripe_refund'
  stripeEventId String?  @unique
  meta          Json?
  createdAt     DateTime @default(now())
}
```

### TokenBalance
```prisma
model TokenBalance {
  userId    String   @id
  balance   Int      @default(0)
  updatedAt DateTime @updatedAt
}
```

## Setup Steps

### 1. Install Dependencies

```bash
cd web
npm install
```

### 2. Set Up Prisma

```bash
# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# (Optional) Open Prisma Studio
npm run prisma:studio
```

### 3. Configure Stripe

1. **Create Products & Prices** in Stripe Dashboard:
   - Small Pack: 1000 tokens
   - Medium Pack: 5000 tokens
   - Large Pack: 12000 tokens
   - (Optional) Starter Subscription: 6000 tokens/month

2. **Copy Price IDs** to environment variables:
   - `STRIPE_PRICE_TOKENS_SMALL`
   - `STRIPE_PRICE_TOKENS_MEDIUM`
   - `STRIPE_PRICE_TOKENS_LARGE`
   - `STRIPE_PRICE_SUBSCRIPTION_STARTER`

3. **Create Webhook Endpoint**:
   - URL: `https://promptbloom.app/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `invoice.paid`, `charge.refunded`, `customer.subscription.updated`, `customer.subscription.deleted`
   - Copy webhook signing secret to `STRIPE_WEBHOOK_SECRET`

### 4. Configure Environment Variables

Add all required variables to:
- `.env.local` (local development)
- Vercel Dashboard → Environment Variables (production)

### 5. Test Webhook Locally

Use Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## API Endpoints

### POST `/api/billing/create-checkout-session`

Creates a Stripe Checkout session.

**Request:**
```json
{
  "priceId": "price_...",
  "quantity": 1
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/..."
}
```

### POST `/api/billing/create-portal-session`

Creates a Stripe Customer Portal session.

**Response:**
```json
{
  "url": "https://billing.stripe.com/..."
}
```

### GET `/api/tokens/balance`

Gets current token balance.

**Response:**
```json
{
  "balance": 5000
}
```

### GET `/api/tokens/ledger?limit=20`

Gets transaction history.

**Response:**
```json
[
  {
    "id": "...",
    "delta": 1000,
    "reason": "Small Pack",
    "source": "stripe_checkout",
    "createdAt": "2024-01-01T00:00:00Z"
  }
]
```

### POST `/api/admin/tokens/credit`

Manually credit tokens (admin only).

**Request:**
```json
{
  "userId": "...",
  "amount": 1000,
  "reason": "Manual credit"
}
```

## Troubleshooting

### Webhook Signature Verification Fails

- **Cause**: Raw body not preserved
- **Fix**: Ensure Next.js API route uses `req.text()` before parsing JSON
- **Check**: Webhook secret matches Stripe Dashboard

### Double Credits

- **Cause**: Webhook retries without idempotency
- **Fix**: Check `stripeEventId` unique constraint in database
- **Verify**: `TokenLedger.stripeEventId` is unique

### Tokens Not Credited

- **Check**: Webhook endpoint URL in Stripe Dashboard
- **Check**: Webhook events are enabled
- **Check**: Price ID mapping matches Stripe prices
- **Check**: Database connection and Prisma migrations

### Rate Limit Errors

- **Cause**: Too many requests
- **Fix**: Increase rate limit or use Redis-based limiter
- **Note**: Current limit: 5 requests/minute per user+IP

## Refund Policy

Refunds are handled conservatively:
- Original credit amount is traced via `chargeId` → `paymentIntentId` → ledger entry
- Deduction never takes balance below zero
- Refunded tokens are recorded with `source: 'stripe_refund'`

## Next Steps

1. **Set up Stripe products/prices** in Dashboard
2. **Create webhook endpoint** in Stripe Dashboard
3. **Run Prisma migrations** to create tables
4. **Test checkout flow** with Stripe test cards
5. **Monitor webhook logs** in Stripe Dashboard
6. **Set up admin RBAC** (customize admin check in `web/app/api/admin/tokens/credit/route.ts`)

## Support

For issues:
1. Check Stripe Dashboard → Webhooks → Logs
2. Check application logs for webhook processing errors
3. Verify environment variables are set correctly
4. Ensure Prisma migrations have run

