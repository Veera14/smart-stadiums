/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Role, Stadium, Incident, SensorData } from './types';
import { STADIUMS, SCENARIO_PRESETS, INITIAL_INCIDENTS } from './data';
import FanPortal from './components/FanPortal';
import StaffPortal from './components/StaffPortal';
import { 
  Trophy, MapPin, Users, HelpCircle, Shield, Globe, 
  Calendar, Info, Compass, ShieldAlert, Heart, Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [activeRole, setActiveRole] = useState<Role>('fan');
  const [selectedStadiumId, setSelectedStadiumId] = useState<string>('metlife');
  
  // Shared global state for simulated stadium parameters
  const [sensors, setSensors] = useState<SensorData[]>(SCENARIO_PRESETS[0].sensors);
  const [incidents, setIncidents] = useState<Incident[]>(INITIAL_INCIDENTS);

  const currentStadium = STADIUMS.find(s => s.id === selectedStadiumId) || STADIUMS[0];

  // Callbacks to manage incidents from both portals
  const handleAddIncident = (newIncident: Incident) => {
    setIncidents(prev => [newIncident, ...prev]);
  };

  const handleUpdateIncidentStatus = (id: string, status: 'pending' | 'dispatched' | 'resolved') => {
    setIncidents(prev => prev.map(inc => {
      if (inc.id === id) {
        return { ...inc, status };
      }
      return inc;
    }));
  };

  const handleClearResolvedIncidents = () => {
    setIncidents(prev => prev.filter(inc => inc.status !== 'resolved'));
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-slate-950">
      
      {/* Decorative top-border line for World Cup color accent */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-500 via-amber-400 to-emerald-600"></div>

      {/* Header bar */}
      <header className="border-b border-slate-900 bg-slate-950/40 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center text-slate-950 shadow-lg shadow-emerald-950/20">
              <Trophy size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-black tracking-wider uppercase text-slate-100">FIFA World Cup 2026</h1>
                <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase">
                  Venues Hub
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium">Stadium Operations & Multilingual Fan Portal</p>
            </div>
          </div>

          {/* Controls: Stadium & Portal Selection */}
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            
            {/* Active Venue Selector */}
            <div className="flex items-center gap-1.5 bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5">
              <MapPin size={13} className="text-emerald-400" />
              <select
                value={selectedStadiumId}
                onChange={(e) => setSelectedStadiumId(e.target.value)}
                className="text-xs bg-transparent text-slate-200 focus:outline-none cursor-pointer pr-1"
              >
                {STADIUMS.map((stadium) => (
                  <option key={stadium.id} value={stadium.id} className="bg-slate-950 text-slate-200">
                    {stadium.city} ({stadium.country})
                  </option>
                ))}
              </select>
            </div>

            {/* Portal Switch Toggle */}
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-1 flex">
              <button
                onClick={() => setActiveRole('fan')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeRole === 'fan'
                    ? 'bg-emerald-600 text-slate-950 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Compass size={13} />
                <span>Fan Portal</span>
              </button>
              <button
                onClick={() => setActiveRole('staff')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  activeRole === 'staff'
                    ? 'bg-slate-800 text-slate-100 border border-slate-700/50 shadow-md'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Shield size={13} />
                <span>Command Center</span>
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Main Content Arena */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Stadium Info Metadata Overlay */}
        <div className="mb-6 p-4 bg-slate-900/50 border border-slate-800/60 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold text-slate-100 leading-tight">
                {currentStadium.name}
              </h2>
              <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-800">
                Capacity: {currentStadium.capacity.toLocaleString()}
              </span>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-1">
              <span>📍 {currentStadium.city}, {currentStadium.country}</span>
              <span>•</span>
              <span>🚪 Gates: {currentStadium.gates.join(', ')}</span>
            </p>
          </div>

          {/* Quick Matches Scroller */}
          <div className="flex gap-2.5 overflow-x-auto scrollbar-none py-1">
            {currentStadium.matches.map((match) => (
              <div key={match.id} className="shrink-0 p-2.5 bg-slate-950 border border-slate-800/80 rounded-xl text-[10px] font-mono space-y-1 min-w-[160px]">
                <div className="flex justify-between items-center text-slate-500 font-bold">
                  <span>{match.stage}</span>
                  {match.score && (
                    <span className="text-emerald-400 bg-emerald-950/30 px-1 rounded">
                      {match.score}
                    </span>
                  )}
                </div>
                <div className="text-slate-200 font-bold truncate">{match.teams}</div>
                <div className="text-slate-500 text-[9px]">
                  📅 {new Date(match.dateTime).toLocaleDateString()} at {new Date(match.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dynamic Portal View */}
        <AnimatePresence mode="wait">
          {activeRole === 'fan' ? (
            <motion.div
              key="fan-portal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <FanPortal 
                currentStadium={currentStadium} 
                sensors={sensors}
                onAddIncident={handleAddIncident}
              />
            </motion.div>
          ) : (
            <motion.div
              key="staff-portal"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.2 }}
            >
              <StaffPortal 
                currentStadium={currentStadium}
                sensors={sensors}
                onSetSensors={setSensors}
                incidents={incidents}
                onUpdateIncidentStatus={handleUpdateIncidentStatus}
                onClearResolvedIncidents={handleClearResolvedIncidents}
              />
            </motion.div>
          )}
        </AnimatePresence>

      </main>

      {/* Aesthetic Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/20 py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-[10px] font-mono text-slate-500">
          <div className="flex items-center gap-1.5">
            <Trophy size={12} className="text-emerald-400" />
            <span>FIFA World Cup 2026 Venue Management Hub © 2026</span>
          </div>
          <div className="flex gap-4">
            <span className="flex items-center gap-1 text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>GenAI Command Active</span>
            </span>
            <span>Local Node: Live Container</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
