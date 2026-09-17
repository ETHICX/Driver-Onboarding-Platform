import React from 'react';
import { AuthUser } from '../types';
import { Truck, ShieldCheck, LogOut, User, RefreshCw, UserCheck } from 'lucide-react';

interface NavbarProps {
  currentUser?: AuthUser | null;
  user?: AuthUser | null;
  onLogout?: () => void;
  onSignOut?: () => void;
  onQuickSwitch?: ((role: 'driver' | 'admin', email?: string) => void) | ((email: string) => void);
  activeView?: string;
  setActiveView?: (view: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  user,
  onLogout,
  onSignOut,
  onQuickSwitch,
  activeView = 'onboarding',
  setActiveView
}) => {
  const effectiveUser = currentUser !== undefined ? currentUser : (user ?? null);
  const handleLogout = () => {
    if (onLogout) onLogout();
    else if (onSignOut) onSignOut();
  };

  const handleSwitch = (role: 'driver' | 'admin', email: string) => {
    if (!onQuickSwitch) return;
    if (onQuickSwitch.length === 1) {
      (onQuickSwitch as (email: string) => void)(email);
    } else {
      (onQuickSwitch as (role: 'driver' | 'admin', email?: string) => void)(role, email);
    }
  };

  const handleViewChange = (view: string) => {
    if (typeof setActiveView === 'function') {
      setActiveView(view);
    }
  };

  return (
    <header id="app-navbar" className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Name */}
          <div className="flex items-center gap-3">
            <button
              id="navbar-brand-button"
              type="button"
              onClick={() => {
                if (effectiveUser?.role === 'admin') handleViewChange('admin');
                else if (effectiveUser?.role === 'driver') handleViewChange('onboarding');
                else handleViewChange('login');
              }}
              className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
            >
              <div className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-900/30 group-hover:bg-emerald-500 transition-colors shrink-0">
                <Truck className="h-4 w-4 sm:h-5 sm:w-5" />
              </div>
              <div className="min-w-0">
                <span className="text-sm sm:text-base font-bold tracking-tight text-slate-100 flex items-center gap-1.5 truncate">
                  LOGISWIFT
                  <span className="hidden xs:inline-block text-[10px] sm:text-xs font-medium px-1.5 sm:px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                    Driver Ops
                  </span>
                </span>
                <span className="hidden sm:block text-xs text-slate-400 -mt-0.5 truncate">Courier & Freight Onboarding</span>
              </div>
            </button>
          </div>

          {/* Quick Demo Switcher & Session Controls */}
          <div className="flex items-center gap-3">
            {/* Quick switcher helper pill */}
            <div id="navbar-demo-switcher" className="hidden md:flex items-center bg-slate-800/80 rounded-lg p-1 border border-slate-700/60 text-xs">
              <span className="px-2 text-slate-400 font-medium">Test Switcher:</span>
              <button
                id="btn-switch-demo-driver"
                type="button"
                onClick={() => handleSwitch('driver', 'driver@example.com')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  effectiveUser?.email === 'driver@example.com' 
                    ? 'bg-emerald-600 text-white shadow-xs' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Log in as Marcus Vance (Driver with submitted app)"
              >
                Driver Demo
              </button>
              <button
                id="btn-switch-demo-admin"
                type="button"
                onClick={() => handleSwitch('admin', 'admin@example.com')}
                className={`px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                  effectiveUser?.role === 'admin' 
                    ? 'bg-blue-600 text-white shadow-xs' 
                    : 'text-slate-300 hover:text-white hover:bg-slate-700'
                }`}
                title="Log in as Sarah Jenkins (Admin Reviewer)"
              >
                Admin Demo
              </button>
            </div>

            {/* Current user badge & menu */}
            {effectiveUser ? (
              <div className="flex items-center gap-3 pl-2 border-l border-slate-700">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-semibold text-slate-200">
                    {effectiveUser.firstName} {effectiveUser.lastName}
                  </div>
                  <div className="text-[11px] text-slate-400 flex items-center justify-end gap-1">
                    {effectiveUser.role === 'admin' ? (
                      <span className="inline-flex items-center gap-1 text-blue-400 font-medium">
                        <ShieldCheck className="w-3 h-3" /> Administrator
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <UserCheck className="w-3 h-3" /> Driver
                      </span>
                    )}
                  </div>
                </div>

                {effectiveUser.role === 'driver' && (
                  <button
                    id="btn-navbar-toggle-status"
                    type="button"
                    onClick={() => handleViewChange(activeView === 'status' ? 'onboarding' : 'status')}
                    className="text-xs px-2.5 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
                  >
                    {activeView === 'status' ? 'Application Form' : 'View Status'}
                  </button>
                )}

                <button
                  id="btn-navbar-signout"
                  type="button"
                  onClick={handleLogout}
                  className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
                  title="Sign out"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  id="btn-navbar-signin"
                  type="button"
                  onClick={() => handleViewChange('login')}
                  className={`text-xs font-medium px-3 py-1.5 rounded transition cursor-pointer ${
                    activeView === 'login' ? 'bg-slate-800 text-white' : 'text-slate-300 hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  id="btn-navbar-register"
                  type="button"
                  onClick={() => handleViewChange('register')}
                  className="text-xs font-medium px-3.5 py-1.5 rounded bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm cursor-pointer"
                >
                  Apply as Driver
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
