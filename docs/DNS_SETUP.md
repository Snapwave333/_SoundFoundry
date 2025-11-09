# DNS Setup for PromptBloom

## Required DNS Records

### Primary Domain: promptbloom.app

For Vercel deployment, configure the following DNS records:

#### Option 1: CNAME (Recommended)
```
Type: CNAME
Name: @ (or leave blank for root domain)
Value: cname.vercel-dns.com
TTL: 3600 (or default)
```

#### Option 2: A Record (Alternative)
```
Type: A
Name: @ (or leave blank for root domain)
Value: 76.76.21.21
TTL: 3600 (or default)
```

**Note**: Vercel will provide the exact CNAME or A record values when you add the domain in the Vercel dashboard.

### Subdomain: app.promptbloom.app (Optional)

If using subdomain routing instead of subpath:

```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
TTL: 3600 (or default)
```

## Vercel Domain Configuration

1. **Add Domain in Vercel Dashboard**:
   - Go to your project settings → Domains
   - Add `promptbloom.app`
   - Add `www.promptbloom.app` (optional, Vercel will redirect to root)

2. **Verify DNS Records**:
   - Vercel will show the required DNS records
   - Copy the exact values provided
   - Add them to your DNS provider

3. **Wait for Propagation**:
   - DNS changes can take 24-48 hours to propagate
   - Use `dig promptbloom.app` or `nslookup promptbloom.app` to verify

## DNS Provider Instructions

### Common Providers

#### Cloudflare
1. Go to DNS → Records
2. Add CNAME record:
   - Name: `@` or `promptbloom.app`
   - Target: `cname.vercel-dns.com`
   - Proxy status: Proxied (orange cloud) or DNS only (gray cloud)
3. Save

#### Namecheap
1. Go to Domain List → Manage → Advanced DNS
2. Add CNAME Record:
   - Host: `@`
   - Value: `cname.vercel-dns.com`
   - TTL: Automatic
3. Save

#### GoDaddy
1. Go to DNS Management
2. Add CNAME Record:
   - Type: CNAME
   - Name: `@`
   - Value: `cname.vercel-dns.com`
   - TTL: 1 hour
3. Save

#### Google Domains
1. Go to DNS → Custom resource records
2. Add CNAME Record:
   - Name: `@`
   - Type: `CNAME`
   - Data: `cname.vercel-dns.com`
   - TTL: 3600
3. Save

## Verification Steps

1. **Check DNS Propagation**:
   ```bash
   dig promptbloom.app
   nslookup promptbloom.app
   ```

2. **Verify SSL Certificate**:
   - Vercel automatically provisions SSL certificates via Let's Encrypt
   - Wait 5-10 minutes after DNS propagation
   - Check: `https://promptbloom.app`

3. **Test Domain Connection**:
   - Visit Vercel dashboard → Domains
   - Status should show "Valid Configuration"
   - SSL certificate should show "Valid"

## Troubleshooting

### DNS Not Propagating
- Wait 24-48 hours for full propagation
- Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (macOS)
- Use different DNS servers (8.8.8.8, 1.1.1.1)

### SSL Certificate Issues
- Ensure DNS is fully propagated
- Check that domain is added in Vercel dashboard
- Wait 5-10 minutes after DNS propagation
- Contact Vercel support if issues persist

### Subdomain Issues
- Ensure CNAME record is correctly configured
- Verify subdomain is added in Vercel dashboard
- Check that parent domain (promptbloom.app) is configured first

## Current Status

**Domain**: promptbloom.app  
**Status**: Pending DNS configuration  
**SSL**: Will be provisioned automatically by Vercel  
**Expected Setup Time**: 24-48 hours after DNS configuration

