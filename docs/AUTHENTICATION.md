# Authentication & RBAC Documentation

## Overview

The authentication system uses NextAuth with Argon2id password hashing, database sessions, and role-based access control (RBAC) for developer/admin accounts.

## Architecture

### Authentication Flow

1. **Sign Up**: Users create accounts via `/auth/signup`
   - Password hashed with Argon2id
   - Default 'user' role assigned
   - Auto sign-in after registration

2. **Sign In**: Users authenticate via `/auth/signin`
   - Credentials provider (email/password)
   - OAuth providers (Google, GitHub)
   - Session stored in database

3. **Invite Flow**: Developer/admin accounts require invite tokens
   - Admin generates invite via `scripts/create-invite.ts`
   - User signs up/signs in
   - Redeems invite at `/auth/invite/[token]`
   - Role assigned automatically

### Database Schema

**Users Table:**
```sql
users (
  id UUID PRIMARY KEY,
  email TEXT UNIQUE,
  password_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ
)
```

**Roles Table:**
```sql
roles (
  id SERIAL PRIMARY KEY,
  name TEXT UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

**User Roles Table:**
```sql
user_roles (
  user_id UUID REFERENCES users(id),
  role_id INT REFERENCES roles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  PRIMARY KEY (user_id, role_id)
)
```

**Invites Table:**
```sql
invites (
  token UUID PRIMARY KEY,
  role_id INT REFERENCES roles(id),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
```

## Setup

### 1. Run Prisma Migrations

```bash
cd web
npm run prisma:generate
npm run prisma:migrate -- --name add_auth_rbac
```

### 2. Seed Default Roles

```bash
npx tsx scripts/seed-roles.ts
```

This creates:
- `user` - Default role for all users
- `developer` - Developer access
- `admin` - Admin access

### 3. Create Invite Tokens

**For Developer:**
```bash
npx tsx scripts/create-invite.ts developer
```

**For Admin:**
```bash
npx tsx scripts/create-invite.ts admin 14  # Expires in 14 days
```

The script outputs a redeem URL like:
```
https://promptbloom.app/auth/invite/<token>
```

## Usage

### Route Protection

**Server-side guard in layout:**
```typescript
// web/app/app/layout.tsx
const session = await getServerSession(authOptions);
if (!session?.user) {
  redirect("/auth/signin?callbackUrl=/app");
}
```

**Require specific role:**
```typescript
import { requireRole } from "@/lib/auth-helpers";

// In API route or server component
const session = await requireRole(["developer", "admin"]);
// Throws error if user doesn't have required role
```

**Check roles:**
```typescript
import { getSessionWithRoles } from "@/lib/auth-helpers";

const session = await getSessionWithRoles();
if (session?.user.roles.includes("admin")) {
  // Admin-only code
}
```

### Session Access

**Server Component:**
```typescript
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

const session = await getServerSession(authOptions);
const userId = session?.user?.id;
const roles = (session?.user as any)?.roles || [];
```

**Client Component:**
```typescript
"use client";
import { useSession } from "next-auth/react";

const { data: session } = useSession();
const userId = session?.user?.id;
const roles = (session?.user as any)?.roles || [];
```

## Security Features

### Password Hashing
- **Algorithm**: Argon2id (memory-hard, resistant to GPU attacks)
- **Configuration**: Default argon2 settings (secure)
- **Storage**: Hashed passwords only, never plaintext

### Session Management
- **Strategy**: Database sessions (server-side)
- **Duration**: 30 days
- **Cookies**: 
  - `httpOnly: true` (XSS protection)
  - `sameSite: "lax"` (CSRF protection)
  - `secure: true` (HTTPS only in production)
  - `domain: ".promptbloom.app"` (subdomain support)

### Role-Based Access Control
- **Default Role**: All users get 'user' role on signup
- **Elevated Roles**: Require invite tokens (developer/admin)
- **No Public Signup**: Dev/admin roles cannot be obtained via public signup

### Invite System
- **Token Format**: UUID v4
- **Expiration**: 7 days default (configurable)
- **One-Time Use**: Tokens marked as used after redemption
- **Validation**: Checks expiration and usage status

## API Endpoints

### POST `/api/auth/signup`
Create a new user account.

**Request:**
```json
{
  "email": "user@example.com",
  "password": "securepassword123"
}
```

**Response:**
```json
{
  "success": true,
  "userId": "uuid"
}
```

### POST `/api/auth/redeem`
Redeem an invite token (requires authentication).

**Request:**
```json
{
  "token": "uuid-token"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Role 'developer' assigned successfully",
  "role": "developer"
}
```

## Branded Auth Pages

All auth pages use the SoundFoundry brand:

- **Background**: Forge Black (`#0D0D0F`)
- **Card**: Graphite Gray (`#24262A`) with backdrop blur
- **Text**: Steel White (`#F3F5F7`)
- **Primary Button**: Resonance Blue (`#3A77FF`)
- **Accent**: Forge Amber (`#FFB24D`)
- **Logo**: Wordmark SVG centered at top

### Pages

- `/auth/signin` - Sign in page
- `/auth/signup` - Sign up page
- `/auth/invite/[token]` - Invite redemption page
- `/auth/signout` - Sign out (redirects)
- `/auth/error` - Error page

## Environment Variables

```env
# NextAuth
NEXTAUTH_URL=https://promptbloom.app
NEXTAUTH_SECRET=<32+ character secret>

# Database
DATABASE_URL=postgresql://...

# OAuth (optional)
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GITHUB_CLIENT_ID=...
GITHUB_CLIENT_SECRET=...
```

## Troubleshooting

### "User already exists"
- User with that email already registered
- Use sign in instead of sign up

### "Invalid invite token"
- Token doesn't exist in database
- Check token spelling/copy

### "Invite expired"
- Token past expiration date
- Generate new invite

### "Invite already used"
- Token was already redeemed
- Generate new invite for additional access

### Session not persisting
- Check cookie settings (domain, secure, httpOnly)
- Verify `NEXTAUTH_SECRET` is set
- Check database connection

## Best Practices

1. **Never expose invite URLs publicly** - Share via secure channels
2. **Rotate `NEXTAUTH_SECRET`** periodically in production
3. **Monitor invite usage** - Track who redeems invites
4. **Use role checks** - Always verify roles server-side
5. **Secure password requirements** - Minimum 8 characters (enforce stronger if needed)

## Next Steps

1. **Run migrations**: `npm run prisma:migrate`
2. **Seed roles**: `npx tsx scripts/seed-roles.ts`
3. **Create first admin**: `npx tsx scripts/create-invite.ts admin`
4. **Test signup/signin flow**
5. **Test invite redemption**

