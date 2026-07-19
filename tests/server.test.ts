/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Set environment variables BEFORE importing server.ts to prevent it from binding to port 3000
process.env.NODE_ENV = 'test';
process.env.GEMINI_API_KEY = 'mock-test-key';

import test, { before, after } from 'node:test';
import assert from 'node:assert';
import { Server } from 'http';

// Dynamically import server after env variables are initialized
const { app: testApp, ai: testAi } = await import('../server');

let server: Server;
let baseUrl: string;
const originalGenerateContent = testAi.models.generateContent;

before(() => {
  if (!originalGenerateContent) {
    throw new Error('Could not back up original generateContent function');
  }

  // Monkey-patch Gemini API generateContent method to return static mock responses
  testAi.models.generateContent = async (options: any): Promise<any> => {
    const promptStr = typeof options.contents === 'string' 
      ? options.contents 
      : JSON.stringify(options.contents || options);

    if (promptStr.includes('analyze') || promptStr.includes('operational health')) {
      return {
        text: JSON.stringify({
          safetyRating: 92,
          concourseStatus: "Moderate density at Sec 112 Concessions",
          gateStatus: "Normal queue times",
          transportStatus: "On-schedule services",
          executiveSummary: "Mocked stadium operational summary.",
          topAlerts: ["Unresolved medical incident at Section 105"],
          recommendations: [
            {
              title: "Deploy Medical Stewards",
              action: "Send first-aid responder to Section 105 to assist fan.",
              priority: "HIGH",
              category: "accessibility"
            }
          ]
        })
      };
    } else if (promptStr.includes('incident') || promptStr.includes('stadium incident')) {
      return {
        text: JSON.stringify({
          originalLanguage: "French",
          translatedDescription: "The elevator is stuck.",
          type: "accessibility",
          suggestedAction: "Send technician to West Elevator."
        })
      };
    }

    return {
      text: "Mocked Multilingual Fan Concierge answer from Gemini."
    };
  };

  // Bind server to an arbitrary unused port (port 0)
  server = testApp.listen(0);
  const port = (server.address() as any).port;
  baseUrl = `http://localhost:${port}`;
});

after(() => {
  if (server) {
    server.close();
  }
  // Restore original Gemini generateContent function
  testAi.models.generateContent = originalGenerateContent;
});

test('POST /api/chat - Fan Concierge chatbot integration', async () => {
  const payload = {
    messages: [
      { id: '1', sender: 'user', text: 'Where is Gate A?', timestamp: '12:00 PM' }
    ],
    role: 'fan',
    currentStadium: { id: 'metlife', name: 'MetLife', city: 'East Rutherford', country: 'USA', capacity: 80000, gates: [], matches: [] },
    sensors: [],
    faqList: []
  };

  const response = await fetch(`${baseUrl}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(response.status, 200);
  const data = await response.json();
  assert.strictEqual(data.text, 'Mocked Multilingual Fan Concierge answer from Gemini.');
});

test('POST /api/analyze-operations - health diagnostics reports', async () => {
  const payload = {
    stadium: { id: 'metlife', name: 'MetLife', city: 'East Rutherford', country: 'USA', capacity: 80000, gates: [], matches: [] },
    sensors: [
      { id: 's1', label: 'Gate A', type: 'gate', value: 90, status: 'critical', lastUpdated: '', location: 'Gate A' }
    ],
    incidents: []
  };

  const response = await fetch(`${baseUrl}/api/analyze-operations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(response.status, 200);
  const data = await response.json();
  assert.strictEqual(data.safetyRating, 92);
  assert.strictEqual(data.concourseStatus, 'Moderate density at Sec 112 Concessions');
  assert.strictEqual(data.recommendations[0].title, 'Deploy Medical Stewards');
});

test('POST /api/translate-incident - multi-language parsing pipeline', async () => {
  const payload = {
    section: 'West Elevator',
    description: "L'ascenseur est bloqué"
  };

  const response = await fetch(`${baseUrl}/api/translate-incident`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  assert.strictEqual(response.status, 200);
  const data = await response.json();
  assert.strictEqual(data.originalLanguage, 'French');
  assert.strictEqual(data.type, 'accessibility');
  assert.strictEqual(data.suggestedAction, 'Send technician to West Elevator.');
});

test('POST /api/translate-incident - fails with 400 when body is incomplete', async () => {
  const response = await fetch(`${baseUrl}/api/translate-incident`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ section: 'Gate B' }) // Missing description
  });

  assert.strictEqual(response.status, 400);
  const data = await response.json();
  assert.strictEqual(data.error, 'Section and description are required.');
});

test('POST /api/chat - fails with 500 when API key is missing', async () => {
  const originalKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const response = await fetch(`${baseUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [{ id: '1', sender: 'user', text: 'Hello', timestamp: '12:00' }],
        role: 'fan'
      })
    });

    assert.strictEqual(response.status, 500);
    const data = await response.json();
    assert.match(data.error, /GEMINI_API_KEY is not configured/);
  } finally {
    process.env.GEMINI_API_KEY = originalKey;
  }
});
