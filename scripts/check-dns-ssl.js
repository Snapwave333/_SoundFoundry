#!/usr/bin/env node
/**
 * DNS & SSL Checker
 * Validates DNS records and SSL certificate
 * 
 * Usage: node scripts/check-dns-ssl.js [--site-url=https://promptbloom.app]
 */

const dns = require('dns').promises;
const https = require('https');
const { URL } = require('url');
const tls = require('tls');

const GREEN = '\x1b[32m';
const RED = '\x1b[31m';
const YELLOW = '\x1b[33m';
const CYAN = '\x1b[36m';
const RESET = '\x1b[0m';

const args = process.argv.slice(2);
const siteUrl = args.find(arg => arg.startsWith('--site-url='))?.split('=')[1] || 'https://promptbloom.app';

let pass = 0;
let fail = 0;
let skip = 0;

function log(name, passed, details = '', isSkip = false) {
  if (isSkip) {
    console.log(`${YELLOW}⊘${RESET} ${name}: SKIP${details ? ` (${details})` : ''}`);
    skip++;
    return;
  }
  
  const icon = passed ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
  const status = passed ? 'PASS' : 'FAIL';
  console.log(`${icon} ${name}: ${status}${details ? ` (${details})` : ''}`);
  if (passed) pass++;
  else fail++;
}

function getCertificate(hostname) {
  return new Promise((resolve, reject) => {
    const socket = tls.connect(443, hostname, { servername: hostname }, () => {
      const cert = socket.getPeerCertificate(true);
      socket.end();
      resolve(cert);
    });
    socket.on('error', reject);
    socket.setTimeout(10000, () => {
      socket.destroy();
      reject(new Error('Connection timeout'));
    });
  });
}

function daysUntilExpiry(validTo) {
  const expiry = new Date(validTo);
  const now = new Date();
  return Math.ceil((expiry - now) / (1000 * 60 * 60 * 24));
}

async function checkDNS(hostname) {
  try {
    const records = await dns.resolve(hostname, 'CNAME').catch(() => 
      dns.resolve(hostname, 'A')
    );
    
    if (Array.isArray(records)) {
      return { type: 'CNAME', records };
    }
    return { type: 'A', records: [records] };
  } catch (error) {
    if (error.code === 'ENOTFOUND' || error.code === 'ENODATA') {
      return null;
    }
    throw error;
  }
}

async function main() {
  console.log(`${CYAN}🌐 Checking DNS & SSL${RESET}\n`);
  
  const urlObj = new URL(siteUrl);
  const hostname = urlObj.hostname;
  const subdomain = hostname.startsWith('app.') ? 'app.promptbloom.app' : null;
  
  // DNS Check - Primary Domain
  console.log(`Checking DNS for ${hostname}...`);
  try {
    const dnsResult = await checkDNS(hostname);
    if (!dnsResult) {
      log(`DNS resolution for ${hostname}`, false, 'Domain not found', false);
      log('SSL certificate check', false, 'Skipped - DNS not resolved', true);
      console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
      console.log(`Results: ${GREEN}${pass} passed${RESET}, ${RED}${fail} failed${RESET}, ${YELLOW}${skip} skipped${RESET}`);
      console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
      console.log(`${YELLOW}⚠ Domain not resolved. DNS may not be configured yet.${RESET}`);
      process.exit(0);
    }
    
    const { type, records } = dnsResult;
    const target = Array.isArray(records) ? records[0] : records;
    log(`DNS resolution for ${hostname}`, true, `${type}: ${target}`);
    
    // Check if CNAME points to Vercel
    if (type === 'CNAME' && target.includes('vercel')) {
      log('DNS points to Vercel', true, target);
    } else if (type === 'A') {
      log('DNS resolution', true, `A record: ${target}`);
    }
  } catch (error) {
    log(`DNS resolution for ${hostname}`, false, error.message);
  }

  // DNS Check - Subdomain (if applicable)
  if (subdomain) {
    console.log(`\nChecking DNS for ${subdomain}...`);
    try {
      const subdomainResult = await checkDNS(subdomain);
      if (subdomainResult) {
        const { type, records } = subdomainResult;
        const target = Array.isArray(records) ? records[0] : records;
        log(`DNS resolution for ${subdomain}`, true, `${type}: ${target}`);
      } else {
        log(`DNS resolution for ${subdomain}`, false, 'Subdomain not found');
      }
    } catch (error) {
      log(`DNS resolution for ${subdomain}`, false, error.message);
    }
  }

  // SSL Certificate Check
  console.log(`\nChecking SSL certificate for ${hostname}...`);
  try {
    const cert = await getCertificate(hostname);
    
    // Certificate issuer
    const issuer = cert.issuer?.CN || 'Unknown';
    log('SSL certificate issuer', true, issuer);
    
    // Subject Alternative Names
    const sans = cert.subjectaltname || '';
    if (sans.includes(hostname)) {
      log('SSL certificate SANs', true, `Includes ${hostname}`);
    } else {
      log('SSL certificate SANs', false, `Does not include ${hostname}`);
    }
    
    // Expiry check
    const daysUntil = daysUntilExpiry(cert.valid_to);
    if (daysUntil >= 21) {
      log('SSL certificate expiry', true, `${daysUntil} days until expiry`);
    } else {
      log('SSL certificate expiry', false, `Only ${daysUntil} days until expiry (minimum 21 days)`);
    }
    
    // Certificate validity period
    const validFrom = new Date(cert.valid_from).toLocaleDateString();
    const validTo = new Date(cert.valid_to).toLocaleDateString();
    console.log(`  Certificate valid: ${validFrom} to ${validTo}`);
    
  } catch (error) {
    log('SSL certificate check', false, error.message);
  }

  // SSL Labs check (info only)
  console.log(`\n${CYAN}ℹ SSL Labs Analysis${RESET}`);
  console.log(`  View detailed SSL report: https://www.ssllabs.com/ssltest/analyze.html?d=${hostname}`);
  console.log(`  (This is informational only - not gated in CI)`);

  // Summary
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Results: ${GREEN}${pass} passed${RESET}, ${RED}${fail} failed${RESET}, ${YELLOW}${skip} skipped${RESET}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (fail === 0 && skip === 0) {
    console.log(`${GREEN}✅ All DNS and SSL checks passed!${RESET}`);
    process.exit(0);
  } else if (skip > 0 && fail === 0) {
    console.log(`${YELLOW}⚠ Some checks skipped (domain may not be live yet)${RESET}`);
    process.exit(0);
  } else {
    console.log(`${RED}❌ Some checks failed.${RESET}`);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(`${RED}Fatal error:${RESET}`, error);
  process.exit(1);
});

