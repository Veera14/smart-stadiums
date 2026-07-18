/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Stadium, Incident, SensorData, ChatMessage, OperationalAnalysisResult } from '../types';
import { SCENARIO_PRESETS, ScenarioPreset } from '../data';
import { generateLocalAnalysis } from '../heuristics';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceLine,
  LineChart, Line
} from 'recharts';
import { 
  Flame, Shield, Sliders, AlertCircle, Sparkles, Send, CheckCircle, Clock, CheckCircle2, 
  ChevronRight, RefreshCw, Layers, ShieldCheck, Accessibility, HelpCircle, Activity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface StaffPortalProps {
  currentStadium: Stadium;
  sensors: SensorData[];
  onSetSensors: (sensors: SensorData[]) => void;
  incidents: Incident[];
  onUpdateIncidentStatus: (id: string, status: 'pending' | 'dispatched' | 'resolved') => void;
  onClearResolvedIncidents: () => void;
}

export default function StaffPortal({
  currentStadium,
  sensors,
  onSetSensors,
  incidents,
  onUpdateIncidentStatus,
  onClearResolvedIncidents
}: StaffPortalProps) {
  // Scenario Selection
  const [activeScenarioId, setActiveScenarioId] = useState('normal');

  // Operational Analysis State (Generative AI Decision Support)
  const [analysis, setAnalysis] = useState<OperationalAnalysisResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isUsingLocalHeuristics, setIsUsingLocalHeuristics] = useState(false);

  // Local analysis is generated using the imported generateLocalAnalysis function

  // Command Chat state
  const [staffChatInput, setStaffChatInput] = useState('');
  const [staffChatMessages, setStaffChatMessages] = useState<ChatMessage[]>([
    {
      id: 's-init',
      sender: 'assistant',
      text: `Tactical Venue Command Co-Pilot active. 🛡️ I am fully synchronized with stadium sensors, gate flow rates, and incident logs. Ask me how to resolve crowd bottlenecks, allocate shuttle buses, or draft staff briefing instructions.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isStaffChatLoading, setIsStaffChatLoading] = useState(false);
  const [staffChatError, setStaffChatError] = useState<string | null>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Trigger scenario sensor change
  const handleSelectScenario = (preset: ScenarioPreset) => {
    setActiveScenarioId(preset.id);
    onSetSensors(preset.sensors);
    // Auto-reset analysis when state changes so it prompts re-generation
    setAnalysis(null);
  };

  // Run Gemini Operational Analysis (Decision Support)
  const runOperationalAnalysis = async () => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    try {
      const response = await fetch('/api/analyze-operations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stadium: currentStadium,
          sensors,
          incidents
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error generating analytics.');
      }

      const result = await response.json();
      setAnalysis(result);
      setIsUsingLocalHeuristics(false);
    } catch (err: any) {
      console.warn('Gemini Operational Analysis failed, activating high-fidelity Heuristics engine fallback:', err);
      // Run local fallback engine
      const localResult = generateLocalAnalysis(sensors, incidents, currentStadium.name);
      setAnalysis(localResult);
      setIsUsingLocalHeuristics(true);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Run initial analysis when the dashboard loads
  useEffect(() => {
    runOperationalAnalysis();
  }, [sensors]); // run on sensor presets update

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [staffChatMessages, isStaffChatLoading]);

  // Submit Command Chat query
  const handleSendStaffChat = async () => {
    if (!staffChatInput.trim()) return;

    const queryText = staffChatInput;
    setStaffChatInput('');

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `u-st-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: time
    };

    setStaffChatMessages(prev => [...prev, userMsg]);
    setIsStaffChatLoading(true);
    setStaffChatError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...staffChatMessages, userMsg],
          role: 'staff',
          currentStadium,
          sensors,
          incidents
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error communicating with command co-pilot.');
      }

      const data = await response.json();
      setStaffChatMessages(prev => [
        ...prev,
        {
          id: `a-st-${Date.now()}`,
          sender: 'assistant',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err: any) {
      console.error(err);
      setStaffChatError(err.message || 'Unable to connect to command co-pilot service.');
    } finally {
      setIsStaffChatLoading(false);
    }
  };

  // Format Recharts data based on active sensors
  const chartData = sensors.map(s => ({
    name: s.location,
    value: s.value,
    status: s.status,
    fill: s.status === 'critical' ? '#f43f5e' : s.status === 'warning' ? '#f59e0b' : '#10b981'
  }));

  const getIncidentIcon = (type: string) => {
    switch (type) {
      case 'cleaning': return '🧹';
      case 'security': return '🛡️';
      case 'medical': return '🚑';
      case 'accessibility': return '♿';
      case 'infrastructure': return '🔧';
      default: return '❓';
    }
  };

  const getIncidentStatusBadge = (status: 'pending' | 'dispatched' | 'resolved') => {
    switch (status) {
      case 'resolved':
        return 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40';
      case 'dispatched':
        return 'bg-blue-950/40 text-blue-400 border border-blue-900/40';
      case 'pending':
      default:
        return 'bg-rose-950/40 text-rose-400 border border-rose-900/40';
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Row 1: Scenario Controller and Safety Bar Gauge */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-stretch">
        
        {/* Scenario preset selection */}
        <div className="md:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Sliders size={18} className="text-emerald-400" />
              <h3 className="text-base font-semibold text-slate-100 font-sans">World Cup Match Scenario Presets</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Select an environment state to simulate different crowd conditions, queues, and transport flow at the stadium. Live analytics and decision suggestions will update automatically.
            </p>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
            {SCENARIO_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectScenario(preset)}
                className={`p-3 rounded-xl border text-left transition-all ${
                  activeScenarioId === preset.id
                    ? 'bg-emerald-950/25 border-emerald-500 text-emerald-100 shadow-inner'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700 hover:bg-slate-900/50'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-mono font-semibold tracking-wider uppercase text-slate-400">
                    Preset
                  </span>
                  {activeScenarioId === preset.id && (
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  )}
                </div>
                <h4 className="text-xs font-bold mb-1 truncate">{preset.name}</h4>
                <p className="text-[9px] text-slate-500 leading-tight line-clamp-2">{preset.description}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Global Safety Assessment & Metrics */}
        <div className="md:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={18} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-100">AI Safety Score</h3>
              </div>
              {isUsingLocalHeuristics ? (
                <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded uppercase animate-pulse">
                  Local Heuristics
                </span>
              ) : (
                <span className="text-[10px] font-mono text-emerald-400">Calculated Real-time</span>
              )}
            </div>
            <p className="text-xs text-slate-400 leading-tight mb-4">
              Synthesized evaluation score mapping active critical incidents against transit delays.
            </p>
          </div>

          <div className="flex items-center gap-4 py-2">
            <div className="relative flex items-center justify-center">
              {/* Outer ring */}
              <div className="w-20 h-20 rounded-full border-4 border-slate-950 flex items-center justify-center bg-slate-950/80">
                <span className="text-2xl font-black font-mono text-white">
                  {analysis ? analysis.safetyRating : '--'}
                </span>
              </div>
              {/* Decorative radial border */}
              <svg className="absolute w-24 h-24 transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  className="stroke-slate-800 fill-none"
                  strokeWidth="3"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="42"
                  className={`fill-none transition-all duration-1000 ${
                    !analysis ? 'stroke-slate-700' : analysis.safetyRating > 75 ? 'stroke-emerald-500' : analysis.safetyRating > 50 ? 'stroke-amber-500' : 'stroke-rose-500'
                  }`}
                  strokeWidth="3.5"
                  strokeDasharray="264"
                  strokeDashoffset={analysis ? 264 - (264 * analysis.safetyRating) / 100 : 264}
                />
              </svg>
            </div>
            <div className="flex-1 space-y-1.5 font-mono text-[10px]">
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-500">CONCOURSE:</span>
                <span className={`font-semibold ${analysis?.concourseStatus.includes('Congested') || analysis?.concourseStatus.includes('bottleneck') ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {analysis ? analysis.concourseStatus : 'Calculating...'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-500">GATE FLOW:</span>
                <span className={`font-semibold ${analysis?.gateStatus.includes('Severe') || analysis?.gateStatus.includes('bottleneck') ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {analysis ? analysis.gateStatus : 'Calculating...'}
                </span>
              </div>
              <div className="flex justify-between border-b border-slate-800 pb-1">
                <span className="text-slate-500">TRANSPORT:</span>
                <span className={`font-semibold ${analysis?.transportStatus.includes('delay') || analysis?.transportStatus.includes('critical') ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {analysis ? analysis.transportStatus : 'Calculating...'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Live Charts & Incidents dispatch */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* Recharts Congestion Levels */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-[360px]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <Activity size={18} className="text-emerald-400" />
                <h3 className="text-sm font-semibold text-slate-100">Facility Queue & Density Metrics (%)</h3>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Live telemetry feed</span>
            </div>
          </div>

          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="name" stroke="#64748b" fontSize={9} tickLine={false} />
                <YAxis stroke="#64748b" fontSize={9} domain={[0, 100]} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#020617', border: '1px solid #1e293b', borderRadius: '12px' }}
                  labelStyle={{ fontSize: '11px', color: '#94a3b8', fontFamily: 'monospace' }}
                  itemStyle={{ fontSize: '11px', color: '#fff', fontWeight: 'bold' }}
                />
                <Bar dataKey="value" name="Congestion/Wait Level" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Live Incident Dispatch Console (Synced in real-time) */}
        <div className="lg:col-span-5 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between h-[360px]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-1.5">
              <Layers size={18} className="text-emerald-400" />
              <h3 className="text-sm font-semibold text-slate-100">Live Dispatch Console ({incidents.length})</h3>
            </div>
            {incidents.some(i => i.status === 'resolved') && (
              <button
                onClick={onClearResolvedIncidents}
                className="text-[9px] font-mono text-slate-500 hover:text-slate-300 underline"
              >
                Flush Resolved
              </button>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[260px]">
            {incidents.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 border border-dashed border-slate-800 rounded-xl">
                <CheckCircle2 size={32} className="text-emerald-500/20 mb-2" />
                <p className="text-xs text-slate-400 font-medium">All clear! No active incident dispatches.</p>
                <p className="text-[10px] text-slate-500 mt-0.5">Spills or assist requests will populate here.</p>
              </div>
            ) : (
              incidents.map((incident) => (
                <div key={incident.id} className="p-3 bg-slate-950 border border-slate-800/80 rounded-xl space-y-2">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold flex items-center gap-1">
                        <span>{getIncidentIcon(incident.type)}</span>
                        <span className="uppercase">{incident.type}</span>
                        <span>•</span>
                        <span className="text-slate-500 font-normal">{incident.section}</span>
                      </span>
                    </div>
                    <span className={`text-[8px] font-mono font-semibold px-2 py-0.5 rounded-full uppercase ${getIncidentStatusBadge(incident.status)}`}>
                      {incident.status}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {incident.originalLanguage !== 'English' && (
                      <div className="text-[9px] text-slate-500 leading-tight">
                        📢 Translated from <strong className="text-emerald-500/80">{incident.originalLanguage}</strong>:
                      </div>
                    )}
                    <p className="text-[11px] text-slate-200 leading-tight">
                      {incident.translatedDescription || incident.description}
                    </p>
                  </div>

                  {incident.suggestedAction && (
                    <div className="p-2 bg-amber-950/20 border border-amber-900/30 rounded-lg text-[10px] text-amber-300">
                      <strong>AI Dispatch Advice:</strong> {incident.suggestedAction}
                    </div>
                  )}

                  {/* Actions row */}
                  <div className="flex gap-1.5 pt-1 border-t border-slate-800/30">
                    {incident.status === 'pending' && (
                      <button
                        onClick={() => onUpdateIncidentStatus(incident.id, 'dispatched')}
                        className="px-2.5 py-1 bg-blue-900/40 hover:bg-blue-800/60 border border-blue-700/30 text-[9px] font-semibold text-blue-200 rounded-md transition-colors"
                      >
                        Dispatch Crew
                      </button>
                    )}
                    {incident.status !== 'resolved' && (
                      <button
                        onClick={() => onUpdateIncidentStatus(incident.id, 'resolved')}
                        className="px-2.5 py-1 bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-700/30 text-[9px] font-semibold text-emerald-300 rounded-md transition-colors ml-auto"
                      >
                        Resolve Issue
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Decision Support Recommendations (Bento Panel) */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-400" />
            <h3 className="text-sm font-semibold text-slate-100">Generative AI Decision Support Panel</h3>
            {isUsingLocalHeuristics && (
              <span className="text-[9px] font-mono font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded uppercase">
                Heuristics Active
              </span>
            )}
          </div>
          <button
            onClick={runOperationalAnalysis}
            disabled={isAnalyzing}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/50 text-slate-950 text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={12} className={isAnalyzing ? 'animate-spin' : ''} />
            <span>{isAnalyzing ? 'Recalculating...' : 'Evaluate Status'}</span>
          </button>
        </div>

        {isAnalyzing && !analysis ? (
          <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl flex flex-col items-center justify-center">
            <span className="text-2xl animate-spin mb-2">⏳</span>
            <p className="text-xs text-slate-400 font-bold">Executing Stadium Operational Analysis Models...</p>
            <p className="text-[10px] text-slate-600 mt-1">Gemini 3.5-Flash is consolidating active incidents and multi-point crowd sensors.</p>
          </div>
        ) : analysisError ? (
          <div className="p-4 bg-rose-950/20 border border-rose-900/30 rounded-xl text-xs text-rose-300">
            <p className="font-bold mb-1">Analytical Execution Fault</p>
            <p className="text-[10px] leading-relaxed text-slate-400">{analysisError}</p>
          </div>
        ) : analysis ? (
          <div className="space-y-4">
            {/* Tactical Summary Bar */}
            <div className="p-4 bg-slate-950 border border-slate-800/80 rounded-xl">
              <span className="text-[9px] font-mono font-bold text-emerald-400 uppercase tracking-wider block mb-1">Executive Commander Summary</span>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {analysis.executiveSummary}
              </p>
            </div>

            {/* Recommendations Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {analysis.recommendations.map((rec, i) => (
                <div key={i} className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col justify-between space-y-3">
                  <div className="space-y-2">
                    <div className="flex justify-between items-start gap-4">
                      <span className="text-[9px] font-mono text-slate-500 uppercase tracking-wider">
                        📂 {rec.category}
                      </span>
                      <span className={`text-[8px] font-mono font-bold px-2 py-0.5 rounded-full ${
                        rec.priority === 'HIGH' 
                          ? 'bg-rose-950/30 text-rose-400 border border-rose-900/30' 
                          : rec.priority === 'MEDIUM' 
                          ? 'bg-amber-950/30 text-amber-400 border border-amber-900/30' 
                          : 'bg-emerald-950/30 text-emerald-400 border border-emerald-900/30'
                      }`}>
                        {rec.priority} PRIORITY
                      </span>
                    </div>
                    <h4 className="text-xs font-bold text-slate-200">{rec.title}</h4>
                    <p className="text-[11px] text-slate-400 leading-relaxed font-sans">{rec.action}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-400">
            Click "Evaluate Status" to perform crowd logistics assessment.
          </div>
        )}
      </div>

      {/* Row 4: Tactical Commander AI Chat */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden flex flex-col h-[320px]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-800 bg-slate-950/40 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Shield size={16} className="text-emerald-400" />
            <h3 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">Command Copilot Tactical Terminal</h3>
          </div>
          <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-wider bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-lg">
            Operational Intelligence Active
          </span>
        </div>

        {/* Scroll port */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-950/30">
          {staffChatMessages.map((msg) => {
            const isUser = msg.sender === 'user';
            return (
              <div key={msg.id} className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
                <div className={`p-3 rounded-xl text-xs max-w-[85%] font-mono ${
                  isUser 
                    ? 'bg-emerald-950 border border-emerald-700/40 text-emerald-300' 
                    : 'bg-slate-950 border border-slate-800/60 text-slate-300'
                }`}>
                  <div className="flex justify-between items-center text-[8px] opacity-60 mb-1">
                    <span className="font-bold">{isUser ? 'OPERATIONS_SUPERVISOR' : 'CO_PILOT'}</span>
                    <span>{msg.timestamp}</span>
                  </div>
                  <p className="whitespace-pre-line leading-relaxed">{msg.text}</p>
                </div>
              </div>
            );
          })}

          {isStaffChatLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-950 border border-slate-800/50 rounded-xl p-3 max-w-[80%] flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">Evaluating logistics dispatch...</span>
              </div>
            </div>
          )}

          {staffChatError && (
            <div className="p-2.5 bg-rose-950/10 border border-rose-900/30 rounded-lg text-[10px] font-mono text-rose-400">
              [COMMUNICATION_ERROR]: {staffChatError}
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input bar */}
        <div className="p-3 border-t border-slate-800 bg-slate-950/50">
          <form onSubmit={(e) => { e.preventDefault(); handleSendStaffChat(); }} className="flex gap-2">
            <input
              type="text"
              value={staffChatInput}
              onChange={(e) => setStaffChatInput(e.target.value)}
              placeholder="Query: 'Draft staff dispatch instructions for Section 114 spill' or 'Recommend queue reduction plan'..."
              disabled={isStaffChatLoading}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-2.5 text-xs text-slate-300 font-mono focus:outline-none focus:border-emerald-500/50 transition-colors placeholder-slate-600"
            />
            <button
              type="submit"
              disabled={isStaffChatLoading || !staffChatInput.trim()}
              className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 flex items-center justify-center transition-colors disabled:bg-slate-800 disabled:text-slate-600"
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
