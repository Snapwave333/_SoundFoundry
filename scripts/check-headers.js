#!/usr/bin/env node
/**
 * Security Headers Validator
 * Validates presence and values of security headers
 * 
 * Usage: node scripts/check-headers.js [--site-url=https://promptbloom.app]
 */

const https = require('https');
const http = require('http');
const { URL } = require('url');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

const args = process.argv.slice(2);
const siteUrl = args.find(arg => arg.startsWith('--site-url='))?.split('=')[1] || 'https://promptbloom.app';

let pass = 0;
let fail = 0;
const failures = [];

function makeRequest(url) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const req = client.request(url, {
      method: 'HEAD',
      headers: { 'User-Agent': 'PromptBloom-HeaderCheck/1.0' },
    }, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
    });
    
    req.on('error', reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    req.end();
  });
}

function checkHeader(name, headerName, url, validator) {
  return new Promise(async (resolve) => {
    process.stdout.write(`Checking ${name}... `);
    
    try {
      const { headers } = await makeRequest(url);
      const value = headers[headerName.toLowerCase()];
      
      if (!value) {
        console.log(`${RED}✗ FAIL${RESET} (header not found)`);
        failures.push({ header: name, issue: 'Header not found' });
        fail++;
        resolve(false);
        return;
      }
      
      const isValid = validator(value);
      if (isValid) {
        console.log(`${GREEN}✓ PASS${RESET} (${value.substring(0, 60)}...)`);
        pass++;
        resolve(true);
      } else {
        console.log(`${RED}✗ FAIL${RESET} (${value})`);
        failures.push({ header: name, issue: `Invalid value: ${value}`, expected: validator.toString() });
        fail++;
        resolve(false);
      }
    } catch (error) {
      console.log(`${RED}✗ FAIL${RESET} (${error.message})`);
      failures.push({ header: name, issue: error.message });
      fail++;
      resolve(false);
    }
  });
}

async function main() {
  console.log(`${CYAN}🔒 Validating Security Headers${RESET}\n`);
  console.log(`Site: ${siteUrl}\n`);

  // Strict-Transport-Security
  await checkHeader(
    'Strict-Transport-Security',
    'strict-transport-security',
    siteUrl,
    (value) => {
      return value.includes('max-age=63072000') && 
             value.includes('includeSubDomains') && 
             value.includes('preload');
    }
  );

  // X-Content-Type-Options
  await checkHeader(
    'X-Content-Type-Options',
    'x-content-type-options',
    siteUrl,
    (value) => value.toLowerCase() === 'nosniff'
  );

  // X-Frame-Options
  await checkHeader(
    'X-Frame-Options',
    'x-frame-options',
    siteUrl,
    (value) => value.toUpperCase() === 'DENY'
  );

  // Referrer-Policy
  await checkHeader(
    'Referrer-Policy',
    'referrer-policy',
    siteUrl,
    (value) => {
      const policy = value.toLowerCase();
      return policy === 'no-referrer-when-downgrade' || 
             policy === 'strict-origin-when-cross-origin' ||
             policy === 'no-referrer' ||
             policy === 'same-origin';
    }
  );

  // Permissions-Policy
  await checkHeader(
    'Permissions-Policy',
    'permissions-policy',
    siteUrl,
    (value) => {
      const policy = value.toLowerCase();
      return policy.includes('camera=()') && 
             policy.includes('microphone=()') && 
             policy.includes('geolocation=()');
    }
  );

  // Content-Security-Policy
  await checkHeader(
    'Content-Security-Policy',
    'content-security-policy',
    siteUrl,
    (value) => {
      const csp = value.toLowerCase();
      // Check for required directives
      const hasDefaultSrc = csp.includes("default-src 'self'");
      const hasFrameAncestors = csp.includes("frame-ancestors 'none'");
      const hasBaseUri = csp.includes("base-uri 'self'");
      
      // Check allowed domains (should be restrictive)
      const allowsGoogleAnalytics = csp.includes('www.googletagmanager.com') || csp.includes('www.google-analytics.com');
      const allowsApi = csp.includes('api.promptbloom.app');
      
      return hasDefaultSrc && hasFrameAncestors && hasBaseUri;
    }
  );

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Results: ${GREEN}${pass} passed${RESET}, ${RED}${fail} failed${RESET}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failures.length > 0) {
    console.log('Failures:');
    failures.forEach(({ header, issue, expected }) => {
      console.log(`  ${RED}✗${RESET} ${header}: ${issue}`);
      if (expected) {
        console.log(`    Expected: ${expected}`);
      }
    });
    console.log('');
  }

  if (fail === 0) {
    console.log(`${GREEN}✅ All security headers valid!${RESET}`);
    process.exit(0);
  } else {
    console.log(`${RED}❌ Some headers failed validation.${RESET}`);
    console.log('\nCSP Reporting: To enable CSP violation reporting, add a /csp-report endpoint.');
    console.log('See docs/GO_LIVE_CHECKLIST.md for details.');
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`${RED}Fatal error:${RESET}`, error);
  process.exit(1);
});

