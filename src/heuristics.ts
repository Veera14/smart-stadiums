/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { SensorData, Incident, OperationalAnalysisResult } from './types';

export const generateLocalAnalysis = (
  currentSensors: SensorData[],
  currentIncidents: Incident[],
  stadiumName: string
): OperationalAnalysisResult => {
  // 1. Calculate safety score
  let safetyRating = 98;
  currentSensors.forEach(s => {
    if (s.status === 'critical') safetyRating -= 12;
    if (s.status === 'warning') safetyRating -= 4;
  });
  currentIncidents.forEach(inc => {
    if (inc.status === 'pending') safetyRating -= 8;
    if (inc.status === 'dispatched') safetyRating -= 3;
  });
  safetyRating = Math.max(15, Math.min(100, safetyRating));

  // 2. Identify concourse, gate, and transport statuses
  const gateSensors = currentSensors.filter(s => s.type === 'gate');
  const criticalGates = gateSensors.filter(s => s.status === 'critical');
  const warningGates = gateSensors.filter(s => s.status === 'warning');
  
  let gateStatus = "Normal flow";
  if (criticalGates.length > 0) {
    gateStatus = `Severe bottleneck at ${criticalGates[0].location}`;
  } else if (warningGates.length > 0) {
    gateStatus = `Increased queues at ${warningGates[0].location}`;
  }

  const concourseSensors = currentSensors.filter(s => s.type === 'concourse' || s.type === 'concession');
  const criticalConcourse = concourseSensors.filter(s => s.status === 'critical');
  const warningConcourse = concourseSensors.filter(s => s.status === 'warning');

  let concourseStatus = "Fluid movement";
  if (criticalConcourse.length > 0) {
    concourseStatus = `Critical bottleneck at ${criticalConcourse[0].location}`;
  } else if (warningConcourse.length > 0) {
    concourseStatus = `Moderate density at ${warningConcourse[0].location}`;
  }

  const transportSensors = currentSensors.filter(s => s.type === 'transport');
  const criticalTransport = transportSensors.filter(s => s.status === 'critical');
  const warningTransport = transportSensors.filter(s => s.status === 'warning');

  let transportStatus = "On-schedule services";
  if (criticalTransport.length > 0) {
    transportStatus = `Severe delay at ${criticalTransport[0].location}`;
  } else if (warningTransport.length > 0) {
    transportStatus = `Minor queue delays at ${warningTransport[0].location}`;
  }

  // 3. Create executive summary
  let executiveSummary = `Operations at ${stadiumName} are generally functional. `;
  if (safetyRating < 70) {
    executiveSummary = `Urgent operational bottlenecks detected. Focus on resolving terminal delays at transit lines and deploying stewards to high-occupancy gate plazas.`;
  } else if (safetyRating < 85) {
    executiveSummary = `Stadium conditions are stable but require monitoring. Specific gate checkpoints and concourse sections are showing peak load behaviors.`;
  } else {
    executiveSummary = `Excellent operational fluidness. All main thoroughfares, transit hubs, and security check lanes are performing within optimal safety limits.`;
  }

  // 4. Alerts
  const topAlerts: string[] = [];
  currentSensors.forEach(s => {
    if (s.status === 'critical') {
      topAlerts.push(`Critical wait levels detected at ${s.location} (${s.label})`);
    } else if (s.status === 'warning') {
      topAlerts.push(`Increased occupancy check required at ${s.location}`);
    }
  });
  currentIncidents.forEach(inc => {
    if (inc.status === 'pending') {
      topAlerts.push(`Unresolved ${inc.type} incident at ${inc.section}`);
    }
  });
  if (topAlerts.length === 0) {
    topAlerts.push("All clear. Baseline systems performing normally.");
  }

  // 5. Recommendations
  const recommendations: Array<{
    title: string;
    action: string;
    priority: 'HIGH' | 'MEDIUM' | 'LOW';
    category: string;
  }> = [];

  // Add customized recommendations depending on what sensors are high
  currentSensors.forEach(s => {
    if (s.status === 'critical') {
      if (s.type === 'gate') {
        recommendations.push({
          title: `Divert Entrance flow from ${s.location}`,
          action: `Deploy auxiliary guides to direct fans to alternative, lower-traffic entrances. Verify ticket scanner terminal diagnostics.`,
          priority: 'HIGH',
          category: 'crowd'
        });
      } else if (s.type === 'concession') {
        recommendations.push({
          title: `Activate Mobile Concession Orders`,
          action: `Promote mobile ordering incentives for concession queues in nearby sections. Dispatch floaters to speed up checkout.`,
          priority: 'HIGH',
          category: 'infrastructure'
        });
      } else if (s.type === 'transport') {
        recommendations.push({
          title: `Increase Transit Frequency`,
          action: `Request additional rapid transit carriages or deploy backup shuttle buses immediately to relieve crowd buildup.`,
          priority: 'HIGH',
          category: 'transportation'
        });
      }
    }
  });

  // Default recommendations if list is short
  if (recommendations.length < 3) {
    recommendations.push({
      title: "Deploy Zero-Waste Refuse Guides",
      action: "Assign staff to major seating exit gates with recycling rewards instructions to support our 50% bottle return incentive program.",
      priority: 'LOW',
      category: 'sustainability'
    });
  }
  if (recommendations.length < 3) {
    recommendations.push({
      title: "Activate Accessibility Shuttle Loops",
      action: "Command wheelchair-accessible golf carts to standby at outer parking gates to assist seniors and mobility-impaired guests.",
      priority: 'MEDIUM',
      category: 'accessibility'
    });
  }
  if (recommendations.length < 3) {
    recommendations.push({
      title: "Dynamic Gate Balance Routing",
      action: "Update stadium jumbo-screens and digital companion app alerts to redirect guests to under-utilized side exits.",
      priority: 'MEDIUM',
      category: 'navigation'
    });
  }

  return {
    safetyRating,
    concourseStatus,
    gateStatus,
    transportStatus,
    executiveSummary,
    topAlerts: topAlerts.slice(0, 3),
    recommendations: recommendations.slice(0, 3)
  };
};

/**
 * Heuristically generates a local concierge answer when Gemini API is rate-limited or offline.
 * Supports basic keywords in English, Spanish, and French.
 */
export function generateLocalConciergeResponse(
  queryText: string,
  stadiumName: string,
  stadiumCity: string,
  stadiumCountry: string,
  faqList: Array<{ q: string; a: string }>
): string {
  const queryLower = queryText.toLowerCase();

  if (queryLower.includes('bag') || queryLower.includes('policy') || queryLower.includes('bolso') || queryLower.includes('mochila')) {
    return `💼 [Offline Assistant Backup]: For FIFA World Cup 2026, the stadium enforces a strict Clear Bag Policy. Fans may bring one clear plastic bag not exceeding 12" x 6" x 12" (30 x 15 x 30 cm), or a small clutch purse under 4.5" x 6.5" (11 x 16 cm). All non-clear backpacks are strictly prohibited.`;
  }
  
  if (queryLower.includes('elevator') || queryLower.includes('wheelchair') || queryLower.includes('accessible') || queryLower.includes('silla de ruedas') || queryLower.includes('rampa')) {
    return `♿ [Offline Assistant Backup]: Wheelchair-accessible elevators are located at Gates A, C, and G. There are also designated companion seating areas in Sections 108, 124, 204, and 315. Accessible golf carts are available outside Parking Lot E to transport fans to the main plaza.`;
  }
  
  if (queryLower.includes('transit') || queryLower.includes('shuttle') || queryLower.includes('bus') || queryLower.includes('train') || queryLower.includes('shuttles')) {
    return `🚌 [Offline Assistant Backup]: Complimentary public transit shuttle buses run continuously from 3 hours pre-match until 2 hours post-match. Pick-up and drop-off stations are positioned at the North Plaza Transit Loop (directly outside Gate B).`;
  }
  
  if (queryLower.includes('recycle') || queryLower.includes('reward') || queryLower.includes('cup') || queryLower.includes('reciclar')) {
    return `♻️ [Offline Assistant Backup]: Help us reach our 50% sustainability target! Return your reusable beverage cup to any 'Green Goal' kiosk located on the main concourse to receive a 50% refund or entry into the grand prize draw for final match tickets.`;
  }

  // Check matching question from mock FAQs if possible
  const matchedFaq = faqList.find(faq => 
    queryLower.includes(faq.q.toLowerCase()) || 
    faq.q.toLowerCase().split(' ').some(word => word.length > 4 && queryLower.includes(word))
  );

  if (matchedFaq) {
    return `💡 [Offline Assistant Backup]: Regarding "${matchedFaq.q}": ${matchedFaq.a}`;
  }

  return `🤖 [Offline Assistant Backup]: I'm currently running in local backup mode to protect your session from rate limits. I'm connected to the operations dashboard of ${stadiumName} located in ${stadiumCity}, ${stadiumCountry}. 

You can ask me about:
1. Clear Bag Policies
2. Wheelchair Elevators
3. Shuttle Transit Loops
4. Reusable Cup Recycling Rewards`;
}

/**
 * Heuristically categorizes and translates fan reported incidents when Gemini API is rate-limited or offline.
 * Infers language (English/Spanish/French) and maps keywords to categories like medical or accessibility.
 */
export function generateLocalIncidentTranslation(
  description: string,
  section: string,
  defaultType: string
): {
  type: string;
  originalLanguage: string;
  translatedDescription: string;
  suggestedAction: string;
} {
  const textLower = description.toLowerCase();
  let type = defaultType;
  let originalLanguage = "English";

  // Language heuristics
  if (textLower.includes(' la ') || textLower.includes(' el ') || textLower.includes('está') || textLower.includes(' para ') || textLower.includes('con ')) {
    originalLanguage = "Spanish";
  } else if (textLower.includes(' oui ') || textLower.includes(' le ') || textLower.includes(' la ') || textLower.includes('est ')) {
    originalLanguage = "French";
  }

  // Type heuristics
  if (textLower.includes('spill') || textLower.includes('water') || textLower.includes('wet') || textLower.includes('mojado') || textLower.includes('limpieza') || textLower.includes('basura') || textLower.includes('fuite') || textLower.includes('déchet') || textLower.includes('renversé') || textLower.includes('nettoyage')) {
    type = 'cleaning';
  } else if (textLower.includes('fight') || textLower.includes('security') || textLower.includes('stole') || textLower.includes('police') || textLower.includes('seguridad') || textLower.includes('robo') || textLower.includes('bagarre') || textLower.includes('vol') || textLower.includes('sécurité')) {
    type = 'security';
  } else if (textLower.includes('hurt') || textLower.includes('doctor') || textLower.includes('medical') || textLower.includes('blood') || textLower.includes('faint') || textLower.includes('ayuda') || textLower.includes('blessé') || textLower.includes('médecin') || textLower.includes('sang') || textLower.includes('malade')) {
    type = 'medical';
  } else if (textLower.includes('wheelchair') || textLower.includes('elevador') || textLower.includes('elevator') || textLower.includes('access') || textLower.includes('rampa') || textLower.includes('fauteuil') || textLower.includes('ascenseur') || textLower.includes('accès')) {
    type = 'accessibility';
  } else if (textLower.includes('light') || textLower.includes('broken') || textLower.includes('gate') || textLower.includes('leak') || textLower.includes('ruptura') || textLower.includes('cassé') || textLower.includes('panne') || textLower.includes('grille')) {
    type = 'infrastructure';
  }

  const translatedDescription = originalLanguage === 'English' ? description : `[Heuristic Translation]: ${description}`;
  const suggestedAction = `Deploy ${type} team to Section ${section} to handle reported condition.`;

  return {
    type,
    originalLanguage,
    translatedDescription,
    suggestedAction
  };
}

