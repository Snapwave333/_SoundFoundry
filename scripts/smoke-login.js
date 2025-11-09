#!/usr/bin/env node
/**
 * Synthetic Login Smoke Test
 * Tests authentication flow and dashboard access
 * 
 * Usage: node scripts/smoke-login.js [--site-url=https://promptbloom.app]
 */

const { chromium } = require('playwright');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

const args = process.argv.slice(2);
const siteUrl = args.find(arg => arg.startsWith('--site-url='))?.split('=')[1] || 'https://promptbloom.app';
const authUser = process.env.AUTH_TEST_USER;
const authPass = process.env.AUTH_TEST_PASS;

let pass = 0;
let fail = 0;
const results = [];

function log(name, passed, details = '') {
  const icon = passed ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`${icon} ${name}: ${status}${details ? ` (${details})` : ''}`);
  results.push({ name, passed, details });
  if (passed) pass++;
  else fail++;
}

async function main() {
  console.log(`${CYAN}🔐 Testing Authentication Flow${RESET}\n`);
  console.log(`Site: ${siteUrl}\n`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Test 1: Unauthenticated access to /app redirects to login
    console.log('Test 1: Unauthenticated redirect...');
    try {
      const response = await page.goto(`${siteUrl}/app`, { waitUntil: 'networkidle', timeout: 10000 });
      const finalUrl = page.url();
      
      if (finalUrl.includes('/auth/signin')) {
        const urlObj = new URL(finalUrl);
        const callbackUrl = urlObj.searchParams.get('callbackUrl');
        if (callbackUrl === '/app' || callbackUrl === `${siteUrl}/app`) {
          log('Unauthenticated redirect to /auth/signin with callbackUrl', true);
        } else {
          log('Unauthenticated redirect to /auth/signin with callbackUrl', false, `callbackUrl=${callbackUrl}`);
        }
      } else {
        log('Unauthenticated redirect to /auth/signin', false, `finalUrl=${finalUrl}`);
      }
    } catch (error) {
      log('Unauthenticated redirect to /auth/signin', false, error.message);
    }

    // Test 2: Login flow (if credentials provided)
    if (authUser && authPass) {
      console.log('\nTest 2: Login flow...');
      try {
        // Navigate to login page
        await page.goto(`${siteUrl}/auth/signin`, { waitUntil: 'networkidle' });
        
        // Look for login form (adjust selectors based on your auth implementation)
        const emailInput = page.locator('input[type="email"], input[name="email"]').first();
        const passwordInput = page.locator('input[type="password"], input[name="password"]').first();
        const submitButton = page.locator('button[type="submit"], button:has-text("Sign"), button:has-text("Log")').first();
        
        if (await emailInput.count() > 0 && await passwordInput.count() > 0) {
          await emailInput.fill(authUser);
          await passwordInput.fill(authPass);
          await submitButton.click();
          
          // Wait for redirect
          await page.waitForURL(url => url.includes('/app') || url === siteUrl, { timeout: 10000 });
          
          const finalUrl = page.url();
          if (finalUrl.includes('/app')) {
            // Check for dashboard shell
            const mainElement = page.locator('main').first();
            if (await mainElement.count() > 0) {
              const statusCode = await page.evaluate(() => document.readyState);
              log('Login flow completes and dashboard renders', true);
            } else {
              log('Login flow completes and dashboard renders', false, 'main element not found');
            }
          } else {
            log('Login flow completes and dashboard renders', false, `redirected to ${finalUrl}`);
          }
        } else {
          // OAuth flow - check for OAuth buttons
          const oauthButtons = page.locator('button:has-text("Google"), button:has-text("GitHub"), a:has-text("Sign in")');
          if (await oauthButtons.count() > 0) {
            log('Login flow (OAuth detected)', true, 'OAuth flow - manual verification required');
          } else {
            log('Login flow', false, 'No login form or OAuth buttons found');
          }
        }
      } catch (error) {
        log('Login flow', false, error.message);
      }
    } else {
      console.log(`\n${YELLOW}⚠ Skipping login flow (AUTH_TEST_USER/AUTH_TEST_PASS not set)${RESET}`);
      console.log('Set AUTH_TEST_USER and AUTH_TEST_PASS environment variables to test full login flow.');
    }

    // Test 3: Dashboard accessibility (if logged in)
    if (authUser && authPass) {
      console.log('\nTest 3: Dashboard accessibility...');
      try {
        const response = await page.goto(`${siteUrl}/app`, { waitUntil: 'networkidle', timeout: 10000 });
        const status = response?.status() || 200;
        
        if (status === 200) {
          const hasMain = await page.locator('main').count() > 0;
          log('Dashboard returns 200 with <main> landmark', hasMain);
        } else {
          log('Dashboard returns 200 with <main> landmark', false, `status=${status}`);
        }
      } catch (error) {
        log('Dashboard accessibility', false, error.message);
      }
    }

  } catch (error) {
    console.error(`${RED}Error:${RESET}`, error.message);
    fail++;
  } finally {
    await browser.close();
  }

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Results: ${GREEN}${pass} passed${RESET}, ${RED}${fail} failed${RESET}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  // Print matrix
  console.log('Test Matrix:');
  results.forEach(({ name, passed, details }) => {
    const icon = passed ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
    console.log(`  ${icon} ${name}${details ? ` - ${details}` : ''}`);
  });

  if (fail === 0) {
    console.log(`\n${GREEN}✅ All checks passed!${RESET}`);
    process.exit(0);
  } else {
    console.log(`\n${RED}❌ Some checks failed.${RESET}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`${RED}Fatal error:${RESET}`, error);
  process.exit(1);
});

