# Stripe Billing Implementation Summary

## ✅ Implementation Complete

### Created/Modified Files

#### Database Schema
- ✅ `web/prisma/schema.prisma` - Prisma schema with BillingCustomer, TokenLedger, TokenBalance models

#### API Routes
- ✅ `web/app/api/billing/create-checkout-session/route.ts` - Creates Stripe Checkout sessions
- ✅ `web/app/api/billing/create-portal-session/route.ts` - Creates Customer Portal sessions
- ✅ `web/app/api/tokens/balance/route.ts` - Get token balance
- ✅ `web/app/api/tokens/ledger/route.ts` - Get transaction history
- ✅ `web/app/api/webhooks/stripe/route.ts` - Stripe webhook handler
- ✅ `web/app/api/admin/tokens/credit/route.ts` - Admin manual credit endpoint

#### Libraries & Utilities
- ✅ `web/lib/stripe.ts` - Stripe client and price mappings
- ✅ `web/lib/db.ts` - Prisma client singleton
- ✅ `web/lib/billing.ts` - Billing utilities (creditTokens, debitTokens, getBalance, etc.)
- ✅ `web/lib/rate-limit.ts` - In-memory rate limiter

#### UI Components
- ✅ `web/components/billing/CurrentBalance.tsx` - Displays current token balance
- ✅ `web/components/billing/BuyTokens.tsx` - Token pack purchase buttons
- ✅ `web/components/billing/ManageBilling.tsx` - Customer Portal button
- ✅ `web/components/billing/LedgerTable.tsx` - Transaction history table

#### Pages
- ✅ `web/app/app/billing/page.tsx` - Main billing page

#### Configuration
- ✅ `web/package.json` - Added stripe, zod dependencies and Prisma scripts
- ✅ `web/middleware.ts` - Updated to allow webhook routes
- ✅ `web/.env.local.example` - Added Stripe environment variables

#### Documentation
- ✅ `docs/BILLING.md` - Complete billing documentation
- ✅ `docs/BILLING_SETUP.md` - Setup guide
- ✅ `README.md` - Updated with billing features

## 📊 Database Schema

### Prisma Models Created

```prisma
model BillingCustomer {
  id        String   @id @default(cuid())
  userId    String   @unique
  stripeId  String   @unique
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

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

model TokenBalance {
  userId    String   @id
  balance   Int      @default(0)
  updatedAt DateTime @updatedAt
}
```

## 🔌 API Endpoints

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/billing/create-checkout-session` | POST | ✅ | Creates Stripe Checkout session |
| `/api/billing/create-portal-session` | POST | ✅ | Creates Customer Portal session |
| `/api/tokens/balance` | GET | ✅ | Get current token balance |
| `/api/tokens/ledger` | GET | ✅ | Get transaction history |
| `/api/webhooks/stripe` | POST | ❌ | Stripe webhook handler |
| `/api/admin/tokens/credit` | POST | ✅ Admin | Manual token credit |

## 🔐 Security Features

- ✅ **Authentication**: All billing endpoints require NextAuth session
- ✅ **Rate Limiting**: 5 requests/minute per user+IP (in-memory)
- ✅ **Idempotency**: Webhook events use `stripeEventId` unique constraint
- ✅ **Input Validation**: Zod schemas validate all requests
- ✅ **RBAC**: Admin endpoints check for admin role
- ✅ **Webhook Verification**: Stripe signature verification
- ✅ **Server-Side Price Mapping**: Never trust client-provided amounts

## 📋 Environment Variables Required

### Stripe Configuration
```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_PRICE_TOKENS_SMALL=price_...
STRIPE_PRICE_TOKENS_MEDIUM=price_...
STRIPE_PRICE_TOKENS_LARGE=price_...
STRIPE_PRICE_SUBSCRIPTION_STARTER=price_...  # Optional
```

### Billing URLs
```env
BILLING_RETURN_URL=https://promptbloom.app/app/billing
BILLING_CANCEL_URL=https://promptbloom.app/app/billing?canceled=1
SITE_URL=https://promptbloom.app
```

### Database
```env
DATABASE_URL=postgresql://...
```

## 🎯 Next Steps

### 1. Set Up Stripe Products & Prices

1. Go to [Stripe Dashboard → Products](https://dashboard.stripe.com/products)
2. Create three products:
   - Small Pack (1,000 tokens)
   - Medium Pack (5,000 tokens)
   - Large Pack (12,000 tokens)
3. Create one-time payment prices for each
4. Copy Price IDs to environment variables

### 2. Configure Webhook Endpoint

1. Go to [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks)
2. Add endpoint: `https://promptbloom.app/api/webhooks/stripe`
3. Select events:
   - `checkout.session.completed`
   - `invoice.paid`
   - `charge.refunded`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
4. Copy webhook signing secret

### 3. Run Prisma Migrations

```bash
cd web
npm run prisma:generate
npm run prisma:migrate -- --name init_billing
```

### 4. Set Environment Variables

Add all required variables to:
- `.env.local` (local development)
- Vercel Dashboard → Environment Variables (production)

### 5. Test the Flow

1. Start dev server: `npm run dev`
2. Navigate to `/app/billing`
3. Test checkout with Stripe test card: `4242 4242 4242 4242`
4. Verify tokens are credited
5. Test Customer Portal access

## 🔄 Webhook Events Handled

| Event | Action | Token Amount |
|-------|--------|--------------|
| `checkout.session.completed` | Credit tokens | From priceId mapping |
| `invoice.paid` | Credit monthly tokens | From subscription price mapping |
| `charge.refunded` | Deduct tokens | Conservative deduction |
| `customer.subscription.updated` | Log change | N/A |
| `customer.subscription.deleted` | Log cancellation | N/A |

## 📝 Price → Token Mapping

Server-side mapping (single source of truth):

```typescript
TOKEN_MAP = {
  [STRIPE_PRICE_TOKENS_SMALL]: { tokens: 1000, label: "Small Pack" },
  [STRIPE_PRICE_TOKENS_MEDIUM]: { tokens: 5000, label: "Medium Pack" },
  [STRIPE_PRICE_TOKENS_LARGE]: { tokens: 12000, label: "Large Pack" },
}

SUBSCRIPTION_PRICE_MAP = {
  [STRIPE_PRICE_SUBSCRIPTION_STARTER]: { monthlyTokens: 6000, label: "Starter Monthly" },
}
```

## ⚠️ Important Notes

1. **Never trust client-provided token amounts** - Always map from server-side price IDs
2. **Idempotency is critical** - Webhook retries won't double-credit due to `stripeEventId` unique constraint
3. **Rate limiting is in-memory** - Use Redis in production for distributed rate limiting
4. **Admin RBAC is basic** - Customize admin check in `web/app/api/admin/tokens/credit/route.ts`
5. **Refund deduction is conservative** - Implement `inferRefundTokenAmount()` to trace original credits

## 📚 Documentation

- **Setup Guide**: [docs/BILLING_SETUP.md](./BILLING_SETUP.md)
- **Complete Documentation**: [docs/BILLING.md](./BILLING.md)
- **API Reference**: See `docs/BILLING.md` → API Endpoints section

## ✅ Verification Checklist

- [x] Prisma schema created
- [x] API routes implemented
- [x] Webhook handler with idempotency
- [x] UI components created
- [x] Security measures in place
- [x] Documentation complete
- [ ] Stripe products/prices created (user action required)
- [ ] Webhook endpoint configured (user action required)
- [ ] Prisma migrations run (user action required)
- [ ] Environment variables set (user action required)
- [ ] End-to-end testing completed (user action required)

## 🚀 Status

**Code**: ✅ Complete  
**Documentation**: ✅ Complete  
**Stripe Setup**: ⏳ Pending user action  
**Testing**: ⏳ Pending user action  

**Latest Commit**: `3710ab3` - "feat(billing): Stripe Checkout + Portal + secure webhooks + token ledger & UI"

