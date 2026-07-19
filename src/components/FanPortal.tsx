/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { Stadium, ChatMessage, Incident, IncidentType, SensorData } from '../types';
import { MOCK_STADIUM_FAQS } from '../data';
import StadiumMap from './StadiumMap';
import { generateLocalConciergeResponse, generateLocalIncidentTranslation } from '../heuristics';
import { calculateGreenPoints, calculateCarbonOffset, isVoucherUnlocked } from '../utils/sustainability';
import { Send, MapPin, Sparkles, Globe, HeartHandshake, ShieldAlert, AlertTriangle, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface FanPortalProps {
  currentStadium: Stadium;
  sensors: SensorData[];
  onAddIncident: (incident: Incident) => void;
}

const PRESET_PROMPTS = [
  { text: "What is the Clear Bag policy?", icon: ShieldAlert },
  { text: "Where can I find wheelchair-accessible elevators?", icon: HeartHandshake },
  { text: "How do I catch the public transit shuttle?", icon: MapPin },
  { text: "Are there drink cup recycling rewards?", icon: Sparkles }
];

export default function FanPortal({ currentStadium, sensors, onAddIncident }: FanPortalProps) {
  // Chat state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      id: 'f-init',
      sender: 'assistant',
      text: `Welcome to the ${currentStadium.name}! 🌟 I am your Multilingual FIFA World Cup 2026 Stadium Concierge. You can speak to me in any language! Ask me about clear bag policies, wheelchair access, shuttle timetables, recycling initiatives, or click on the map to ask specific questions about a location.`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);

  // Form Reporting state
  const [reportLocation, setReportLocation] = useState('');
  const [reportType, setReportType] = useState<IncidentType>('cleaning');
  const [reportDescription, setReportDescription] = useState('');
  const [isReporting, setIsReporting] = useState(false);
  const [reportSuccessMsg, setReportSuccessMsg] = useState<string | null>(null);
  const [reportSuccessDetails, setReportSuccessDetails] = useState<{
    type: string;
    originalLanguage: string;
    translatedDescription: string;
    suggestedAction: string;
  } | null>(null);

  // Sustainability Metrics state
  const [cupReturns, setCupReturns] = useState(0);
  const [greenPoints, setGreenPoints] = useState(0);
  const [unlockedVoucher, setUnlockedVoucher] = useState(false);
  const [showVoucherReveal, setShowVoucherReveal] = useState(false);

  const handleSimulateReturn = () => {
    const nextReturns = cupReturns + 1;
    setCupReturns(nextReturns);
    const points = calculateGreenPoints(nextReturns);
    setGreenPoints(points);
    if (isVoucherUnlocked(points)) {
      setUnlockedVoucher(true);
    }
  };

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isChatLoading]);

  // Handle Map hotspot selection
  const handleSelectLocation = (location: string) => {
    setReportLocation(location);
    // Also notify fan about selection in chat
    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatMessages((prev: ChatMessage[]) => [
      ...prev,
      {
        id: `f-map-sel-${Date.now()}`,
        sender: 'assistant',
        text: `You selected "${location}" on the interactive visualizer. How can I help you regarding this area? You can report any spill/incident here or ask about facility directions.`,
        timestamp: time
      }
    ]);
  };

  // Submit chat query to Express endpoint
  const handleSendChat = async (textToSend?: string) => {
    const queryText = textToSend || chatInput;
    if (!queryText.trim()) return;

    if (!textToSend) setChatInput('');

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `u-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: time
    };

    setChatMessages((prev: ChatMessage[]) => [...prev, userMsg]);
    setIsChatLoading(true);
    setChatError(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...chatMessages, userMsg],
          role: 'fan',
          currentStadium,
          sensors,
          faqList: MOCK_STADIUM_FAQS
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Server error communicating with Gemini API.');
      }

      const data = await response.json();
      
      setChatMessages((prev: ChatMessage[]) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: data.text,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('Gemini Chat failed, activating local concierge responder fallback:', errorMsg);
      
      const responseText = generateLocalConciergeResponse(
        queryText,
        currentStadium.name,
        currentStadium.city,
        currentStadium.country,
        MOCK_STADIUM_FAQS
      );

      setChatMessages((prev: ChatMessage[]) => [
        ...prev,
        {
          id: `a-${Date.now()}`,
          sender: 'assistant',
          text: responseText,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Submit high-fidelity incident report
  const handleReportIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportLocation.trim() || !reportDescription.trim()) return;

    setIsReporting(true);
    setReportSuccessMsg(null);
    setReportSuccessDetails(null);

    try {
      const response = await fetch('/api/translate-incident', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          section: reportLocation,
          description: reportDescription
        })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Error processing incident.');
      }

      const analysis = await response.json();
      
      const newIncident: Incident = {
        id: `inc-${Date.now()}`,
        section: reportLocation,
        type: analysis.type || reportType,
        description: reportDescription,
        reportedAt: new Date().toISOString(),
        status: 'pending',
        originalLanguage: analysis.originalLanguage || 'Detected Language',
        translatedDescription: analysis.translatedDescription,
        suggestedAction: analysis.suggestedAction
      };

      onAddIncident(newIncident);
      setReportSuccessDetails(analysis);
      setReportSuccessMsg(`Successfully registered incident! It has been translated and dispatched.`);
      
      // Clear inputs
      setReportDescription('');
      setReportLocation('');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      console.warn('Gemini translation failed, executing local heuristic parser:', errorMsg);
      
      const mockAnalysis = generateLocalIncidentTranslation(
        reportDescription,
        reportLocation,
        reportType
      );

      const newIncident: Incident = {
        id: `inc-${Date.now()}`,
        section: reportLocation,
        type: mockAnalysis.type as IncidentType,
        description: reportDescription,
        reportedAt: new Date().toISOString(),
        status: 'pending',
        originalLanguage: mockAnalysis.originalLanguage,
        translatedDescription: mockAnalysis.translatedDescription,
        suggestedAction: mockAnalysis.suggestedAction
      };

      onAddIncident(newIncident);
      setReportSuccessDetails(mockAnalysis);
      setReportSuccessMsg(`Registered incident under local heuristic dispatcher backup.`);
      
      // Clear inputs
      setReportDescription('');
      setReportLocation('');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto items-stretch">
      {/* Left Column: Map Visualizer & Live Report Form (lg:col-span-5) */}
      <div className="lg:col-span-5 flex flex-col gap-6">
        
        <StadiumMap 
          sensors={sensors} 
          onSelectLocation={handleSelectLocation} 
          selectedLocation={reportLocation} 
        />

        {/* Green Goals Sustainability Tracker Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Sparkles size={18} className="text-emerald-400 shrink-0" />
                <h3 className="text-sm font-bold text-slate-100">Green Goals Cup Return</h3>
              </div>
              <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded-full">
                Target: 150 pts
              </span>
            </div>
            
            <p className="text-[11px] text-slate-400 leading-relaxed mb-4">
              Return reusable stadium beverage cups to any "Green Goal" kiosk to reduce landfill waste. Earn points to unlock a <strong>50% off discount voucher</strong>.
            </p>

            {/* Sustainability Metrics Display */}
            <div className="grid grid-cols-3 gap-2.5 mb-4">
              <div className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-xl text-center">
                <div className="text-slate-500 text-[9px] font-mono font-bold uppercase tracking-wider">Cups Returned</div>
                <div className="text-base font-black text-slate-200 mt-0.5">{cupReturns}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-xl text-center">
                <div className="text-slate-500 text-[9px] font-mono font-bold uppercase tracking-wider">Green Points</div>
                <div className="text-base font-black text-emerald-400 mt-0.5">{greenPoints}</div>
              </div>
              <div className="bg-slate-950 border border-slate-800/80 p-2.5 rounded-xl text-center">
                <div className="text-slate-500 text-[9px] font-mono font-bold uppercase tracking-wider">CO2 Saved</div>
                <div className="text-base font-black text-slate-200 mt-0.5">{calculateCarbonOffset(cupReturns)} kg</div>
              </div>
            </div>

            {/* Simulated Return action */}
            <button
              onClick={handleSimulateReturn}
              className="w-full py-2 bg-emerald-600/10 hover:bg-emerald-600/20 text-emerald-400 border border-emerald-500/20 hover:border-emerald-500/30 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              ♻️ Scan & Simulate Cup Return
            </button>
          </div>

          {/* Unlocked Reward Overlay Banner */}
          {unlockedVoucher && (
            <div className="mt-4 p-3 bg-gradient-to-r from-emerald-950/40 to-slate-900 border border-emerald-800/50 rounded-xl relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[10px] font-bold text-emerald-400 tracking-wider uppercase font-mono">🏆 Reward Achieved</div>
                  <div className="text-xs text-slate-200 font-semibold mt-0.5">50% Food & Concessions Voucher</div>
                </div>
                <button
                  onClick={() => setShowVoucherReveal(!showVoucherReveal)}
                  className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold rounded-lg text-[10px] uppercase tracking-wider transition-colors cursor-pointer"
                >
                  {showVoucherReveal ? "Hide Code" : "Reveal Code"}
                </button>
              </div>

              {/* Reveal Code Box */}
              {showVoucherReveal && (
                <motion.div
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-3 bg-slate-950 border border-emerald-900/40 p-2.5 rounded-lg flex flex-col items-center gap-1"
                >
                  <span className="text-[9px] font-mono text-slate-500 uppercase">Scan voucher at counter</span>
                  <span className="text-sm font-mono font-bold tracking-widest text-emerald-400">FIFA2026-GREEN-HERO</span>
                  <div className="w-full h-1 bg-gradient-to-r from-slate-950 via-emerald-800/40 to-slate-950 mt-1"></div>
                </motion.div>
              )}
            </div>
          )}
        </div>

        {/* Real-time Reporting Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col justify-between flex-1">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Globe size={18} className="text-emerald-400" />
              <h3 className="text-base font-semibold text-slate-100">Multilingual Incident Dispatch</h3>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed mb-4">
              Spotted an issue? (Water spill, broken elevator, first-aid request). Post it below in <strong>any language</strong>. Our GenAI translator will instantly categorize, translate to English, and dispatch to venue supervisors.
            </p>

            <form onSubmit={handleReportIncident} className="space-y-3">
              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Location / Section (Click map to auto-fill)
                </label>
                <input
                  type="text"
                  required
                  value={reportLocation}
                  onChange={(e) => setReportLocation(e.target.value)}
                  placeholder="e.g., Section 112 Row K, or click map hotspot"
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                    Preset Type
                  </label>
                  <select
                    value={reportType}
                    onChange={(e) => setReportType(e.target.value as IncidentType)}
                    className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-2 py-2 text-slate-200 focus:outline-none focus:border-emerald-500/50"
                  >
                    <option value="cleaning">🧹 Cleaning Spill</option>
                    <option value="security">🛡️ Security Concern</option>
                    <option value="medical">🚑 Medical Assist</option>
                    <option value="accessibility">♿ Accessibility Aid</option>
                    <option value="infrastructure">🔧 Infra Failure</option>
                    <option value="other">❓ Other Issue</option>
                  </select>
                </div>
                <div className="flex flex-col justify-end">
                  <span className="text-[9px] font-mono text-emerald-400/80 bg-emerald-950/20 border border-emerald-900/30 rounded-xl px-2.5 py-2 leading-tight">
                    🌐 Real-time AI Translation Active
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
                  Description (Any Language)
                </label>
                <textarea
                  required
                  rows={2}
                  value={reportDescription}
                  onChange={(e) => setReportDescription(e.target.value)}
                  placeholder="e.g., 'There is broken glass here.' or 'La rampa de silla de ruedas está bloqueada por basura.'"
                  className="w-full text-xs bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-all resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={isReporting}
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-800/50 text-slate-950 font-semibold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
              >
                {isReporting ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>AI Analyzing & Translating...</span>
                  </>
                ) : (
                  <>
                    <Globe size={13} />
                    <span>Submit & Dispatch Incident</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Success Result Container */}
          <AnimatePresence>
            {reportSuccessMsg && reportSuccessDetails && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                className="mt-3 p-3 bg-emerald-950/30 border border-emerald-800/40 rounded-xl text-[11px]"
              >
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
                  <CheckCircle size={14} />
                  <span>{reportSuccessMsg}</span>
                </div>
                <div className="space-y-1 text-slate-300 font-mono text-[10px]">
                  <div>
                    <span className="text-slate-500">Detected Language:</span>{' '}
                    <span className="text-emerald-300 font-bold">{reportSuccessDetails.originalLanguage}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">English Translation:</span>{' '}
                    <span className="text-slate-200">"{reportSuccessDetails.translatedDescription}"</span>
                  </div>
                  <div>
                    <span className="text-slate-500">Dispatched Action:</span>{' '}
                    <span className="text-amber-300 font-medium">{reportSuccessDetails.suggestedAction}</span>
                  </div>
                </div>
                <button
                  onClick={() => setReportSuccessMsg(null)}
                  className="mt-2 text-[9px] text-slate-500 hover:text-slate-300 underline"
                >
                  Clear receipt
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Right Column: AI Assistant Chat Interface (lg:col-span-7) */}
      <div className="lg:col-span-7 flex flex-col bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden min-h-[500px]">
        {/* Chat Header */}
        <div className="px-5 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 border border-emerald-500/20 shadow-inner">
              <Sparkles size={16} className="animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">FIFA World Cup AI Concierge</h3>
              <p className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Gemini 3.5-Flash Online</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-mono bg-slate-800 px-2 py-1 rounded-lg">
            <Globe size={11} className="text-emerald-400" />
            <span>Multilingual Support</span>
          </div>
        </div>

        {/* Chat Message Scrollport */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          <AnimatePresence initial={false}>
            {chatMessages.map((msg: ChatMessage) => {
              const isUser = msg.sender === 'user';
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-md leading-relaxed ${
                      isUser
                        ? 'bg-emerald-600 text-slate-950 rounded-tr-none'
                        : 'bg-slate-950 border border-slate-800/50 text-slate-200 rounded-tl-none'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-6 mb-1 text-[9px] opacity-60 font-mono">
                      <span className="font-bold">{isUser ? 'YOU' : 'FIFA CO-PILOT'}</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <p className="whitespace-pre-line">{msg.text}</p>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {isChatLoading && (
            <div className="flex justify-start">
              <div className="bg-slate-950 border border-slate-800/50 rounded-2xl rounded-tl-none p-3.5 max-w-[80%] flex items-center gap-2">
                <span className="flex gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-bounce" style={{ animationDelay: '300ms' }}></span>
                </span>
                <span className="text-[10px] font-mono text-slate-500">AI is composing guidelines...</span>
              </div>
            </div>
          )}

          {chatError && (
            <div className="p-3 bg-rose-950/20 border border-rose-900/30 rounded-xl flex items-start gap-2 text-xs text-rose-300">
              <AlertTriangle size={15} className="shrink-0 mt-0.5" />
              <div>
                <p className="font-bold mb-0.5">Communication Issue</p>
                <p className="text-[10px] leading-relaxed text-slate-400">{chatError}</p>
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>

        {/* Preset Prompt Suggestions */}
        <div className="px-5 py-2.5 border-t border-slate-800 bg-slate-950/20 flex gap-2 overflow-x-auto scrollbar-none">
          {PRESET_PROMPTS.map((prompt, i) => {
            const Icon = prompt.icon;
            return (
              <button
                key={i}
                onClick={() => handleSendChat(prompt.text)}
                disabled={isChatLoading}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-950 border border-slate-800 hover:border-emerald-500/30 text-[10px] text-slate-300 rounded-xl transition-all hover:bg-slate-900"
              >
                <Icon size={11} className="text-emerald-400" />
                <span>{prompt.text}</span>
              </button>
            );
          })}
        </div>

        {/* Chat Input Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendChat();
            }}
            className="flex gap-2"
          >
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Ask about bag policy, elevators, shuttles, map directions..."
              disabled={isChatLoading}
              className="flex-1 bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
            <button
              type="submit"
              disabled={isChatLoading || !chatInput.trim()}
              className="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-slate-950 flex items-center justify-center transition-colors disabled:bg-slate-800 disabled:text-slate-600"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
