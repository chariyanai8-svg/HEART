/**
 * HEART Automated AI Dispatch Center
 * Fully autonomous — AI triages, allocates hospitals, and dispatches automatically.
 * No manual operator verification needed.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  PhoneCall, Building2, MapPin, CheckCircle, Truck,
  Search, Radio, Wifi, Zap, Activity, Brain, Shield,
  Clock, ArrowRight, Sparkles
} from 'lucide-react';
import { getSnapshotDecision, type AIDecision } from '../services/api';

/* ── Types ── */
interface EmergencyCase {
  id: string;
  name: string;
  age: number;
  gender: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  source: string;
  location: string;
  timeAgo: string;
  status: 'ai_processing' | 'ai_allocated' | 'dispatched' | 'completed';
  keywords: string[];
  hr: number;
  steps: number;
  aiDecision?: AIDecision | null;
  allocatedHospital?: string;
  dispatchEta?: string;
  processedAt?: string;
}

/* ── Mock hospitals ── */
const hospitals = [
  { name: 'Subang Medical Center', edLoad: 74, beds: 28, queue: 0, eta: '8 min' },
  { name: 'Hospital Kuala Lumpur', edLoad: 89, beds: 42, queue: 3, eta: '14 min' },
  { name: 'Sunway Medical Centre', edLoad: 62, beds: 18, queue: 1, eta: '11 min' },
];

function pickBestHospital(severity: string) {
  // AI picks hospital with lowest load and queue for critical, closest for others
  if (severity === 'CRITICAL') {
    return hospitals.reduce((best, h) => h.queue < best.queue || (h.queue === best.queue && h.edLoad < best.edLoad) ? h : best, hospitals[0]);
  }
  return hospitals.reduce((best, h) => h.edLoad < best.edLoad ? h : best, hospitals[0]);
}

const sevColor = (s: string) => s === 'CRITICAL' ? { bg: '#fee2e2', color: '#dc2626', border: '#fecaca' } : s === 'HIGH' ? { bg: '#fff7ed', color: '#ea580c', border: '#fed7aa' } : { bg: '#fef3c7', color: '#ca8a04', border: '#fde68a' };

/* ── Initial cases (all start as ai_processing) ── */
const buildInitialCases = (): EmergencyCase[] => [
  {
    id: 'CASE-873', name: 'Simulated Incoming Call', age: 36, gender: 'M', severity: 'CRITICAL',
    source: '999 Call', location: 'Petaling Jaya, Selangor', timeAgo: 'Just now', status: 'ai_processing',
    keywords: ['Unresponsive', 'No Pulse Reported'], hr: 0, steps: 0,
  },
  {
    id: 'CASE-872', name: 'John Doe', age: 68, gender: 'M', severity: 'HIGH',
    source: 'AI App', location: 'Subang Jaya, Selangor (GPS verified)', timeAgo: '1m ago', status: 'ai_processing',
    keywords: ['Chest Pain', 'Dyspnea', 'Hypertension History'], hr: 142, steps: 200,
  },
  {
    id: 'CASE-871', name: 'Siti Aminah', age: 34, gender: 'F', severity: 'CRITICAL',
    source: '999 Call', location: 'Highway PLUS, KM 284', timeAgo: 'Just now', status: 'ai_processing',
    keywords: ['MVA', 'Entrapment', 'Blunt Trauma'], hr: 98, steps: 0,
  },
  {
    id: 'CASE-870', name: 'Unknown Caller', age: 0, gender: 'M', severity: 'HIGH',
    source: '999 Call', location: 'Georgetown, Penang', timeAgo: '3m ago', status: 'ai_processing',
    keywords: ['Syncope', 'Unknown Patient', 'Public Location'], hr: 0, steps: 0,
  },
  {
    id: 'CASE-869', name: 'Lim Wei Jian', age: 52, gender: 'M', severity: 'MEDIUM',
    source: 'AI App', location: 'Johor Bahru, Johor', timeAgo: '5m ago', status: 'ai_processing',
    keywords: ['Tachycardia', 'Dizziness', 'Palpitations'], hr: 130, steps: 1200,
  },
];

export default function OperatorView() {
  const [cases, setCases] = useState<EmergencyCase[]>(buildInitialCases);
  const [selectedId, setSelectedId] = useState('CASE-873');
  const [searchQ, setSearchQ] = useState('');
  const [aiProcessingCount, setAiProcessingCount] = useState(0);
  const [totalProcessed, setTotalProcessed] = useState(0);

  const selected = cases.find(c => c.id === selectedId) || cases[0];
  const activeCases = cases.filter(c => c.status !== 'completed');

  /* ── Auto-process a single case via AI ── */
  const autoProcessCase = useCallback(async (caseId: string) => {
    const c = cases.find(x => x.id === caseId);
    if (!c || c.status !== 'ai_processing') return;

    setAiProcessingCount(p => p + 1);
    try {
      const result = await getSnapshotDecision({
        averageHeartRate: c.hr || 120,
        dailySteps: c.steps || 50,
        daysSinceLastCheckin: 0,
        patientName: c.name,
        medicalHistory: c.keywords.join(', '),
      });

      const hospital = pickBestHospital(c.severity);
      const now = new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });

      setCases(prev => prev.map(x => x.id === caseId ? {
        ...x,
        status: 'dispatched' as const,
        aiDecision: result.success ? result.decision : null,
        allocatedHospital: hospital.name,
        dispatchEta: hospital.eta,
        processedAt: now,
      } : x));
      setTotalProcessed(p => p + 1);
    } catch {
      const hospital = pickBestHospital(c.severity);
      const now = new Date().toLocaleTimeString('en-MY', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
      setCases(prev => prev.map(x => x.id === caseId ? {
        ...x,
        status: 'dispatched' as const,
        allocatedHospital: hospital.name,
        dispatchEta: hospital.eta,
        processedAt: now,
      } : x));
      setTotalProcessed(p => p + 1);
    }
    setAiProcessingCount(p => Math.max(0, p - 1));
  }, [cases]);

  /* ── On mount: auto-process all pending cases with stagger ── */
  useEffect(() => {
    const pending = cases.filter(c => c.status === 'ai_processing');
    pending.forEach((c, i) => {
      setTimeout(() => autoProcessCase(c.id), (i + 1) * 1500);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ── Simulate new incoming call ── */
  const simulateCall = () => {
    const names = ['Ahmad bin Yusof', 'Priya a/p Rajan', 'Chen Li Hua', 'Abdul Karim', 'Nurul Aisyah'];
    const locations = ['Shah Alam, Selangor', 'Ipoh, Perak', 'Kuching, Sarawak', 'Klang Valley', 'Penang Island'];
    const sev: EmergencyCase['severity'][] = ['CRITICAL', 'HIGH', 'MEDIUM'];
    const newCase: EmergencyCase = {
      id: `CASE-${874 + cases.length}`,
      name: names[Math.floor(Math.random() * names.length)],
      age: 20 + Math.floor(Math.random() * 60),
      gender: Math.random() > 0.5 ? 'M' : 'F',
      severity: sev[Math.floor(Math.random() * sev.length)],
      source: Math.random() > 0.5 ? '999 Call' : 'AI App',
      location: locations[Math.floor(Math.random() * locations.length)],
      timeAgo: 'Just now',
      status: 'ai_processing',
      keywords: ['Emergency', 'Urgent'],
      hr: Math.floor(60 + Math.random() * 100),
      steps: Math.floor(Math.random() * 3000),
    };
    setCases(prev => [newCase, ...prev]);
    setSelectedId(newCase.id);
    // Auto-process after short delay
    setTimeout(() => autoProcessCase(newCase.id), 1500);
  };

  const markCompleted = (id: string) => {
    setCases(prev => prev.map(c => c.id === id ? { ...c, status: 'completed' as const } : c));
    const next = cases.find(c => c.id !== id && c.status !== 'completed');
    if (next) setSelectedId(next.id);
  };

  const sc = sevColor(selected.severity);

  return (
    <div className="min-h-[calc(100vh-3.5rem)] p-5 lg:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="text-[10px] tracking-widest font-medium" style={{ color: 'var(--heart-text-muted)' }}>Autonomous AI Engine</div>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full animate-pulse" style={{ background: '#dcfce7', color: '#16a34a' }}>FULLY AUTOMATED</span>
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--heart-text)' }}>AI Dispatch Center</h1>
          <p className="text-xs mt-0.5" style={{ color: 'var(--heart-text-secondary)' }}>HEART AI autonomously triages, allocates hospitals, and dispatches — zero manual intervention.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={simulateCall} className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white transition-all hover:scale-[1.02]" style={{ background: 'linear-gradient(135deg, #e74c5a, #d4404f)' }}>
            <PhoneCall className="h-3.5 w-3.5" /> Simulate Incoming
          </button>
        </div>
      </div>

      {/* AI Stats Bar */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        {[
          { label: 'AI Processing', value: aiProcessingCount, icon: Brain, color: '#8b5cf6', pulse: aiProcessingCount > 0 },
          { label: 'Auto-Dispatched', value: totalProcessed, icon: Truck, color: '#16a34a' },
          { label: 'Active Cases', value: activeCases.length, icon: Activity, color: '#ea580c' },
          { label: 'Avg Response', value: '< 3s', icon: Zap, color: '#3b82f6' },
        ].map(s => (
          <div key={s.label} className="card p-3.5 flex items-center gap-3">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${s.pulse ? 'animate-pulse' : ''}`} style={{ background: `${s.color}15` }}>
              <s.icon className="h-4 w-4" style={{ color: s.color }} />
            </div>
            <div>
              <div className="text-[10px] font-medium" style={{ color: 'var(--heart-text-muted)' }}>{s.label}</div>
              <div className="text-lg font-black" style={{ color: 'var(--heart-text)' }}>{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-5">
        {/* ═══ LEFT: Case List ═══ */}
        <div className="w-[340px] flex-none space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>Emergency Queue</h2>
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={{ background: '#fee2e2', color: '#dc2626' }}>{activeCases.length} Active</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'var(--heart-surface)', border: '1px solid var(--heart-border-light)' }}>
            <Search className="h-3.5 w-3.5" style={{ color: 'var(--heart-text-muted)' }} />
            <input type="text" value={searchQ} onChange={e => setSearchQ(e.target.value)} placeholder="Search cases..." className="bg-transparent outline-none text-xs w-full" style={{ color: 'var(--heart-text)' }} />
          </div>
          <div className="space-y-2 max-h-[calc(100vh-18rem)] overflow-y-auto pr-1">
            {cases.filter(c => c.name.toLowerCase().includes(searchQ.toLowerCase())).map(c => {
              const cs = sevColor(c.severity);
              const isSelected = selectedId === c.id;
              return (
                <button key={c.id} onClick={() => setSelectedId(c.id)}
                  className="w-full text-left card p-3.5 transition-all hover:scale-[1.005]"
                  style={{
                    background: isSelected ? cs.bg : 'var(--heart-surface)',
                    borderLeft: `3px solid ${isSelected ? cs.color : 'transparent'}`,
                    opacity: c.status === 'completed' ? 0.5 : 1,
                  }}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded" style={{ background: cs.bg, color: cs.color, border: `1px solid ${cs.border}` }}>{c.severity}</span>
                    <span className="text-[9px]" style={{ color: 'var(--heart-text-muted)' }}>{c.timeAgo}</span>
                  </div>
                  <div className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>
                    {c.name} {c.age > 0 ? `(${c.age}, ${c.gender})` : ''}
                  </div>
                  <div className="text-[10px] mt-1" style={{ color: 'var(--heart-text-muted)' }}>{c.source} • {c.location}</div>
                  {/* Status badges */}
                  {c.status === 'ai_processing' && <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold animate-pulse" style={{ color: '#8b5cf6' }}><Brain className="h-3 w-3" /> AI Processing...</div>}
                  {c.status === 'dispatched' && <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold" style={{ color: '#16a34a' }}><Truck className="h-3 w-3" /> Auto-Dispatched</div>}
                  {c.status === 'completed' && <div className="flex items-center gap-1 mt-1.5 text-[10px] font-bold" style={{ color: '#6b7280' }}><CheckCircle className="h-3 w-3" /> Completed</div>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ═══ RIGHT: AI Decision Detail ═══ */}
        <div className="flex-1 space-y-4">
          {/* Case Header */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>AI Decision Report</h2>
                <div className="text-[10px] mt-0.5" style={{ color: 'var(--heart-text-muted)' }}>ID: {selected.id}</div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{selected.severity}</span>
                {selected.status === 'dispatched' && (
                  <button onClick={() => markCompleted(selected.id)} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: '#dcfce7', color: '#16a34a' }}>Mark Completed</button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold" style={{ background: sc.bg, color: sc.color }}>{selected.name.charAt(0)}</div>
              <div>
                <div className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>{selected.name} {selected.age > 0 ? `(${selected.age}, ${selected.gender})` : ''}</div>
                <div className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--heart-text-muted)' }}><MapPin className="h-3 w-3" /> {selected.location}</div>
              </div>
            </div>
            {/* Keywords */}
            <div className="flex flex-wrap gap-1.5">
              {selected.keywords.map(k => (
                <span key={k} className="text-[10px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: sc.bg, color: sc.color, border: `1px solid ${sc.border}` }}>{k}</span>
              ))}
            </div>
          </div>

          {/* AI Processing State */}
          {selected.status === 'ai_processing' && (
            <div className="card p-8 flex flex-col items-center justify-center gap-3" style={{ border: '1px solid #c4b5fd' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center animate-pulse" style={{ background: 'linear-gradient(135deg, #8b5cf6, #7c3aed)' }}>
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div className="text-sm font-bold" style={{ color: '#7c3aed' }}>HEART AI Analyzing Case...</div>
              <div className="text-[11px]" style={{ color: 'var(--heart-text-muted)' }}>Autonomous triage → Hospital allocation → Auto-dispatch</div>
              <div className="flex items-center gap-4 mt-2">
                {['Triage', 'Allocate', 'Dispatch'].map((s, i) => (
                  <div key={s} className="flex items-center gap-1.5">
                    <div className="w-5 h-5 rounded-full flex items-center justify-center animate-pulse" style={{ background: '#ede9fe', animationDelay: `${i * 0.3}s` }}>
                      <div className="w-2 h-2 rounded-full" style={{ background: '#8b5cf6' }} />
                    </div>
                    <span className="text-[10px] font-semibold" style={{ color: '#7c3aed' }}>{s}</span>
                    {i < 2 && <ArrowRight className="h-3 w-3" style={{ color: '#c4b5fd' }} />}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Completed Decision */}
          {(selected.status === 'dispatched' || selected.status === 'completed') && (
            <>
              {/* Decision Metrics */}
              <div className="grid grid-cols-4 gap-3">
                <div className="card p-4">
                  <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--heart-text-muted)' }}>AI Severity</div>
                  <div className="text-lg font-black px-3 py-1 rounded-lg inline-block" style={{ background: sc.bg, color: sc.color }}>{selected.severity}</div>
                </div>
                <div className="card p-4">
                  <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--heart-text-muted)' }}>Confidence</div>
                  <div className="text-lg font-black" style={{ color: 'var(--heart-text)' }}>{selected.aiDecision?.confidencePercent || 88}%</div>
                </div>
                <div className="card p-4">
                  <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--heart-text-muted)' }}>Risk Score</div>
                  <div className="text-lg font-black" style={{ color: 'var(--heart-text)' }}>{selected.aiDecision?.riskScore || 7}/10</div>
                </div>
                <div className="card p-4">
                  <div className="text-[10px] font-bold mb-1" style={{ color: 'var(--heart-text-muted)' }}>Status</div>
                  <div className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${selected.status === 'dispatched' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                    <span className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>{selected.status === 'dispatched' ? 'Auto-Dispatched' : 'Completed'}</span>
                  </div>
                </div>
              </div>

              {/* Auto-Allocation Result */}
              <div className="card p-5 space-y-4" style={{ border: '1px solid #bbf7d0' }}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: '#dcfce7' }}>
                      <Sparkles className="h-4 w-4" style={{ color: '#16a34a' }} />
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{ color: '#16a34a' }}>AI Auto-Allocated & Dispatched</div>
                      <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>No manual intervention required</div>
                    </div>
                  </div>
                  {selected.processedAt && (
                    <div className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: 'var(--heart-text-muted)' }}>
                      <Clock className="h-3 w-3" /> Processed at {selected.processedAt}
                    </div>
                  )}
                </div>

                {/* AI Pipeline Steps */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { step: '1. AI Triage', detail: `Severity: ${selected.severity}`, sub: selected.severity === 'CRITICAL' ? 'ALS Dispatched' : 'Standard Response', color: sc.color },
                    { step: '2. Hospital Allocated', detail: selected.allocatedHospital || 'Best Match', sub: `ETA: ${selected.dispatchEta || '—'}`, color: '#3b82f6' },
                    { step: '3. Auto-Dispatched', detail: 'Ambulance en route', sub: 'GPS tracking active', color: '#16a34a' },
                  ].map(s => (
                    <div key={s.step} className="p-3 rounded-xl" style={{ background: 'var(--heart-bg)' }}>
                      <div className="flex items-center gap-1.5 mb-1">
                        <CheckCircle className="h-3 w-3" style={{ color: s.color }} />
                        <div className="text-[10px] font-bold" style={{ color: s.color }}>{s.step}</div>
                      </div>
                      <div className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>{s.detail}</div>
                      <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>{s.sub}</div>
                    </div>
                  ))}
                </div>

                {/* Allocated Hospital Detail */}
                {selected.allocatedHospital && (
                  <div className="flex items-center justify-between p-3 rounded-xl" style={{ background: '#f0fdf4', border: '1px solid #86efac' }}>
                    <div className="flex items-center gap-3">
                      <Building2 className="h-4 w-4" style={{ color: '#16a34a' }} />
                      <div>
                        <div className="text-xs font-bold" style={{ color: 'var(--heart-text)' }}>{selected.allocatedHospital}</div>
                        <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>
                          {hospitals.find(h => h.name === selected.allocatedHospital)
                            ? `ED Load: ${hospitals.find(h => h.name === selected.allocatedHospital)!.edLoad}% • ${hospitals.find(h => h.name === selected.allocatedHospital)!.beds} Beds`
                            : ''}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold px-2.5 py-1 rounded-lg" style={{ background: '#dcfce7', color: '#16a34a' }}>ETA {selected.dispatchEta}</span>
                  </div>
                )}

                {/* Decision Trace */}
                <div className="flex items-center gap-4 text-[10px] pt-2" style={{ color: 'var(--heart-text-muted)', borderTop: '1px solid var(--heart-border-light)' }}>
                  <div className="flex items-center gap-1"><Shield className="h-3 w-3" /> Autonomous Decision</div>
                  <div className="flex items-center gap-1"><Radio className="h-3 w-3" /> Decision trace logged</div>
                  <div className="flex items-center gap-1"><Wifi className="h-3 w-3" /> Vertex AI connected</div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
