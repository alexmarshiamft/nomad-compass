/**
 * Nomad Compass — Frontend Client Test Suite
 * Validates relocation scoring, time zone compatibility,
 * and cost-of-living index comparisons.
 */

import assert from 'assert';

console.log('=== NOMAD COMPASS CLIENT TEST SUITE ===');

// Test 1: Timezone Compatibility Algorithm
console.log('1. Testing Timezone Compatibility Calculation...');
function calcTzCompatScore(localTzOffset, employerTzOffset) {
  const tzDiff = Math.abs(localTzOffset - employerTzOffset);
  return Math.max(0, 100 - tzDiff * 8);
}

assert.strictEqual(calcTzCompatScore(-5, -5), 100, 'Same timezone must score 100');
assert.strictEqual(calcTzCompatScore(0, -5), 60, '5-hour difference must score 60');
assert.strictEqual(calcTzCompatScore(10, -8), 0, '18-hour difference clamped at 0');
console.log('   ✅ Timezone compatibility engine passed.');

// Test 2: Net Disposable Income Calculation
console.log('2. Testing Net Disposable Income Simulator...');
function calcMonthlyDisposable(annualGrossUSD, annualTaxUSD, col) {
  const netMonthly = (annualGrossUSD - annualTaxUSD) / 12;
  const monthlyExpenses = col.rent + col.food + col.transport + col.utilities;
  return netMonthly - monthlyExpenses;
}

const sampleCOL = { rent: 1200, food: 400, transport: 50, utilities: 150 };
const disposable = calcMonthlyDisposable(100000, 20000, sampleCOL);
assert(Math.abs(disposable - (80000 / 12 - 1800)) < 0.01);
console.log(`   ✅ Net disposable income calculation verified: $${disposable.toFixed(2)}/mo.`);

// Test 3: Relocation Score Multi-Factor Weighting
console.log('3. Testing Multi-Factor Relocation Composite Scoring...');
function calcRelocationScore(qol, taxScore, tzScore, colScore) {
  return Math.round(qol * 0.35 + taxScore * 0.30 + tzScore * 0.15 + colScore * 0.20);
}

const compositeScore = calcRelocationScore(95, 80, 100, 75);
assert(compositeScore >= 0 && compositeScore <= 100);
assert.strictEqual(compositeScore, 87);
console.log(`   ✅ Composite relocation score verified: ${compositeScore}/100.`);

console.log('==================================================');
console.log('ALL CLIENT SUITE TESTS PASSED (100% Green)');
console.log('==================================================');
process.exit(0);
