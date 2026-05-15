/**
 * HEART Role Landing Page — Beautiful bento grid with glassmorphism
 * Users select their role, then sign in or use Demo Mode
 */

import { useNavigate } from 'react-router-dom';
import { Heart, User, Radio, Stethoscope, Truck, Hospital, Zap, Shield } from 'lucide-react';
import { signOutAll, demoSignIn } from '../components/LoginGate';

const roles = [
  {
    key: 'patient', path: '/user', label: 'Patient / Family', icon: User,
    accent: '#10b981', gradient: 'linear-gradient(135deg, #10b981, #059669)',
    desc: 'Monitor health vitals, AI check-ins, and family alerts.',
    features: ['Health Dashboard', 'AI Triage', 'WhatsApp Alerts'],
  },
  {
    key: 'operator', path: '/operator', label: 'AI Dispatch', icon: Radio,
    accent: '#3b82f6', gradient: 'linear-gradient(135deg, #3b82f6, #2563eb)',
    desc: 'Fully automated AI triage, hospital allocation, and dispatch.',
    features: ['Auto-Triage', 'AI Dispatch', 'Auto-Allocate'],
  },
  {
    key: 'doctor', path: '/doctor', label: 'Doctor', icon: Stethoscope,
    accent: '#ec4899', gradient: 'linear-gradient(135deg, #ec4899, #db2777)',
    desc: 'Patient management, clinical reports, and document agreements.',
    features: ['Patient Records', 'Full Reports', 'Agreements'],
  },
  {
    key: 'field', path: '/field', label: 'Field Unit', icon: Truck,
    accent: '#f59e0b', gradient: 'linear-gradient(135deg, #f59e0b, #d97706)',
    desc: 'Mobile EMHR unit management with live vitals and triage.',
    features: ['Live Vitals', 'On-Board Patients', 'AI Triage'],
  },
  {
    key: 'admin', path: '/hospital', label: 'Hospital Admin', icon: Hospital,
    accent: '#8b5cf6', gradient: 'linear-gradient(135deg, #8b5cf6, #7c3aed)',
    desc: 'Bed allocation, ward management, and ED patient routing.',
    features: ['Ward Beds', 'ED Dispatch', 'Resource Mgmt'],
  },
];

export default function RoleLanding() {
  const navigate = useNavigate();

  const handleDemo = () => {
    demoSignIn();
    navigate('/operator');
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #f6f5f1 0%, #efeee9 50%, #f0e8e8 100%)' }}>
      {/* Background decorative circles */}
      <div className="absolute top-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #e74c5a, transparent)' }} />
      <div className="absolute bottom-[-150px] left-[-100px] w-[400px] h-[400px] rounded-full opacity-10" style={{ background: 'radial-gradient(circle, #3b82f6, transparent)' }} />
      <div className="absolute top-[50%] left-[50%] w-[600px] h-[600px] rounded-full opacity-5 -translate-x-1/2 -translate-y-1/2" style={{ background: 'radial-gradient(circle, #8b5cf6, transparent)' }} />

      {/* Brand */}
      <div className="text-center mb-10 relative z-10">
        <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg mb-4" style={{ background: 'linear-gradient(135deg, #e74c5a, #d4404f)' }}>
          <Heart className="h-8 w-8 text-white" fill="currentColor" />
        </div>
        <h1 className="text-3xl font-black tracking-tight" style={{ color: 'var(--heart-text)' }}>HEART</h1>
        <p className="text-sm font-medium mt-1" style={{ color: 'var(--heart-text-secondary)' }}>Homecare & Emergency AI Routing Technology</p>
        <p className="text-xs mt-2 max-w-md mx-auto" style={{ color: 'var(--heart-text-muted)' }}>
          Autonomous care decision engine for elderly patient monitoring.
          Select your role to access the clinical portal.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-3 gap-4 max-w-4xl w-full relative z-10">
        {/* Top row: 3 cards */}
        {roles.slice(0, 3).map(role => {
          const Icon = role.icon;
          return (
            <button key={role.key} onClick={() => navigate(role.path)}
              className="card-glass p-6 text-left group cursor-pointer transition-all hover:scale-[1.02]">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: role.gradient }}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--heart-text)' }}>{role.label}</h3>
              <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--heart-text-muted)' }}>{role.desc}</p>
              <div className="flex flex-wrap gap-1">
                {role.features.map(f => (
                  <span key={f} className="text-[9px] font-semibold px-2 py-0.5 rounded-md" style={{ background: `${role.accent}12`, color: role.accent }}>{f}</span>
                ))}
              </div>
            </button>
          );
        })}

        {/* Bottom row: 2 cards + Demo card */}
        {roles.slice(3).map(role => {
          const Icon = role.icon;
          return (
            <button key={role.key} onClick={() => navigate(role.path)}
              className="card-glass p-6 text-left group cursor-pointer transition-all hover:scale-[1.02]">
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: role.gradient }}>
                <Icon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--heart-text)' }}>{role.label}</h3>
              <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--heart-text-muted)' }}>{role.desc}</p>
              <div className="flex flex-wrap gap-1">
                {role.features.map(f => (
                  <span key={f} className="text-[9px] font-semibold px-2 py-0.5 rounded-md" style={{ background: `${role.accent}12`, color: role.accent }}>{f}</span>
                ))}
              </div>
            </button>
          );
        })}

        {/* Demo Access Card */}
        <button onClick={handleDemo}
          className="card-glass p-6 text-left group cursor-pointer transition-all hover:scale-[1.02] flex flex-col justify-between"
          style={{ border: '1px solid rgba(231, 76, 90, 0.2)' }}>
          <div>
            <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110" style={{ background: 'linear-gradient(135deg, #1e293b, #334155)' }}>
              <Zap className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-sm font-bold mb-1" style={{ color: 'var(--heart-text)' }}>Demo Mode</h3>
            <p className="text-[11px] leading-relaxed mb-3" style={{ color: 'var(--heart-text-muted)' }}>Bypass all sign-in. Access every portal instantly for demonstration.</p>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] font-bold" style={{ color: '#e74c5a' }}>
            <Shield className="h-3 w-3" /> All portals unlocked
          </div>
        </button>
      </div>

      {/* Footer */}
      <div className="mt-8 text-center text-[10px] relative z-10" style={{ color: 'var(--heart-text-muted)' }}>
        National Hackathon: Project 2030 — MyAI Future Track 3 (Vital Signs)
      </div>
    </div>
  );
}
