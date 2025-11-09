#!/usr/bin/env node
/**
 * Production Verification Script for promptbloom.app
 * Run after DNS propagation and Vercel deployment
 * 
 * Usage: node scripts/verify-production.js [--site-url=https://promptbloom.app] [--api-url=https://api.promptbloom.app]
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

// Parse CLI args
const args = process.argv.slice(2);
const siteUrl = args.find(arg => arg.startsWith('--site-url='))?.split('=')[1] || 'https://promptbloom.app';
const apiUrl = args.find(arg => arg.startsWith('--api-url='))?.split('=')[1] || 'https://api.promptbloom.app';

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

let pass = 0;
let fail = 0;

function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: options.method || 'GET',
      headers: {
        'User-Agent': 'PromptBloom-Verification/1.0',
        ...options.headers,
      },
      ...options,
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, data }));
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

async function check(name, testFn) {
  process.stdout.write(`Checking ${name}... `);
  try {
    const result = await testFn();
    if (result) {
      console.log(`${GREEN}✓ PASS${RESET}`);
      pass++;
      return true;
    } else {
      console.log(`${RED}✗ FAIL${RESET}`);
      fail++;
      return false;
    }
  } catch (error) {
    console.log(`${RED}✗ FAIL${RESET} (${error.message})`);
    fail++;
    return false;
  }
}

async function checkHeader(name, headerName, url) {
  return check(name, async () => {
    const { headers } = await makeRequest(url, { method: 'HEAD' });
    const value = headers[headerName.toLowerCase()];
    if (value) {
      process.stdout.write(`(${value}) `);
      return true;
    }
    return false;
  });
}

async function main() {
  console.log(`${CYAN}🔍 Verifying ${siteUrl}...${RESET}\n`);

  // 1. Homepage
  await check('Homepage (200)', async () => {
    const { status } = await makeRequest(siteUrl, { method: 'HEAD' });
    return status === 200;
  });

  // 2. Marketing Pages
  const pages = ['pricing', 'about', 'contact', 'privacy', 'terms'];
  for (const page of pages) {
    await check(`${page} page (200)`, async () => {
      const { status } = await makeRequest(`${siteUrl}/${page}`, { method: 'HEAD' });
      return status === 200;
    });
  }

  // 3. Dashboard redirect
  await check('/app redirect', async () => {
    try {
      const { status } = await makeRequest(`${siteUrl}/app`, { method: 'HEAD' });
      return [302, 307, 401].includes(status);
    } catch (error) {
      // Redirects may throw, check status code
      if (error.response?.status) {
        return [302, 307, 401].includes(error.response.status);
      }
      return false;
    }
  });

  // 4. Robots.txt
  await check('robots.txt (200)', async () => {
    const { status } = await makeRequest(`${siteUrl}/robots.txt`, { method: 'HEAD' });
    return status === 200;
  });

  // 5. Sitemap.xml
  await check('sitemap.xml (200)', async () => {
    const { status } = await makeRequest(`${siteUrl}/sitemap.xml`, { method: 'HEAD' });
    return status === 200;
  });

  // 6. Security Headers
  await checkHeader('Strict-Transport-Security', 'strict-transport-security', siteUrl);
  await checkHeader('X-Content-Type-Options', 'x-content-type-options', siteUrl);
  await checkHeader('X-Frame-Options', 'x-frame-options', siteUrl);
  await checkHeader('Referrer-Policy', 'referrer-policy', siteUrl);
  await checkHeader('Permissions-Policy', 'permissions-policy', siteUrl);
  await checkHeader('Content-Security-Policy', 'content-security-policy', siteUrl);

  // 7. Verify robots.txt excludes /app
  await check('robots.txt excludes /app', async () => {
    const { data } = await makeRequest(`${siteUrl}/robots.txt`);
    return data.includes('Disallow: /app');
  });

  // 8. Verify sitemap includes marketing pages
  await check('sitemap includes marketing pages', async () => {
    const { data } = await makeRequest(`${siteUrl}/sitemap.xml`);
    return data.includes(`${siteUrl}/pricing`) && data.includes(`${siteUrl}/about`);
  });

  // 9. API CORS (if API_URL is set and different)
  if (apiUrl && apiUrl !== siteUrl) {
    await check('API CORS', async () => {
      try {
        const { headers } = await makeRequest(`${apiUrl}/api/health`, {
          method: 'OPTIONS',
          headers: { 'Origin': siteUrl },
        });
        const corsHeader = headers['access-control-allow-origin'];
        return corsHeader && corsHeader.includes(siteUrl);
      } catch {
        return null; // Skip if API not available
      }
    });
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Results: ${GREEN}${pass} passed${RESET}, ${RED}${fail} failed${RESET}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (fail === 0) {
    console.log(`${GREEN}✅ All checks passed!${RESET}`);
    process.exit(0);
  } else {
    console.log(`${RED}❌ Some checks failed. Review above.${RESET}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`${RED}Error:${RESET}`, error);
  process.exit(1);
});

