import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Heart, LogOut } from 'lucide-react';
import { User, Radio, Stethoscope, Truck, Hospital } from 'lucide-react';
import ChatWidget from './ChatWidget';
import { signOutAll } from './LoginGate';

const roleMap: Record<string, { label: string; icon: typeof User; accent: string }> = {
  '/user':     { label: 'Patient / Family', icon: User, accent: '#10b981' },
  '/operator': { label: 'AI Dispatch',      icon: Radio, accent: '#3b82f6' },
  '/doctor':   { label: 'Doctor',           icon: Stethoscope, accent: '#ec4899' },
  '/field':    { label: 'Field Unit',       icon: Truck, accent: '#f59e0b' },
  '/hospital': { label: 'Hospital Admin',   icon: Hospital, accent: '#8b5cf6' },
};

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentRole = roleMap[location.pathname];

  const handleSignOut = () => {
    signOutAll();
    navigate('/');
  };

  // Don't show nav on landing page
  if (location.pathname === '/') return <Outlet />;

  return (
    <div className="min-h-screen" style={{ background: 'var(--heart-bg)' }}>
      {/* Top Navigation */}
      <nav
        className="sticky top-0 z-50"
        style={{
          background: 'rgba(255, 255, 255, 0.75)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          borderBottom: '1px solid var(--heart-border-light)',
        }}
      >
        <div className="mx-auto max-w-[1600px] px-5">
          <div className="flex h-14 items-center justify-between">
            {/* Brand */}
            <button onClick={() => navigate('/')} className="flex items-center gap-3 transition-opacity hover:opacity-80">
              <div
                className="flex h-9 w-9 items-center justify-center rounded-xl shadow-sm"
                style={{ background: 'linear-gradient(135deg, #e74c5a, #d4404f)' }}
              >
                <Heart className="h-5 w-5 text-white" fill="currentColor" />
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-sm font-bold tracking-wide" style={{ color: 'var(--heart-text)' }}>
                  HEART
                </span>
                <span className="text-[10px] hidden sm:block" style={{ color: 'var(--heart-text-muted)' }}>
                  Care Decision Engine
                </span>
              </div>
            </button>

            {/* Current Role + Status */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex items-center gap-2 text-xs" style={{ color: 'var(--heart-text-muted)' }}>
                <div className="status-dot status-dot-green" />
                <span>System Active</span>
              </div>

              {currentRole && (() => {
                const Icon = currentRole.icon;
                return (
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl" style={{ background: `${currentRole.accent}10` }}>
                    <Icon className="h-3.5 w-3.5" style={{ color: currentRole.accent }} />
                    <span className="text-xs font-semibold" style={{ color: currentRole.accent }}>{currentRole.label}</span>
                  </div>
                );
              })()}

              <button onClick={handleSignOut}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all hover:bg-red-50"
                style={{ color: '#ef4444', border: '1px solid #fecaca' }}>
                <LogOut className="h-3.5 w-3.5" /> Sign Out
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="mx-auto max-w-[1600px]">
        <Outlet />
      </main>
      {/* AI Chat Widget (global) */}
      <ChatWidget />
    </div>
  );
}
