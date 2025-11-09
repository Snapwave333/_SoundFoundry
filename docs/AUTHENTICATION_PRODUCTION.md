# Production-Grade Authentication & RBAC

## Overview

This document describes the production-ready authentication system with role-based access control (RBAC), audit logging, rate limiting, and MFA support.

## Roles

| Role        | Permissions                       | Who gets it       |
| ----------- | --------------------------------- | ----------------- |
| `user`      | Normal dashboard use              | Anyone signing up |
| `creator`   | Create AI models / pipelines      | Invite-only       |
| `developer` | Internal ops, debugging tools     | Invite-only       |
| `admin`     | Manage roles, billing, bans, logs | Invite-only       |

**Never use boolean flags** like `isAdmin`. Always use `roles[]` array.

## Database Schema

### Users Table
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

### Roles Table
```sql
CREATE TABLE roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### User Roles Table
```sql
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id INT REFERENCES roles(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
);
```

### Audit Logs Table
```sql
CREATE TABLE audit_logs (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  metadata JSONB,
  ip INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### MFA Secrets Table
```sql
CREATE TABLE mfa_secrets (
  id TEXT PRIMARY KEY,
  user_id UUID UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  secret_hash TEXT NOT NULL,
  enabled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP
);
```

## Password Security

- **Algorithm**: Argon2id (memory-hard, GPU-resistant)
- **Salt**: 16+ bytes (handled by library)
- **Never store**: Plaintext passwords or reset tokens

```typescript
import argon2 from "argon2";

// Hash
const hash = await argon2.hash(password, { type: argon2.argon2id });

// Verify
await argon2.verify(hash, password);
```

## Session & Cookies

- **Strategy**: Database sessions (server-side)
- **Duration**: 30 days
- **Cookies**:
  - `sameSite: "lax"` (CSRF protection)
  - `secure: true` (HTTPS only in production)
  - `httpOnly: true` (XSS protection)
  - `domain: ".promptbloom.app"` (subdomain support)
  - `maxAge: 30 days`

**Never store roles in frontend.** Always re-fetch from DB per request.

## Role Enforcement

### Server-Side Guard
```typescript
import { requireRole } from "@/lib/auth-helpers";

// In server component or API route
const session = await requireRole(["admin"]);
// Throws error if unauthorized
```

### API Route Middleware
```typescript
import { withRole } from "@/lib/auth-helpers";

export const POST = withRole(["admin"], async (req, session) => {
  // Handler code
  return NextResponse.json({ success: true });
});
```

## Rate Limiting

### Login Endpoint
- **Limit**: 5 requests per minute per IP
- **Block**: 10 minutes on failure burst
- **Implementation**: In-memory (use Redis in production)

### Signup Endpoint
- **Limit**: 3 requests per minute per IP

## Audit Logging

All critical actions are logged:

- ✅ Login success/failures
- ✅ Role changes
- ✅ Admin actions
- ✅ Invite creation/redeem
- ✅ MFA enable/disable
- ✅ API key generation (when implemented)
- ✅ Credit changes (billing system)

**Never log**: Passwords, access tokens, or sensitive data.

### Audit Actions
```typescript
AuditActions.LOGIN_SUCCESS
AuditActions.LOGIN_FAILURE
AuditActions.ROLE_ASSIGNED
AuditActions.ROLE_REMOVED
AuditActions.INVITE_CREATED
AuditActions.INVITE_REDEEMED
AuditActions.MFA_ENABLED
AuditActions.MFA_DISABLED
// ... and more
```

## MFA (Multi-Factor Authentication)

### TOTP Support
- **Apps**: Authy, Google Authenticator, 1Password
- **Algorithm**: TOTP (Time-based One-Time Password)
- **Digits**: 6
- **Period**: 30 seconds

### MFA Requirements
- **Required for**: `developer` and `admin` roles
- **Optional for**: `user` and `creator` roles

### Implementation
```typescript
import { generateMfaSecret, enableMfa, verifyMfaCode } from "@/lib/mfa";

// Generate secret and QR code
const { secret, qrUrl } = generateMfaSecret(user.email);

// Enable MFA
await enableMfa(userId, secret);

// Verify code
const isValid = await verifyMfaCode(userId, code);
```

## Account Creation Flow

### Public Signup
- ✅ Allowed for `user` role
- ✅ Auto-assigned on signup
- ✅ Rate limited (3 per minute)

### Elevated Roles
- ❌ Never public signup
- ✅ Invite-only via tokens
- ✅ Tokens expire after use
- ✅ Tokens expire after 7 days (configurable)

### Invite Flow
1. Admin generates invite token via `/app/admin` or `scripts/create-invite.ts`
2. Developer/admin signs up via invite link
3. Role auto-assigned on redemption
4. Token marked as used immediately

## Environment Separation

| Environment | Allowed Roles        | Notes           |
| ----------- | -------------------- | --------------- |
| Production  | all roles            | real users      |
| Staging     | developer/admin only | feature testing |
| Local       | no external access   | safe sandbox    |

**Never** let dev accounts exist on prod with shared credentials.

## API Endpoints

### Authentication
- `POST /api/auth/signup` - Create user account (rate limited)
- `POST /api/auth/login` - Login (rate limited, MFA support)
- `POST /api/auth/redeem` - Redeem invite token

### Admin (Admin Only)
- `POST /api/admin/roles/assign` - Assign role to user
- `POST /api/admin/roles/remove` - Remove role from user
- `POST /api/admin/invites/create` - Create invite token

### MFA (Authenticated)
- `POST /api/auth/mfa/enable` - Enable MFA (not yet implemented)
- `POST /api/auth/mfa/verify` - Verify MFA code (not yet implemented)
- `POST /api/auth/mfa/disable` - Disable MFA (not yet implemented)

## Admin Panel

Accessible at `/app/admin` (admin role required):

- **Create Invites**: Generate invite tokens for creator/developer/admin roles
- **Assign Roles**: Manually assign roles to users
- **Remove Roles**: Remove roles from users
- **Audit Logs**: View audit log history (coming soon)

## Dev Tools

Accessible at `/app/dev` (developer/admin role required):

- **Debugging Tools**: System logs, database queries, API health
- **Session Info**: Current user session details
- **Admin Link**: Quick access to admin panel (if admin)

## Security Best Practices

1. ✅ **Never expose invite URLs publicly** - Share via secure channels
2. ✅ **Rotate `NEXTAUTH_SECRET`** periodically in production
3. ✅ **Monitor audit logs** - Track suspicious activity
4. ✅ **Use role checks** - Always verify roles server-side
5. ✅ **Enforce MFA** - Require MFA for elevated roles
6. ✅ **Rate limit** - Protect auth endpoints from brute force
7. ✅ **Audit everything** - Log all critical actions
8. ✅ **Environment separation** - Never share credentials across environments

## Setup Checklist

- [ ] Run Prisma migrations: `npm run prisma:migrate`
- [ ] Seed roles: `npx tsx scripts/seed-roles.ts`
- [ ] Create first admin: `npx tsx scripts/create-invite.ts admin`
- [ ] Set `NEXTAUTH_SECRET` (32+ characters)
- [ ] Configure rate limiting (Redis in production)
- [ ] Enable MFA for admin accounts
- [ ] Review audit logs regularly
- [ ] Test role enforcement
- [ ] Test invite flow
- [ ] Test MFA flow (when implemented)

## Next Steps

1. **Implement MFA UI** - QR code display, verification flow
2. **Add audit log viewer** - Admin panel to view logs
3. **Redis rate limiting** - Replace in-memory limiter
4. **API key management** - Generate/revoke API keys
5. **User management** - Ban/unban users, view user details

