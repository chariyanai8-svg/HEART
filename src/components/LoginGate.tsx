/**
 * HEART LoginGate — Role-based sign-in wrapper
 * Each portal requires authentication or Demo bypass
 */

import { useState } from 'react';
import { Heart, User, Radio, Stethoscope, Truck, Hospital, Eye, EyeOff, Zap } from 'lucide-react';

export type RoleKey = 'patient' | 'operator' | 'doctor' | 'field' | 'admin';

interface RoleConfig {
  label: string;
  icon: typeof User;
  accent: string;
  username: string;
  password: string;
}

const roleConfigs: Record<RoleKey, RoleConfig> = {
  patient:  { label: 'Patient / Family',  icon: User,        accent: '#10b981', username: 'patient',  password: 'heart123' },
  operator: { label: 'AI Dispatch',        icon: Radio,       accent: '#3b82f6', username: 'operator', password: 'heart999' },
  doctor:   { label: 'Doctor',            icon: Stethoscope, accent: '#ec4899', username: 'doctor',   password: 'heartdoc' },
  field:    { label: 'Field Unit',        icon: Truck,       accent: '#f59e0b', username: 'field',    password: 'heartfield' },
  admin:    { label: 'Hospital Admin',    icon: Hospital,    accent: '#8b5cf6', username: 'admin',    password: 'heartadmin' },
};

/* ── Shared auth state across all portals ── */
const authedRoles = new Set<RoleKey>();
let _forceUpdate: (() => void) | null = null;

/** Sign out a specific role */
export function signOut(role: RoleKey) {
  authedRoles.delete(role);
}

/** Sign out ALL roles */
export function signOutAll() {
  authedRoles.clear();
}

/** Demo sign in — authenticate all roles */
export function demoSignIn() {
  (Object.keys(roleConfigs) as RoleKey[]).forEach(r => authedRoles.add(r));
}

/** Check if a role is authenticated */
export function isAuthed(role: RoleKey): boolean {
  return authedRoles.has(role);
}

interface LoginGateProps {
  role: RoleKey;
  children: React.ReactNode;
}

export default function LoginGate({ role, children }: LoginGateProps) {
  const [authed, setAuthed] = useState(authedRoles.has(role));
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');

  const config = roleConfigs[role];
  const Icon = config.icon;

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === config.username && password === config.password) {
      authedRoles.add(role);
      setAuthed(true);
      setError('');
    } else {
      setError('Invalid credentials. Please check your username and password.');
    }
  };

  const handleDemo = () => {
    demoSignIn();
    setAuthed(true);
  };

  if (authed) return <>{children}</>;

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center p-6" style={{ background: 'var(--heart-bg)' }}>
      <div className="w-full max-w-md">
        {/* Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg mb-4" style={{ background: 'linear-gradient(135deg, #e74c5a, #d4404f)' }}>
            <Heart className="h-7 w-7 text-white" fill="currentColor" />
          </div>
          <h1 className="text-xl font-bold" style={{ color: 'var(--heart-text)' }}>HEART Clinical Portal</h1>
          <p className="text-xs mt-1" style={{ color: 'var(--heart-text-muted)' }}>Homecare & Emergency AI Routing Technology</p>
        </div>

        {/* Login Card */}
        <div className="card-glass p-6" style={{ boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
          {/* Role Badge */}
          <div className="flex items-center gap-3 mb-6 p-3 rounded-xl" style={{ background: `${config.accent}10` }}>
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${config.accent}20`, color: config.accent }}>
              <Icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold" style={{ color: 'var(--heart-text)' }}>Sign in as {config.label}</div>
              <div className="text-[10px]" style={{ color: 'var(--heart-text-muted)' }}>Restricted access — credentials required</div>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-[10px] font-bold block mb-1.5" style={{ color: 'var(--heart-text-muted)' }}>USERNAME</label>
              <input type="text" value={username} onChange={e => { setUsername(e.target.value); setError(''); }}
                placeholder={`e.g. ${config.username}`}
                className="w-full text-sm p-3 rounded-xl outline-none transition-all focus:ring-2"
                style={{ background: 'var(--heart-bg)', color: 'var(--heart-text)', border: '1px solid var(--heart-border)' }}
                autoFocus />
            </div>
            <div>
              <label className="text-[10px] font-bold block mb-1.5" style={{ color: 'var(--heart-text-muted)' }}>PASSWORD</label>
              <div className="relative">
                <input type={showPw ? 'text' : 'password'} value={password} onChange={e => { setPassword(e.target.value); setError(''); }}
                  placeholder="Enter password"
                  className="w-full text-sm p-3 pr-10 rounded-xl outline-none transition-all focus:ring-2"
                  style={{ background: 'var(--heart-bg)', color: 'var(--heart-text)', border: '1px solid var(--heart-border)' }} />
                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--heart-text-muted)' }}>
                  {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {error && <div className="text-[11px] font-semibold p-2.5 rounded-lg" style={{ background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca' }}>{error}</div>}

            <button type="submit" className="w-full py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90" style={{ background: config.accent }}>
              Sign In
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px" style={{ background: 'var(--heart-border)' }} />
            <span className="text-[10px] font-semibold" style={{ color: 'var(--heart-text-muted)' }}>OR</span>
            <div className="flex-1 h-px" style={{ background: 'var(--heart-border)' }} />
          </div>

          {/* Demo Button */}
          <button onClick={handleDemo}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.01]"
            style={{ background: 'linear-gradient(135deg, #1e293b, #334155)', color: '#fff' }}>
            <Zap className="h-4 w-4" /> Demo Mode — Skip Sign In
          </button>

          <p className="text-center text-[10px] mt-4" style={{ color: 'var(--heart-text-muted)' }}>
            Demo mode grants access to all portals without credentials.
          </p>
        </div>
      </div>
    </div>
  );
}
