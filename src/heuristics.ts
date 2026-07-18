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
