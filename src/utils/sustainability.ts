/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Calculates the Green Points earned based on number of returned cups.
 * Each cup return is worth 50 points.
 */
export function calculateGreenPoints(cupReturns: number): number {
  if (cupReturns < 0) return 0;
  return cupReturns * 50;
}

/**
 * Calculates the carbon footprint offset (in kg of CO2 saved) based on cup returns.
 * Each cup returned offsets approximately 0.08 kg of CO2.
 */
export function calculateCarbonOffset(cupReturns: number): number {
  if (cupReturns < 0) return 0.0;
  return Number((cupReturns * 0.08).toFixed(2));
}

/**
 * Determines if a user has qualified for a sustainability reward voucher.
 * Requires a minimum of 150 points (3 cups returned).
 */
export function isVoucherUnlocked(points: number): boolean {
  return points >= 150;
}
