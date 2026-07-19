/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { SensorData } from '../types';
import { MapPin, Info } from 'lucide-react';

interface StadiumMapProps {
  sensors: SensorData[];
  onSelectLocation?: (location: string) => void;
  selectedLocation?: string;
}

export default function StadiumMap({ sensors, onSelectLocation, selectedLocation }: StadiumMapProps) {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent, location: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectLocation?.(location);
    }
  };

  // Maps selected visual hotspots and locations to active animated dash SVG paths
  const getNavigationPath = (location: string): { d: string; color: string; label: string } | null => {
    const norm = location.toLowerCase();
    
    if (norm.includes('elevator') || norm.includes('ascenseur') || norm.includes('accessibility')) {
      // Accessibility elevators route (West Gate A to West Elevator) - Colored Cyan
      return {
        d: 'M 50 150 Q 60 190 90 220',
        color: 'stroke-cyan-400',
        label: 'Wheelchair-Accessible elevator path'
      };
    }
    
    if (norm.includes('shuttle') || norm.includes('transit') || norm.includes('navette') || norm.includes('transport')) {
      // Transit loop path (West Gate A to Shuttle Loop) - Colored Amber
      return {
        d: 'M 50 150 Q 80 230 150 270',
        color: 'stroke-amber-400',
        label: 'Transit shuttle loop route'
      };
    }
    
    if (norm.includes('subway') || norm.includes('metro') || norm.includes('subterráneo')) {
      // Subway rail path (East Gate B to Subway Link) - Colored Indigo
      return {
        d: 'M 350 150 Q 320 230 250 270',
        color: 'stroke-indigo-400',
        label: 'Subway station access route'
      };
    }
    
    if (norm.includes('level 1') || norm.includes('concourse')) {
      // Concourse Level 1 path (West Gate A to Level 1 Concourse) - Colored Emerald
      return {
        d: 'M 50 150 C 70 90, 120 70, 200 65',
        color: 'stroke-emerald-400',
        label: 'Concourse level navigation path'
      };
    }
    
    if (norm.includes('112 concessions') || norm.includes('112')) {
      // Gate A to Section 112 Concessions - Colored Emerald
      return {
        d: 'M 50 150 Q 90 110 130 90',
        color: 'stroke-emerald-400',
        label: 'Concessions 112 access path'
      };
    }
    
    if (norm.includes('128 concessions') || norm.includes('128')) {
      // Gate B to Section 128 Concessions - Colored Emerald
      return {
        d: 'M 350 150 Q 310 110 270 90',
        color: 'stroke-emerald-400',
        label: 'Concessions 128 access path'
      };
    }
    
    if (norm.includes('north grandstand')) {
      // Gate A to North Seating Tier - Colored Emerald
      return {
        d: 'M 50 150 Q 100 50 200 50',
        color: 'stroke-emerald-400',
        label: 'North Grandstand seating navigation path'
      };
    }
    
    if (norm.includes('south grandstand')) {
      // Gate A to South Seating Tier - Colored Emerald
      return {
        d: 'M 50 150 Q 100 250 200 250',
        color: 'stroke-emerald-400',
        label: 'South Grandstand seating navigation path'
      };
    }
    
    return null;
  };

  // Helper to get color according to sensor status
  const getStatusColor = (status: 'normal' | 'warning' | 'critical') => {
    switch (status) {
      case 'critical':
        return 'fill-rose-500 stroke-rose-600 ring-rose-300';
      case 'warning':
        return 'fill-amber-500 stroke-amber-600 ring-amber-300';
      case 'normal':
      default:
        return 'fill-emerald-500 stroke-emerald-600 ring-emerald-300';
    }
  };

  const getStatusBg = (status: 'normal' | 'warning' | 'critical') => {
    switch (status) {
      case 'critical':
        return 'bg-rose-50 border-rose-200 text-rose-700';
      case 'warning':
        return 'bg-amber-50 border-amber-200 text-amber-700';
      case 'normal':
      default:
        return 'bg-emerald-50 border-emerald-200 text-emerald-700';
    }
  };

  // Map sensor labels or locations to coordinates in our 400x300 simulated stadium SVG
  const getCoordinates = (id: string): { x: number; y: number } => {
    switch (id) {
      case 's1': return { x: 50, y: 150 };  // Gate A (West)
      case 's2': return { x: 350, y: 150 }; // Gate B (East)
      case 's3': return { x: 200, y: 65 };  // Concourse Level 1
      case 's4': return { x: 130, y: 90 };  // Sec 112 Concessions
      case 's5': return { x: 270, y: 90 };  // Sec 128 Concessions
      case 's6': return { x: 90, y: 220 };  // West Elevator
      case 's7': return { x: 150, y: 270 }; // Shuttle Loop
      case 's8': return { x: 250, y: 270 }; // Subway Central Link
      default: return { x: 200, y: 150 };
    }
  };

  return (
    <div className="relative bg-slate-900 border border-slate-800 rounded-2xl p-4 overflow-hidden h-[340px] flex flex-col justify-between">
      {/* Background World Cup aesthetic stripes */}
      <div className="absolute inset-0 opacity-5 pointer-events-none bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:16px_16px]"></div>

      {/* Header and Controls */}
      <div className="flex justify-between items-center z-10">
        <div>
          <span className="text-xs font-mono text-emerald-400 font-semibold tracking-wider uppercase">Live Stadium Visualizer</span>
          <h4 className="text-sm font-semibold text-slate-200">Interactive Hotspots Map</h4>
        </div>
        <div className="flex gap-2 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block"></span>
            <span>Normal</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block"></span>
            <span>Warning</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block"></span>
            <span>Critical</span>
          </div>
        </div>
      </div>

      {/* Main SVG Layout */}
      <div className="relative flex-1 flex justify-center items-center my-2">
        <svg viewBox="0 0 400 300" className="w-full h-full max-h-[240px] select-none" aria-label="Interactive Stadium Map">
          {/* Outer Stadium Wall (Grey Oval) */}
          <ellipse cx="200" cy="150" rx="170" ry="110" className="fill-slate-800/40 stroke-slate-700 stroke-2" />
          
          {/* Inner Stadium Seating Tier boundary */}
          <ellipse cx="200" cy="150" rx="130" ry="80" className="fill-slate-800/80 stroke-slate-600 stroke-1" />

          {/* Green Pitch (Soccer Field) */}
          <rect x="130" y="110" width="140" height="80" rx="4" className="fill-emerald-950 stroke-emerald-800 stroke-2 opacity-80" />
          
          {/* Pitch Lines */}
          <line x1="200" y1="110" x2="200" y2="190" className="stroke-emerald-800/50 stroke-1" />
          <circle cx="200" cy="150" r="20" className="fill-none stroke-emerald-800/50 stroke-1" />
          
          {/* Interactive Sectors Overlay (Decorative clickable zones) */}
          {/* North Tier */}
          <path d="M 100 70 Q 200 30 300 70 Q 270 90 200 80 Q 130 90 100 70 Z" 
                role="button"
                tabIndex={0}
                aria-label="North Grandstand (Level 2) select zone"
                aria-pressed={selectedLocation === 'North Grandstand (Level 2)'}
                onKeyDown={(e) => handleKeyDown(e, 'North Grandstand (Level 2)')}
                onClick={() => onSelectLocation?.('North Grandstand (Level 2)')}
                className={`fill-slate-700/20 hover:fill-emerald-500/10 stroke-slate-600/30 cursor-pointer focus:outline-none focus:fill-emerald-500/20 transition-colors ${
                  selectedLocation === 'North Grandstand (Level 2)' ? 'fill-emerald-500/20 stroke-emerald-500/50' : ''
                }`} />
          {/* South Tier */}
          <path d="M 100 230 Q 200 270 300 230 Q 270 210 200 220 Q 130 210 100 230 Z" 
                role="button"
                tabIndex={0}
                aria-label="South Grandstand (Level 2) select zone"
                aria-pressed={selectedLocation === 'South Grandstand (Level 2)'}
                onKeyDown={(e) => handleKeyDown(e, 'South Grandstand (Level 2)')}
                onClick={() => onSelectLocation?.('South Grandstand (Level 2)')}
                className={`fill-slate-700/20 hover:fill-emerald-500/10 stroke-slate-600/30 cursor-pointer focus:outline-none focus:fill-emerald-500/20 transition-colors ${
                  selectedLocation === 'South Grandstand (Level 2)' ? 'fill-emerald-500/20 stroke-emerald-500/50' : ''
                }`} />

          {/* Dynamic Navigation & Accessibility Route Overlay */}
          {selectedLocation && (() => {
            const navPath = getNavigationPath(selectedLocation);
            if (!navPath) return null;
            return (
              <g>
                {/* Glow underlay */}
                <path
                  d={navPath.d}
                  className={`fill-none stroke-[6px] opacity-35 blur-[2px] ${navPath.color}`}
                  aria-hidden="true"
                />
                {/* Animated dash overlay */}
                <path
                  d={navPath.d}
                  className={`fill-none stroke-2 animate-dash ${navPath.color}`}
                  aria-label={navPath.label}
                />
              </g>
            );
          })()}

          {/* Render Sensor Hotspots */}
          {sensors.map((sensor) => {
            const { x, y } = getCoordinates(sensor.id);
            const isHovered = hoveredItem === sensor.id;
            const isSelected = selectedLocation === sensor.location;
            
            return (
              <g key={sensor.id}
                 role="button"
                 tabIndex={0}
                 aria-label={`${sensor.location} (${sensor.label}). Status: ${sensor.status}. Value: ${sensor.value}${
                   sensor.type === 'gate' || sensor.type === 'concourse' ? '%' : ' mins'
                 }`}
                 aria-pressed={isSelected}
                 onKeyDown={(e) => handleKeyDown(e, sensor.location)}
                 onMouseEnter={() => setHoveredItem(sensor.id)}
                 onMouseLeave={() => setHoveredItem(null)}
                 onClick={() => onSelectLocation?.(sensor.location)}
                 className="cursor-pointer focus:outline-none ring-offset-slate-900 group">
                
                {/* Outer Ripple for Warnings/Criticals */}
                {sensor.status !== 'normal' && (
                  <circle cx={x} cy={y} r="16" className={`animate-ping opacity-25 ${
                    sensor.status === 'critical' ? 'fill-rose-400' : 'fill-amber-400'
                  }`} />
                )}

                {/* Hotspot Target Circle */}
                <circle cx={x} cy={y} r={isSelected ? "11" : isHovered ? "9" : "7"} 
                        className={`transition-all duration-200 stroke-white stroke-2 group-focus:stroke-emerald-400 ${getStatusColor(sensor.status)}`} />
                
                {/* Target Pin Marker Label (e.g. A, B, Concessions icon) */}
                <text x={x} y={y + 3} className="fill-white text-[8px] font-bold text-center" textAnchor="middle">
                  {sensor.type === 'gate' ? 'G' : sensor.type === 'concession' ? 'C' : sensor.type === 'transport' ? 'T' : 'E'}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Hover / Highlight Tooltip Overlay */}
        <div className="absolute bottom-1 left-2 right-2 pointer-events-none z-10">
          {hoveredItem ? (
            (() => {
              const sensor = sensors.find(s => s.id === hoveredItem);
              if (!sensor) return null;
              return (
                <div className={`p-2 rounded-xl border text-[11px] font-mono flex items-center justify-between backdrop-blur-md shadow-lg ${getStatusBg(sensor.status)}`}>
                  <div className="flex items-center gap-1.5 font-medium">
                    <MapPin size={12} className="shrink-0" />
                    <span>{sensor.location}: {sensor.label}</span>
                  </div>
                  <span className="font-bold">
                    {sensor.type === 'gate' || sensor.type === 'concourse' 
                      ? `${sensor.value}% Occupied` 
                      : sensor.type === 'concession' || sensor.type === 'restroom'
                      ? `${sensor.value} min queue`
                      : `${sensor.value} min delay`}
                  </span>
                </div>
              );
            })()
          ) : selectedLocation ? (
            <div className="p-2 rounded-xl border border-slate-700 text-[11px] text-slate-300 font-mono flex items-center justify-between bg-slate-800/90 backdrop-blur-md">
              <div className="flex items-center gap-1.5">
                <Info size={12} className="text-emerald-400 shrink-0" />
                <span>Selected: <strong className="text-white">{selectedLocation}</strong></span>
              </div>
              <span className="text-[10px] text-emerald-400">Click Map to change</span>
            </div>
          ) : (
            <div className="p-2 rounded-xl border border-dashed border-slate-800 text-[10px] text-center text-slate-500 font-mono bg-slate-900/50 backdrop-blur-md">
              Hover over hot spots or click sections of the map to interact
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
