# Final Go-Live Actions

Complete checklist to flip **promptbloom.app** live cleanly.

## 1. Set GitHub/Vercel Secrets

### Vercel Environment Variables

Add these in **Vercel Dashboard → Project Settings → Environment Variables**:

```env
NEXT_PUBLIC_SITE_URL=https://promptbloom.app
NEXT_PUBLIC_DASHBOARD_BASE=/app
NEXT_PUBLIC_API_URL=https://api.promptbloom.app
NEXTAUTH_URL=https://promptbloom.app
NEXTAUTH_SECRET=<32+ chars>  # Generate: openssl rand -base64 32
```

### GitHub Secrets (for CI/CD)

Add these in **GitHub → Repository Settings → Secrets and variables → Actions**:

```env
AUTH_TEST_USER=<email>              # Optional: for CI login smoke test
AUTH_TEST_PASS=<password>           # Optional: for CI login smoke test
VERCEL_TOKEN=<token>                # From Vercel Dashboard → Settings → Tokens
VERCEL_ORG_ID=<org-id>              # From Vercel API or dashboard
VERCEL_PROJECT_ID=<project-id>      # From Vercel project settings
```

### Optional Analytics

```env
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_GA_ID=G-XXXXXXX                    # Google Analytics 4
# OR
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=promptbloom.app   # Plausible Analytics
```

## 2. Point DNS → Vercel

### Primary Domain

**Root (`promptbloom.app`)**: CNAME → `cname.vercel-dns.com`

**Steps:**
1. Go to your DNS provider (Cloudflare, Namecheap, GoDaddy, etc.)
2. Add CNAME record:
   - **Name**: `@` (or leave blank for root domain)
   - **Value**: `cname.vercel-dns.com`
   - **TTL**: 3600 (or default)
3. Save

### Optional Subdomain

**`app.promptbloom.app`**: CNAME → `cname.vercel-dns.com`

**Steps:**
1. Add CNAME record:
   - **Name**: `app`
   - **Value**: `cname.vercel-dns.com`
   - **TTL**: 3600
2. Add domain in Vercel dashboard

**Note**: Vercel will provide the exact CNAME value when you add the domain. Use that value instead of the generic one above.

## 3. Add Domain in Vercel

1. Go to **Vercel Dashboard → Your Project → Settings → Domains**
2. Click **Add Domain**
3. Enter: `promptbloom.app`
4. Copy the DNS record value shown
5. Add it to your DNS provider (see step 2)
6. Wait for DNS propagation (24-48 hours)
7. Vercel will automatically provision SSL certificate (5-10 minutes after DNS)

## 4. Kick CI Verification

Trigger all verification checks:

```bash
git commit --allow-empty -m "chore(ci): trigger production verification"
git push origin main
```

This will trigger the GitHub Actions workflow which runs:
- Security headers check
- DNS & SSL check
- Authentication smoke test
- Accessibility checks
- Broken links check
- Lighthouse CI
- OWASP ZAP baseline

## 5. Local Sanity Check

Run these locally before/after DNS is live:

```bash
cd web

# Install dependencies
npm ci

# Build and start (background)
npm run build && npm run start &

# Run verification checks
npm run test:headers      # Security headers
npm run test:links        # Broken links
npm run test:access       # Accessibility

# After DNS is live:
npm run test:dns          # DNS & SSL
npm run test:lhci         # Lighthouse CI
npm run test:login:smoke  # Authentication (needs AUTH_TEST_* env vars)
```

### Complete Production Verification

Run the comprehensive verification script:

```bash
# From repo root
node scripts/verify-production-complete.js

# Or with custom URL
node scripts/verify-production-complete.js --site-url=https://promptbloom.app
```

This runs all checks and outputs a result matrix.

## 6. Enable Monitoring Badges (Optional)

### UptimeRobot / Better Stack

1. Create uptime checks:
   - `https://promptbloom.app` → Expected: 200
   - `https://promptbloom.app/app` → Expected: 302 (redirect)

2. Add badge to README:
   ```markdown
   [![Uptime](https://img.shields.io/uptimerobot/status/mXXXXXXX)](https://uptimerobot.com)
   ```

### ZAP Report Artifact

The GitHub Actions workflow already uploads ZAP reports as artifacts. To view:
1. Go to **GitHub Actions → Latest workflow run**
2. Click on **zap_baseline** job
3. Download **zap-results** artifact
4. Open `report_html.html` in browser

## 7. Turn On Analytics (Optional)

### Google Analytics 4

1. Set in Vercel environment variables:
   ```env
   NEXT_PUBLIC_ENABLE_ANALYTICS=true
   NEXT_PUBLIC_GA_ID=G-XXXXXXX
   ```

2. Verify CSP allows GA:
   - Check `vercel.json` includes `www.googletagmanager.com` and `www.google-analytics.com` in `script-src` and `connect-src`

### Plausible Analytics

1. Set in Vercel environment variables:
   ```env
   NEXT_PUBLIC_ENABLE_ANALYTICS=true
   NEXT_PUBLIC_PLAUSIBLE_DOMAIN=promptbloom.app
   ```

2. Verify CSP allows Plausible (already configured)

## 8. CSP Report Endpoint (Optional, Later)

For enhanced security monitoring, add CSP violation reporting:

1. Create `/web/app/api/csp-report/route.ts`:
   ```typescript
   import { NextResponse } from 'next/server';

   export async function POST(request: Request) {
     const report = await request.json();
     // Log to your monitoring system (Sentry, LogRocket, etc.)
     console.log('CSP Violation:', report);
     return NextResponse.json({ received: true });
   }
   ```

2. Update CSP header in `vercel.json`:
   ```json
   "Content-Security-Policy": "...; report-to /csp-report"
   ```

3. Monitor violations in your logging system

**Note**: This is optional and can be added after go-live.

## Verification Checklist

- [ ] DNS configured (CNAME: `@` → `cname.vercel-dns.com`)
- [ ] Domain added in Vercel dashboard
- [ ] Environment variables set in Vercel
- [ ] GitHub secrets set (for CI/CD)
- [ ] SSL certificate provisioned (automatic, wait 5-10 min after DNS)
- [ ] CI verification triggered and passing
- [ ] Local verification checks passing
- [ ] Analytics enabled (optional)
- [ ] Monitoring badges added (optional)

## Post-Go-Live Verification

After DNS propagates and site is live:

1. **Run complete verification**:
   ```bash
   node scripts/verify-production-complete.js
   ```

2. **Manual checks**:
   - Visit `https://promptbloom.app` → Should show homepage
   - Visit `https://promptbloom.app/app` → Should redirect to login
   - Visit `https://promptbloom.app/pricing` → Should show pricing page
   - Check browser console for errors
   - Verify SSL certificate (green lock icon)

3. **Test authentication**:
   - Sign in with OAuth provider
   - Verify redirect to `/app` after login
   - Verify session persists on refresh

4. **Check analytics** (if enabled):
   - Verify analytics scripts load
   - Check real-time reports for page views

## Success Criteria

✅ All verification checks pass  
✅ No console errors  
✅ SSL certificate valid  
✅ Security headers present  
✅ Authentication flow works  
✅ Marketing pages accessible  
✅ Dashboard protected  
✅ Sitemap and robots.txt working  
✅ CI/CD pipeline green  

---

**Ready to go live?** Complete the checklist above, then run the verification script. If all checks pass, you're good to go! 🚀

