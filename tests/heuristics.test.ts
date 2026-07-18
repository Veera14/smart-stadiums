/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import test from 'node:test';
import assert from 'node:assert';
import { generateLocalAnalysis } from '../src/heuristics';
import { SensorData, Incident } from '../src/types';

test('heuristics - baseline/normal operations', () => {
  const sensors: SensorData[] = [
    { id: 's1', label: 'Gate A', type: 'gate', value: 15, status: 'normal', lastUpdated: '', location: 'Gate A' },
    { id: 's3', label: 'Level 1', type: 'concourse', value: 25, status: 'normal', lastUpdated: '', location: 'Concourse Level 1' },
    { id: 's7', label: 'Shuttle Loop', type: 'transport', value: 2, status: 'normal', lastUpdated: '', location: 'Shuttle Stop' }
  ];
  const incidents: Incident[] = [];
  const result = generateLocalAnalysis(sensors, incidents, 'MetLife Stadium');

  assert.strictEqual(result.safetyRating, 98);
  assert.strictEqual(result.gateStatus, 'Normal flow');
  assert.strictEqual(result.concourseStatus, 'Fluid movement');
  assert.strictEqual(result.transportStatus, 'On-schedule services');
  assert.match(result.executiveSummary, /Excellent operational fluidness/);
  assert.strictEqual(result.topAlerts[0], 'All clear. Baseline systems performing normally.');
  assert.ok(result.recommendations.length >= 3);
});

test('heuristics - safety score decreases with warnings and critical sensors', () => {
  const sensors: SensorData[] = [
    { id: 's1', label: 'Gate A', type: 'gate', value: 85, status: 'warning', lastUpdated: '', location: 'Gate A' },
    { id: 's2', label: 'Gate B', type: 'gate', value: 98, status: 'critical', lastUpdated: '', location: 'Gate B' }
  ];
  const incidents: Incident[] = [];
  const result = generateLocalAnalysis(sensors, incidents, 'MetLife Stadium');

  // Baseline: 98
  // s1 (warning) -> -4 => 94
  // s2 (critical) -> -12 => 82
  assert.strictEqual(result.safetyRating, 82);
  assert.strictEqual(result.gateStatus, 'Severe bottleneck at Gate B');
  assert.match(result.executiveSummary, /Stadium conditions are stable but require monitoring/);
  assert.strictEqual(result.recommendations[0].title, 'Divert Entrance flow from Gate B');
});

test('heuristics - safety score decreases with unresolved incidents', () => {
  const sensors: SensorData[] = [];
  const incidents: Incident[] = [
    {
      id: 'inc-1',
      section: 'Section 104',
      type: 'cleaning',
      description: 'Soda spill',
      reportedAt: '',
      status: 'pending',
      originalLanguage: 'English'
    },
    {
      id: 'inc-2',
      section: 'Gate B',
      type: 'security',
      description: 'Crowd rush',
      reportedAt: '',
      status: 'dispatched',
      originalLanguage: 'English'
    }
  ];
  const result = generateLocalAnalysis(sensors, incidents, 'MetLife Stadium');

  // Baseline: 98
  // inc-1 (pending) -> -8 => 90
  // inc-2 (dispatched) -> -3 => 87
  assert.strictEqual(result.safetyRating, 87);
  assert.strictEqual(result.topAlerts.length, 1);
  assert.strictEqual(result.topAlerts[0], 'Unresolved cleaning incident at Section 104');
});

test('heuristics - safety score respects minimum limit', () => {
  const sensors: SensorData[] = Array.from({ length: 10 }, (_, i) => ({
    id: `s${i}`,
    label: `Sensor ${i}`,
    type: 'gate',
    value: 99,
    status: 'critical',
    lastUpdated: '',
    location: `Gate ${i}`
  }));
  const incidents: Incident[] = [];
  const result = generateLocalAnalysis(sensors, incidents, 'MetLife Stadium');

  // Baseline 98 - (10 * 12) = -22. Bound check sets minimum to 15.
  assert.strictEqual(result.safetyRating, 15);
});
