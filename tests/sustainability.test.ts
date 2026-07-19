/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert';
import { calculateGreenPoints, calculateCarbonOffset, isVoucherUnlocked } from '../src/utils/sustainability';

test('sustainability - calculateGreenPoints maps cup returns to points', () => {
  assert.strictEqual(calculateGreenPoints(0), 0);
  assert.strictEqual(calculateGreenPoints(1), 50);
  assert.strictEqual(calculateGreenPoints(3), 150);
  assert.strictEqual(calculateGreenPoints(-5), 0); // negative boundary safety
});

test('sustainability - calculateCarbonOffset offsets CO2 emissions', () => {
  assert.strictEqual(calculateCarbonOffset(0), 0);
  assert.strictEqual(calculateCarbonOffset(1), 0.08);
  assert.strictEqual(calculateCarbonOffset(3), 0.24);
  assert.strictEqual(calculateCarbonOffset(-1), 0); // negative boundary safety
});

test('sustainability - isVoucherUnlocked unlocks reward at 150 points minimum', () => {
  assert.strictEqual(isVoucherUnlocked(0), false);
  assert.strictEqual(isVoucherUnlocked(100), false);
  assert.strictEqual(isVoucherUnlocked(150), true);
  assert.strictEqual(isVoucherUnlocked(200), true);
});
