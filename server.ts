/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini Client
const apiKey = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Helper: Ensure API Key is present, fail-fast gracefully
const checkApiKey = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (!process.env.GEMINI_API_KEY) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is not configured in the environment. Please add it in Settings > Secrets.'
    });
  }
  next();
};

/**
 * Endpoint: POST /api/chat
 * Handles conversational queries for both Fan and Staff portals.
 * Incorporates grounding metadata (FAQ context, stadium info, sensor logs).
 */
app.post('/api/chat', checkApiKey, async (req, res) => {
  try {
    const { messages, role, currentStadium, sensors, incidents, faqList } = req.body;

    if (!messages || !Array.isArray(messages)) {
      return res.status(400).json({ error: 'Missing messages array in body.' });
    }

    // Prepare systemic background context based on role
    let systemInstruction = '';
    if (role === 'staff') {
      systemInstruction = `
You are the FIFA World Cup 2026 Venue Command co-pilot, a highly trained operational intelligence system helping organizers and staff run stadium operations flawlessly.
Current Stadium: ${JSON.stringify(currentStadium)}
Real-time Sensor Readings: ${JSON.stringify(sensors)}
Active Incidents: ${JSON.stringify(incidents)}

Provide brief, professional, data-driven, and highly actionable answers. 
Highlight critical bottlenecks (e.g., congestion, delays, medical/security incidents) and outline precise step-by-step dispatch actions.
Use a professional, calm, tactical commander tone. Use clear bullet points.
`;
    } else {
      systemInstruction = `
You are the World Cup 2026 Fan Multilingual Concierge, a warm, supportive, and brilliant stadium guide helping fans from all over the world enjoy an optimal tournament experience.
Current Stadium: ${JSON.stringify(currentStadium)}
Standard FAQ Guidelines: ${JSON.stringify(faqList)}
Real-time Stadium Status Context (Only share general helpful warnings if critical): ${JSON.stringify(sensors)}

Guidelines:
1. Always respond in the language used by the fan (e.g. if they ask in Spanish, answer in Spanish. French -> French, etc.).
2. Focus on navigation, transport routes, clear bag policies, accessibility routes (elevators/wheelchair ramps), and sustainability incentives.
3. Be friendly, energetic, precise, and concise. Never say "I am an AI", instead sound like a premium official venue host.
4. Keep answers short (usually 2-3 sentences) so they are easy to read on mobile phones while walking.
`;
    }

    // Format chat messages for @google/genai SDK
    // The last message is the user prompt. Prior messages are past conversations.
    const userMessage = messages[messages.length - 1]?.text || '';
    
    // Convert history messages (excluding last user message) to contents format
    const history = messages.slice(0, messages.length - 1).map((msg: any) => ({
      role: msg.sender === 'user' ? 'user' : 'model',
      parts: [{ text: msg.text }]
    }));

    // Call generateContent
    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: [
        ...history,
        { role: 'user', parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.3,
      }
    });

    const replyText = response.text || "I apologize, but I am unable to process that request at the moment. Please ask another stadium assistant.";
    res.json({ text: replyText });
  } catch (error: any) {
    console.error('Error in /api/chat:', error);
    res.status(500).json({ error: error.message || 'Error communicating with Gemini' });
  }
});

/**
 * Endpoint: POST /api/analyze-operations
 * Evaluates simulated sensor data and active incidents, returning strategic summaries and recommendations for organizers.
 */
app.post('/api/analyze-operations', checkApiKey, async (req, res) => {
  try {
    const { stadium, sensors, incidents } = req.body;

    const prompt = `
Please analyze the current operational health of ${stadium.name} located in ${stadium.city}.
Sensors: ${JSON.stringify(sensors)}
Incidents: ${JSON.stringify(incidents)}

Provide an operational intelligence report in JSON format with the following schema:
{
  "safetyRating": number (1 to 100),
  "concourseStatus": string (e.g., "Fluid", "Congested", "Critical bottleneck at Level 1"),
  "gateStatus": string (e.g., "Normal queue times", "Severe bottleneck at Gate B"),
  "transportStatus": string (e.g., "Shuttles running on schedule", "Metro delay 25 mins"),
  "executiveSummary": "A concise 2-sentence tactical summary of the stadium operations.",
  "topAlerts": ["Alert string 1", "Alert string 2"],
  "recommendations": [
    {
      "title": "Actionable Recommendation Title",
      "action": "Detailed step-by-step operational response description.",
      "priority": "HIGH" | "MEDIUM" | "LOW",
      "category": "navigation" | "crowd" | "accessibility" | "transportation" | "sustainability" | "infrastructure"
    }
  ]
}
Return valid JSON ONLY. Do not wrap in markdown or backticks.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            safetyRating: { type: Type.INTEGER },
            concourseStatus: { type: Type.STRING },
            gateStatus: { type: Type.STRING },
            transportStatus: { type: Type.STRING },
            executiveSummary: { type: Type.STRING },
            topAlerts: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            },
            recommendations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  title: { type: Type.STRING },
                  action: { type: Type.STRING },
                  priority: { type: Type.STRING },
                  category: { type: Type.STRING }
                },
                required: ['title', 'action', 'priority', 'category']
              }
            }
          },
          required: ['safetyRating', 'concourseStatus', 'gateStatus', 'transportStatus', 'executiveSummary', 'topAlerts', 'recommendations']
        }
      }
    });

    const parsedData = JSON.parse(response.text || '{}');
    res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/analyze-operations:', error);
    res.status(500).json({ error: error.message || 'Error performing operations analysis.' });
  }
});

/**
 * Endpoint: POST /api/translate-incident
 * Translates incident descriptions written in any language to English,
 * categorizes them, and drafts an automatic suggested operational action.
 */
app.post('/api/translate-incident', checkApiKey, async (req, res) => {
  try {
    const { section, description } = req.body;

    if (!section || !description) {
      return res.status(400).json({ error: 'Section and description are required.' });
    }

    const prompt = `
Analyze the following stadium incident:
Section: "${section}"
Description: "${description}"

1. Detect the original language of the description (e.g. "Spanish", "French", "Arabic", "English", etc.).
2. Translate the description to English with absolute precision.
3. Categorize the incident type strictly as one of: "cleaning", "security", "medical", "accessibility", "infrastructure", "other".
4. Formulate a 1-sentence highly tactical Suggested Action for the stadium staff dispatch team.

Output your response as JSON with this schema:
{
  "originalLanguage": "Detected language",
  "translatedDescription": "English translation",
  "type": "cleaning | security | medical | accessibility | infrastructure | other",
  "suggestedAction": "Tactical action to execute"
}
Return valid JSON ONLY. Do not wrap in markdown or backticks.
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            originalLanguage: { type: Type.STRING },
            translatedDescription: { type: Type.STRING },
            type: { type: Type.STRING },
            suggestedAction: { type: Type.STRING }
          },
          required: ['originalLanguage', 'translatedDescription', 'type', 'suggestedAction']
        }
      }
    });

    const data = JSON.parse(response.text || '{}');
    res.json(data);
  } catch (error: any) {
    console.error('Error in /api/translate-incident:', error);
    res.status(500).json({ error: error.message || 'Error processing incident report.' });
  }
});

// Setup Vite Dev Server / Static files
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT} with environment ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer();
