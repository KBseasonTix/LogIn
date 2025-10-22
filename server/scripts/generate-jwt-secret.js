#!/usr/bin/env node
/**
 * Generate a secure JWT secret for production use
 *
 * Usage:
 *   node scripts/generate-jwt-secret.js
 *
 * Add the generated secret to your Railway environment variables:
 *   Railway Dashboard > Variables > Add Variable
 *   Key: JWT_SECRET
 *   Value: <generated secret>
 */

const crypto = require('crypto');

const secret = crypto.randomBytes(64).toString('hex');

console.log('\n=== JWT Secret Generated ===\n');
console.log('Copy this value to your Railway environment variables:\n');
console.log('Variable Name: JWT_SECRET');
console.log('Variable Value:\n');
console.log(secret);
console.log('\n============================\n');
console.log('Steps to add to Railway:');
console.log('1. Go to Railway Dashboard');
console.log('2. Select your project');
console.log('3. Go to Variables tab');
console.log('4. Click "New Variable"');
console.log('5. Name: JWT_SECRET');
console.log('6. Value: (paste the secret above)');
console.log('7. Click "Add"');
console.log('8. Redeploy your application\n');
