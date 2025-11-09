# 10-Minute Go-Live Checklist

Quick verification steps to flip **promptbloom.app** live without surprises.

## 1. DNS → Vercel

- [ ] Add domain in Vercel → Project Settings → Domains: `promptbloom.app`
- [ ] Create CNAME at your DNS host → `@` → `cname.vercel-dns.com`
- [ ] (Optional) `app.promptbloom.app` → CNAME → `cname.vercel-dns.com`
- [ ] Wait 24-48 hours for DNS propagation

## 2. Environment Variables (Vercel → Production)

Add these in Vercel → Project Settings → Environment Variables:

```env
NEXT_PUBLIC_SITE_URL=https://promptbloom.app
NEXT_PUBLIC_DASHBOARD_BASE=/app
NEXT_PUBLIC_API_URL=https://api.promptbloom.app
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_GA_ID=G-XXXXXXX        # if using GA4
NEXT_PUBLIC_PLAUSIBLE_DOMAIN=promptbloom.app  # if using Plausible
NEXTAUTH_URL=https://promptbloom.app
NEXTAUTH_SECRET=...                 # 32+ chars, generate: openssl rand -base64 32
```

## 3. Security Headers (Verify)

Run after deploy:

```bash
curl -sI https://promptbloom.app | grep -E "(Strict-Transport-Security|Content-Security-Policy|X-Frame-Options|X-Content-Type-Options|Referrer-Policy|Permissions-Policy)"
```

Expected headers:
- `Strict-Transport-Security: max-age=63072000; includeSubDomains; preload`
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Referrer-Policy: no-referrer-when-downgrade`
- `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- `Content-Security-Policy: ...` (comprehensive CSP)

## 4. Sitemap & Robots

Check:
- [ ] `https://promptbloom.app/robots.txt` → 200
- [ ] `https://promptbloom.app/sitemap.xml` → 200
- [ ] Confirm `/app/*` is excluded in robots.txt
- [ ] Confirm sitemap includes marketing pages (`/`, `/pricing`, `/about`, etc.)

## 5. Auth Smoke Test

- [ ] Incognito → open `https://promptbloom.app/app` → should 302 to `/auth/signin`
- [ ] Sign in → redirect back to `/app` with session cookie set
- [ ] Verify cookie domain is `.promptbloom.app` (for subdomain compatibility)

## 6. CORS (if API is separate)

API must allow:

```
Origin: https://promptbloom.app
Credentials: true (if using cookie sessions)
Methods: GET,POST,PUT,PATCH,DELETE,OPTIONS
Headers: Content-Type, Authorization, X-Requested-With
```

Test:
```bash
curl -X OPTIONS https://api.promptbloom.app/api/health \
  -H "Origin: https://promptbloom.app" \
  -H "Access-Control-Request-Method: GET" \
  -v
```

## 7. CSP Tweaks (only if needed)

If you add external services, update CSP in `vercel.json`:

```json
"Content-Security-Policy": "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: https:; font-src 'self' data:; connect-src 'self' https://api.promptbloom.app https://www.google-analytics.com wss:; frame-ancestors 'none'; base-uri 'self';"
```

## 8. Lighthouse Quick Pass

```bash
# Install Lighthouse CLI
npm i -g lighthouse

# Run audit
lighthouse https://promptbloom.app --preset=desktop --view
```

Target: ≥90 on Performance, Accessibility, Best Practices, SEO

## 9. Monitoring

- [ ] Add GitHub Action (`.github/workflows/verify-deployment.yml` already created)
- [ ] Set up UptimeRobot/Better Stack checks:
  - `https://promptbloom.app` → Expected: 200
  - `https://promptbloom.app/app` → Expected: 302 (redirect to login)
- [ ] Configure alerts for downtime

## 10. Rollback Plan

- [ ] Vercel → Deployments → Keep previous deployments visible
- [ ] If regression: Vercel → Deployments → "Promote previous"
- [ ] Never `git push --force` to `main`
- [ ] Keep `FORCE` policy off in branch protection

## Automated Verification

Run the verification script:

```bash
# Bash/Linux/macOS
./scripts/verify-production.sh

# PowerShell (Windows)
.\scripts\verify-production.ps1

# Node.js (any platform)
node scripts/verify-production.js
```

This checks:
- ✅ All marketing pages return 200
- ✅ `/app` redirects unauthenticated users
- ✅ Security headers present
- ✅ robots.txt and sitemap.xml accessible
- ✅ robots.txt excludes `/app`
- ✅ Sitemap includes marketing pages
- ✅ API CORS (if configured)

## Common Edge Cases & Fixes

### `/app` refresh 404
- **Cause**: Route not found or conflicting rewrites
- **Fix**: Ensure Next.js route exists (`app/app/` directory), avoid `basePath` unless necessary, all Links should be `/app/...`

### Cookies not sticking
- **Cause**: Cookie domain/path/secure settings incorrect
- **Fix**: Set cookie domain to `.promptbloom.app`, `sameSite=lax`, `secure=true` in prod (already configured in `web/lib/auth.ts`)

### CSP blocking analytics
- **Cause**: Analytics domains not in CSP
- **Fix**: Add GA/Plausible to `script-src` and `connect-src` in `vercel.json` (already configured)

### Images missing in README
- **Cause**: Path case sensitivity or incorrect paths
- **Fix**: Use `/assets/branding/...` paths, verify case sensitivity

### API CORS errors
- **Cause**: API not allowing `promptbloom.app` origin
- **Fix**: Update API CORS config to include `https://promptbloom.app` and `https://app.promptbloom.app`

## Post-Deploy Verification

After DNS propagates and Vercel deploys:

1. **Run verification script** (see above)
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

---

**Ready to go live?** Complete the checklist above, then run the verification script. If all checks pass, you're good to go! 🚀

