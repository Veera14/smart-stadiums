/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Stadium, SensorData, Incident } from './types';

export const STADIUMS: Stadium[] = [
  {
    id: 'metlife',
    name: 'New York New Jersey Stadium (MetLife)',
    city: 'East Rutherford, NJ',
    country: 'USA',
    capacity: 82500,
    gates: ['Gate A (West Plaza)', 'Gate B (Verizon)', 'Gate C (MetLife)', 'Gate D (Hampton)'],
    matches: [
      { id: 'm1', teams: 'Argentina vs France', dateTime: '2026-07-19T16:00:00', stage: 'World Cup Final', attendance: 82500 },
      { id: 'm2', teams: 'USA vs Italy', dateTime: '2026-06-27T19:00:00', stage: 'Round of 16', score: '2 - 1', attendance: 81200 },
      { id: 'm3', teams: 'Spain vs Korea Republic', dateTime: '2026-06-13T15:00:00', stage: 'Group Stage', score: '1 - 0', attendance: 78400 }
    ]
  },
  {
    id: 'sofi',
    name: 'Los Angeles Stadium (SoFi)',
    city: 'Inglewood, CA',
    country: 'USA',
    capacity: 70240,
    gates: ['Gate 1 (American Airlines)', 'Gate 5 (Samsung)', 'Gate 8', 'Gate 11'],
    matches: [
      { id: 'm4', teams: 'USA vs Japan', dateTime: '2026-06-12T18:00:00', stage: 'Group Stage (USA Opening Match)', score: '2 - 1', attendance: 70240 },
      { id: 'm5', teams: 'Brazil vs Germany', dateTime: '2026-07-04T17:00:00', stage: 'Quarterfinals', attendance: 69800 },
      { id: 'm6', teams: 'Mexico vs Nigeria', dateTime: '2026-06-21T16:00:00', stage: 'Group Stage', score: '3 - 2', attendance: 68500 }
    ]
  },
  {
    id: 'azteca',
    name: 'Estadio Azteca',
    city: 'Mexico City',
    country: 'Mexico',
    capacity: 87523,
    gates: ['Torniquetes Calzada de Tlalpan', 'Acceso Insurgentes', 'Puerta 1 (Principal)', 'Puerta 3'],
    matches: [
      { id: 'm7', teams: 'Mexico vs Canada', dateTime: '2026-06-11T19:00:00', stage: 'Opening Match', score: '1 - 1', attendance: 87523 },
      { id: 'm8', teams: 'England vs Netherlands', dateTime: '2026-07-05T15:00:00', stage: 'Quarterfinals', attendance: 85200 },
      { id: 'm9', teams: 'Argentina vs Morocco', dateTime: '2026-06-24T20:00:00', stage: 'Round of 32', score: '3 - 1', attendance: 86400 }
    ]
  },
  {
    id: 'bcplace',
    name: 'Vancouver Stadium (BC Place)',
    city: 'Vancouver, BC',
    country: 'Canada',
    capacity: 54500,
    gates: ['Gate A (Terry Fox Plaza)', 'Gate C', 'Gate E (Robson St)', 'Gate H'],
    matches: [
      { id: 'm10', teams: 'Canada vs Saudi Arabia', dateTime: '2026-06-14T17:00:00', stage: 'Group Stage', score: '2 - 0', attendance: 54100 },
      { id: 'm11', teams: 'Portugal vs Uruguay', dateTime: '2026-07-02T19:00:00', stage: 'Round of 16', attendance: 53900 }
    ]
  }
];

// Seed incidents for startup
export const INITIAL_INCIDENTS: Incident[] = [
  {
    id: 'inc-1',
    section: 'Section 114 (Lower Bowl)',
    type: 'cleaning',
    description: 'Bote de refresco derramado en la fila F asiento 12, está pegajoso y resbaladizo.',
    reportedAt: '2026-07-17T20:45:00-07:00',
    status: 'pending',
    originalLanguage: 'Spanish',
    translatedDescription: 'Soft drink can spilled in row F seat 12, it is sticky and slippery.',
    suggestedAction: 'Dispatch standard cleaning crew with wet mop and warning sign to Section 114 Row F.'
  },
  {
    id: 'inc-2',
    section: 'Gate B Security Checkpoint',
    type: 'infrastructure',
    description: 'The automated metal detector lane 3 is showing a calibration error, causing a longer queue.',
    reportedAt: '2026-07-17T20:50:00-07:00',
    status: 'dispatched',
    originalLanguage: 'English',
    translatedDescription: 'The automated metal detector lane 3 is showing a calibration error, causing a longer queue.',
    suggestedAction: 'Send technician to Lane 3 and open temporary Manual Screening Lane 3B.'
  },
  {
    id: 'inc-3',
    section: 'Section 230 Concourse',
    type: 'accessibility',
    description: 'L\'ascenseur ouest menant au niveau 2 est bloqué, une personne en fauteuil roulant attend de l\'aide.',
    reportedAt: '2026-07-17T20:55:00-07:00',
    status: 'pending',
    originalLanguage: 'French',
    translatedDescription: 'The west elevator leading to level 2 is stuck, a wheelchair user is waiting for assistance.',
    suggestedAction: 'Dispatch elevator maintenance engineer immediately. Alert nearby usher team at Section 230 to assist wheelchair user via alternative ramp route if desired.'
  },
  {
    id: 'inc-4',
    section: 'Section 105 Concession Row',
    type: 'medical',
    description: 'Ein älterer Fan klagt über Schwindelgefühl und extreme Hitze im Bereich des Essensstandes.',
    reportedAt: '2026-07-17T21:02:00-07:00',
    status: 'pending',
    originalLanguage: 'German',
    translatedDescription: 'An elderly fan complains of dizziness and extreme heat in the concession area.',
    suggestedAction: 'Dispatch First Aid responder unit 3 to Section 105 Concession Row immediately. Provide water and a wheelchair.'
  }
];

export interface ScenarioPreset {
  id: string;
  name: string;
  description: string;
  sensors: SensorData[];
}

export const SCENARIO_PRESETS: ScenarioPreset[] = [
  {
    id: 'normal',
    name: 'Normal Operations',
    description: 'Typical fluid scenario. Average entry time is under 10 mins, concession queues are short, all facilities operating smoothly.',
    sensors: [
      { id: 's1', label: 'Gate Entrance Flow', type: 'gate', value: 35, status: 'normal', lastUpdated: 'Just now', location: 'Gate A Entrance' },
      { id: 's2', label: 'Gate Entrance Flow', type: 'gate', value: 42, status: 'normal', lastUpdated: 'Just now', location: 'Gate B Entrance' },
      { id: 's3', label: 'Main Concourse Density', type: 'concourse', value: 55, status: 'normal', lastUpdated: 'Just now', location: 'Concourse Level 1' },
      { id: 's4', label: 'Sec 112 Concessions Queue', type: 'concession', value: 4, status: 'normal', lastUpdated: 'Just now', location: 'Section 112' },
      { id: 's5', label: 'Sec 128 Concessions Queue', type: 'concession', value: 6, status: 'normal', lastUpdated: 'Just now', location: 'Section 128' },
      { id: 's6', label: 'West Elevator Status', type: 'concourse', value: 95, status: 'normal', lastUpdated: 'Just now', location: 'West Concourse' },
      { id: 's7', label: 'Shuttle Bus Loop Transit', type: 'transport', value: 3, status: 'normal', lastUpdated: 'Just now', location: 'Shuttle Terminal' },
      { id: 's8', label: 'Subway Central Line Link', type: 'transport', value: 2, status: 'normal', lastUpdated: 'Just now', location: 'Subway Station' }
    ]
  },
  {
    id: 'prematch',
    name: 'Pre-Match Gate Bottleneck',
    description: '60 minutes before kickoff. Extreme bottlenecking at Gate B due to ticket reader issues, causing crowds to swell in the plaza.',
    sensors: [
      { id: 's1', label: 'Gate Entrance Flow', type: 'gate', value: 45, status: 'normal', lastUpdated: 'Just now', location: 'Gate A Entrance' },
      { id: 's2', label: 'Gate Entrance Flow', type: 'gate', value: 92, status: 'critical', lastUpdated: 'Just now', location: 'Gate B Entrance' },
      { id: 's3', label: 'Main Concourse Density', type: 'concourse', value: 72, status: 'warning', lastUpdated: 'Just now', location: 'Concourse Level 1' },
      { id: 's4', label: 'Sec 112 Concessions Queue', type: 'concession', value: 8, status: 'normal', lastUpdated: 'Just now', location: 'Section 112' },
      { id: 's5', label: 'Sec 128 Concessions Queue', type: 'concession', value: 12, status: 'warning', lastUpdated: 'Just now', location: 'Section 128' },
      { id: 's6', label: 'West Elevator Status', type: 'concourse', value: 85, status: 'normal', lastUpdated: 'Just now', location: 'West Concourse' },
      { id: 's7', label: 'Shuttle Bus Loop Transit', type: 'transport', value: 15, status: 'warning', lastUpdated: 'Just now', location: 'Shuttle Terminal' },
      { id: 's8', label: 'Subway Central Line Link', type: 'transport', value: 5, status: 'normal', lastUpdated: 'Just now', location: 'Subway Station' }
    ]
  },
  {
    id: 'halftime',
    name: 'Half-Time Concessions Rush',
    description: 'During the 15-minute half-time break. Severe congestion on concourses, with restroom and snack bar lines peaking at over 20 minutes.',
    sensors: [
      { id: 's1', label: 'Gate Entrance Flow', type: 'gate', value: 5, status: 'normal', lastUpdated: 'Just now', location: 'Gate A Entrance' },
      { id: 's2', label: 'Gate Entrance Flow', type: 'gate', value: 8, status: 'normal', lastUpdated: 'Just now', location: 'Gate B Entrance' },
      { id: 's3', label: 'Main Concourse Density', type: 'concourse', value: 96, status: 'critical', lastUpdated: 'Just now', location: 'Concourse Level 1' },
      { id: 's4', label: 'Sec 112 Concessions Queue', type: 'concession', value: 24, status: 'critical', lastUpdated: 'Just now', location: 'Section 112' },
      { id: 's5', label: 'Sec 128 Concessions Queue', type: 'concession', value: 18, status: 'warning', lastUpdated: 'Just now', location: 'Section 128' },
      { id: 's6', label: 'West Elevator Status', type: 'concourse', value: 65, status: 'normal', lastUpdated: 'Just now', location: 'West Concourse' },
      { id: 's7', label: 'Shuttle Bus Loop Transit', type: 'transport', value: 2, status: 'normal', lastUpdated: 'Just now', location: 'Shuttle Terminal' },
      { id: 's8', label: 'Subway Central Line Link', type: 'transport', value: 0, status: 'normal', lastUpdated: 'Just now', location: 'Subway Station' }
    ]
  },
  {
    id: 'postmatch',
    name: 'Post-Match Evacuation / Transport Delay',
    description: 'Immediately following match conclusion. 80,000+ fans exiting. Metro trains are delayed, and shuttle bus queue is exceeding capacity.',
    sensors: [
      { id: 's1', label: 'Gate Entrance Flow', type: 'gate', value: 10, status: 'normal', lastUpdated: 'Just now', location: 'Gate A Entrance' },
      { id: 's2', label: 'Gate Entrance Flow', type: 'gate', value: 15, status: 'normal', lastUpdated: 'Just now', location: 'Gate B Entrance' },
      { id: 's3', label: 'Main Concourse Density', type: 'concourse', value: 88, status: 'warning', lastUpdated: 'Just now', location: 'Concourse Level 1' },
      { id: 's4', label: 'Sec 112 Concessions Queue', type: 'concession', value: 2, status: 'normal', lastUpdated: 'Just now', location: 'Section 112' },
      { id: 's5', label: 'Sec 128 Concessions Queue', type: 'concession', value: 1, status: 'normal', lastUpdated: 'Just now', location: 'Section 128' },
      { id: 's6', label: 'West Elevator Status', type: 'concourse', value: 98, status: 'critical', lastUpdated: 'Just now', location: 'West Concourse' },
      { id: 's7', label: 'Shuttle Bus Loop Transit', type: 'transport', value: 28, status: 'critical', lastUpdated: 'Just now', location: 'Shuttle Terminal' },
      { id: 's8', label: 'Subway Central Line Link', type: 'transport', value: 35, status: 'critical', lastUpdated: 'Just now', location: 'Subway Station' }
    ]
  }
];

export const MOCK_STADIUM_FAQS = [
  { q: "Where can I find wheelchair-accessible seating?", a: "Accessible seating is available in all tiers. On Level 1, elevators are located near Sections 110 and 132. Please look for ushers in blue vests for prioritized boarding." },
  { q: "Can I bring a camera to the stadium?", a: "Cameras with lenses less than 6 inches (15cm) long are permitted. Tripods, monopods, and professional video equipment are prohibited without a media pass." },
  { q: "What is the bag policy for the FIFA World Cup 2026?", a: "Only clear bags smaller than 12x6x12 inches (30x15x30 cm) or small clutch bags smaller than 4.5x6.5 inches (11x16 cm) are permitted." },
  { q: "How can I take public transit to the stadium?", a: "The best route is the Central Subway Line directly to Stadium Station, or the Free Express Shuttle running from the Central Bus Terminal every 5 minutes." },
  { q: "What sustainability initiatives are in place?", a: "We feature zero-waste concession packaging, a 50% discount on drinks when reusing cup containers, and reverse recycling vending machines near Sections 108 and 224." }
];
