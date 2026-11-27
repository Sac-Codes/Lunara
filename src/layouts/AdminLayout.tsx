import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Bell,
  BookMarked,
  ClipboardList,
  Download,
  LayoutDashboard,
  LogOut,
  Moon,
  Settings,
  ShieldAlert,
  Sliders,
  Sun,
  Users,
} from 'lucide-react';
import { IconButton } from '../components/ui/Button';
import { LunaraMark } from '../components/ui/LunaraMark';
import { useAuth } from '../providers/AuthProvider';
import { useLunara } from '../providers/LunaraProvider';

const ADMIN_NAV_GROUPS = [
  {
    group: 'Operations',
    items: [
      { to: '/admin', label: 'Overview', icon: LayoutDashboard, end: true },
      { to: '/admin/users', label: 'Users', icon: Users, end: false },
      { to: '/admin/export', label: 'Data Export', icon: Download, end: false },
    ],
  },
  {
    group: 'Communication & Content',
    items: [
      { to: '/admin/notifications', label: 'Notifications', icon: Bell, end: false },
      { to: '/admin/content', label: 'Content Hub', icon: BookMarked, end: false },
    ],
  },
  {
    group: 'System',
    items: [
      { to: '/admin/parameters', label: 'Parameters', icon: Sliders, end: false },
      { to: '/admin/settings', label: 'Configuration', icon: Settings, end: false },
      { to: '/admin/audit', label: 'Audit Logs', icon: ClipboardList, end: false },
    ],
  },
];

export const AdminLayout: React.FC = () => {
  const { resolvedTheme, toggleTheme, showToast } = useLunara();
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Signed out of Lunara Admin.', 'blue');
    navigate('/login', { replace: true });
  };

  return (
    <div className="lunara-atmosphere min-h-dvh flex flex-col text-[var(--text-primary)]">
      {/* Structured Deep Midnight Navy / Indigo Operational Header */}
      <header className="border-b border-[var(--border-subtle)] bg-[#11163D] text-white sticky top-0 z-30">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <LunaraMark className="w-8 h-8 shrink-0" />
            <div className="min-w-0">
              <div className="font-display text-lg font-medium leading-none">
                Lunara Admin
              </div>
              <div className="text-[11px] text-[#B9D3F4] truncate mt-0.5">
                Operations, Content &amp; Workspace Console
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden md:inline text-xs text-[#B9D3F4] mr-2">
              {user?.name} · Admin
            </span>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              className="inline-flex items-center justify-center w-9 h-9 rounded-[11px] bg-white/10 hover:bg-white/15 transition-colors cursor-pointer"
            >
              {resolvedTheme === 'dark' ? (
                <Sun className="w-4 h-4 text-[#F3D8A9]" />
              ) : (
                <Moon className="w-4 h-4 text-[#D5BCE8]" />
              )}
            </button>

            <Link
              to="/"
              className="inline-flex items-center gap-1.5 min-h-[38px] px-3 rounded-[11px] bg-white/12 hover:bg-white/20 text-xs font-medium text-white transition-colors whitespace-nowrap"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Main App</span>
            </Link>

            <IconButton
              label="Sign out"
              size="sm"
              onClick={handleLogout}
              className="text-white/80 hover:text-white hover:bg-white/15"
            >
              <LogOut className="w-4 h-4" />
            </IconButton>
          </div>
        </div>

        {/* Tablet & Mobile scrollable sub-navigation */}
        <div className="lg:hidden border-t border-white/10 bg-[#1B2056]">
          <div className="mx-auto max-w-[1320px] px-4 sm:px-6 flex items-center gap-1 overflow-x-auto py-1.5">
            {ADMIN_NAV_GROUPS.flatMap((g) => g.items).map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) =>
                    `inline-flex items-center gap-2 min-h-[38px] px-3 rounded-[10px] text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                      isActive
                        ? 'bg-[#9B70DC] text-white'
                        : 'text-[#DFEAF8]/80 hover:text-white hover:bg-white/10'
                    }`
                  }
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </div>
        </div>
      </header>

      {/* Honest Frontend Prototype Notice */}
      <div className="bg-[var(--surface-blue)] border-b border-[var(--border-subtle)]">
        <div className="mx-auto max-w-[1320px] px-4 sm:px-6 lg:px-8 py-2.5 flex items-center gap-2.5 text-xs text-[var(--blue-strong)]">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>
            Frontend prototype mode: directory records, exports, and notifications operate on simulated sample users locally. Real cross-user enforcement will apply once Supabase Auth &amp; RLS are connected.
          </span>
        </div>
      </div>

      {/* Desktop Sidebar + Workspace Main */}
      <div className="flex-1 mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8 py-6 sm:py-8 flex gap-8 items-start">
        <aside
          aria-label="Admin sidebar navigation"
          className="hidden lg:block w-[240px] shrink-0 sticky top-24 rounded-[20px] bg-[var(--surface-main)] border border-[var(--border-subtle)] p-4 space-y-5"
        >
          {ADMIN_NAV_GROUPS.map((section) => (
            <div key={section.group}>
              <div className="px-3 mb-1.5 text-[11px] font-medium uppercase tracking-wider text-[var(--text-muted)]">
                {section.group}
              </div>
              <div className="space-y-1">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        `flex items-center gap-2.5 min-h-[40px] px-3 rounded-[11px] text-sm font-medium transition-colors ${
                          isActive
                            ? 'bg-[var(--surface-blue)] text-[var(--blue-strong)]'
                            : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)]/70'
                        }`
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{item.label}</span>
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </aside>

        <main className="flex-1 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
