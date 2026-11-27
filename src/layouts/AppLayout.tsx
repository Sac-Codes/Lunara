import React, { useEffect, useMemo, useRef, useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  Compass,
  Home,
  LogOut,
  Menu,
  Moon,
  PenLine,
  Search,
  Settings,
  Shield,
  Sun,
  X,
} from 'lucide-react';
import { OfflineIndicator } from '../components/pwa/OfflineIndicator';
import { PWAInstallButton } from '../components/pwa/PWAInstallButton';
import { IconButton } from '../components/ui/Button';
import { LunaraMark } from '../components/ui/LunaraMark';
import { LUNARA_ARTWORK } from '../lib/atmosphere';
import { useAuth } from '../providers/AuthProvider';
import { useLunara } from '../providers/LunaraProvider';

const DESKTOP_NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/check-in', label: 'Check-in', icon: PenLine, end: false },
  { to: '/journal', label: 'Journal', icon: BookOpen, end: false },
  { to: '/calendar', label: 'Calendar', icon: CalendarDays, end: false },
  { to: '/insights', label: 'Insights', icon: BarChart3, end: false },
  { to: '/wisdom', label: 'Wisdom', icon: Compass, end: false },
  { to: '/notifications', label: 'Notifications', icon: Bell, end: false },
  { to: '/settings', label: 'Settings', icon: Settings, end: false },
];

const MOBILE_BOTTOM_TABS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/check-in', label: 'Check-in', icon: PenLine, end: false },
  { to: '/journal', label: 'Journal', icon: BookOpen, end: false },
  { to: '/wisdom', label: 'Wisdom', icon: Compass, end: false },
];

const QUICK_PAGES = [
  { label: 'Daily Check-in', sub: 'Mood, energy, and notes', to: '/check-in' },
  { label: 'Journal', sub: 'Personal pages & writing', to: '/journal' },
  { label: 'Bhagavad Gita Wisdom', sub: 'Verses, Sanskrit & learnings', to: '/wisdom' },
  { label: 'Calendar', sub: 'Revisit past days', to: '/calendar' },
  { label: 'Insights', sub: 'Wellbeing patterns', to: '/insights' },
  { label: 'Notifications', sub: 'Inbox & preferences', to: '/notifications' },
  { label: 'Settings', sub: 'Theme, profile & local data', to: '/settings' },
];

export const AppLayout: React.FC = () => {
  const {
    resolvedTheme,
    toggleTheme,
    profile,
    adminConfig,
    unreadNotificationCount,
    journals,
    publishedWisdom,
    checkIns,
    publishedAffirmations,
    showToast,
  } = useLunara();
  const { user, isAdmin, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [moreDrawerOpen, setMoreDrawerOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [quoteImgErr, setQuoteImgErr] = useState(false);

  const searchBoxRef = useRef<HTMLDivElement>(null);
  const profileBoxRef = useRef<HTMLDivElement>(null);

  const displayName = profile.displayName.trim() || user?.name || 'Soul';
  const sidebarQuote = publishedAffirmations[0]?.text || "You don't have to figure everything out today.";

  useEffect(() => {
    setMoreDrawerOpen(false);
    setMobileSearchOpen(false);
    setSearchFocused(false);
    setProfileMenuOpen(false);
  }, [location.pathname, location.search]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (searchBoxRef.current && !searchBoxRef.current.contains(e.target as Node)) {
        setSearchFocused(false);
      }
      if (profileBoxRef.current && !profileBoxRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const results: Array<{ id: string; kind: string; title: string; sub: string; to: string }> = [];

    publishedWisdom.forEach((w) => {
      if (
        w.title.toLowerCase().includes(q) ||
        w.topic.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q) ||
        `${w.chapter}:${w.verse}`.includes(q)
      ) {
        results.push({
          id: `w-${w.id}`,
          kind: 'Wisdom',
          title: `${w.title} (Gita ${w.chapter}:${w.verse})`,
          sub: w.takeaway,
          to: `/wisdom?q=${encodeURIComponent(w.title)}`,
        });
      }
    });

    journals.forEach((j) => {
      if (
        j.title.toLowerCase().includes(q) ||
        j.content.toLowerCase().includes(q) ||
        j.tags.some((t) => t.toLowerCase().includes(q))
      ) {
        results.push({
          id: `j-${j.id}`,
          kind: 'Journal',
          title: j.title,
          sub: j.date,
          to: `/journal?entry=${j.id}`,
        });
      }
    });

    checkIns.forEach((c) => {
      if (
        c.notes.toLowerCase().includes(q) ||
        (c.mood && c.mood.toLowerCase().includes(q)) ||
        c.date.includes(q)
      ) {
        results.push({
          id: `c-${c.id}`,
          kind: 'Check-in',
          title: `Check-in on ${c.date}`,
          sub: c.notes || c.mood || 'Recorded day',
          to: `/calendar?date=${c.date}`,
        });
      }
    });

    QUICK_PAGES.forEach((p) => {
      if (p.label.toLowerCase().includes(q) || p.sub.toLowerCase().includes(q)) {
        results.push({
          id: `p-${p.to}`,
          kind: 'Space',
          title: p.label,
          sub: p.sub,
          to: p.to,
        });
      }
    });

    return results.slice(0, 7);
  }, [searchQuery, publishedWisdom, journals, checkIns]);

  const handleLogout = () => {
    logout();
    showToast('Signed out of Lunara.', 'lavender');
    navigate('/login', { replace: true });
  };

  const isMoreRouteActive = ['/calendar', '/insights', '/notifications', '/settings'].some((r) =>
    location.pathname.startsWith(r)
  );

  return (
    <div className="lunara-atmosphere min-h-dvh flex flex-col md:flex-row">
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex md:flex-col md:w-[78px] lg:w-[264px] shrink-0 bg-[var(--bg-sidebar)]/92 backdrop-blur-md border-r border-[var(--border-subtle)] sticky top-0 h-dvh z-30 transition-colors">
        <div className="flex flex-col h-full px-2.5 lg:px-4 py-5 justify-between overflow-y-auto">
          <div>
            {/* Top Branding */}
            <NavLink
              to="/"
              className="flex items-center justify-center lg:justify-start gap-3 px-1.5 lg:px-2.5 py-1.5 rounded-[16px] focus-visible:outline-2 focus-visible:outline-[#9B70DC]"
            >
              <LunaraMark className="w-10 h-10 shrink-0 shadow-sm" />
              <div className="hidden lg:block min-w-0">
                <div className="font-display text-[22px] font-medium tracking-tight text-[var(--text-primary)] leading-none">
                  Lunara
                </div>
                <div className="mt-1 text-[11px] font-medium text-[var(--text-muted)] truncate">
                  Reflect • Heal • Grow
                </div>
              </div>
            </NavLink>

            {/* All 8 Navigation Destinations */}
            <nav aria-label="Primary navigation" className="mt-6 space-y-1">
              {DESKTOP_NAV_ITEMS.map((item) => {
                const Icon = item.icon;
                const isNotif = item.to === '/notifications';
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    end={item.end}
                    className={({ isActive }) =>
                      `group relative flex items-center justify-center lg:justify-between gap-3 min-h-[42px] px-2 lg:px-3 py-2 rounded-[13px] text-sm font-medium transition-all duration-150 ${
                        isActive
                          ? 'bg-gradient-to-r from-[#56348D] to-[#9B70DC] text-white shadow-sm'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-lavender)]/60'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <div className="flex items-center gap-3 min-w-0">
                          <span
                            className={`relative flex items-center justify-center w-7 h-7 rounded-[9px] transition-colors ${
                              isActive
                                ? 'bg-white/18 text-white'
                                : 'text-[var(--text-muted)] group-hover:text-[var(--text-primary)]'
                            }`}
                          >
                            <Icon className="w-[17px] h-[17px]" strokeWidth={isActive ? 2.1 : 1.8} />
                            {isNotif && unreadNotificationCount > 0 && (
                              <span
                                aria-hidden="true"
                                className="lg:hidden absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-[#E5B26F]"
                              />
                            )}
                          </span>
                          <span className="hidden lg:inline whitespace-nowrap">{item.label}</span>
                        </div>

                        {isNotif && unreadNotificationCount > 0 && (
                          <span
                            className={`hidden lg:inline-flex items-center justify-center min-w-[20px] h-[20px] px-1.5 rounded-full text-[11px] font-semibold tabular-nums ${
                              isActive
                                ? 'bg-white text-[#30205F]'
                                : 'bg-[#9B70DC] text-white'
                            }`}
                          >
                            {unreadNotificationCount}
                          </span>
                        )}
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            {/* Admin Console Entry */}
            {isAdmin && (
              <div className="mt-4 pt-3 border-t border-[var(--border-subtle)]">
                <NavLink
                  to="/admin"
                  className="flex items-center justify-center lg:justify-start gap-3 min-h-[42px] px-2 lg:px-3 py-2 rounded-[13px] text-sm font-medium bg-[var(--surface-blue)]/80 text-[var(--blue-strong)] hover:bg-[var(--surface-blue)] transition-colors"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-[9px] bg-[#78A6E7]/22">
                    <Shield className="w-[17px] h-[17px]" strokeWidth={1.9} />
                  </span>
                  <span className="hidden lg:inline whitespace-nowrap">Admin Console</span>
                </NavLink>
              </div>
            )}
          </div>

          {/* Sidebar Footer: Inspirational Artwork Quote Panel + Theme + PWA */}
          <div className="space-y-3 pt-4 border-t border-[var(--border-subtle)]">
            <div className="hidden lg:block relative overflow-hidden rounded-[18px] p-4 text-white min-h-[108px]">
              <div
                className="absolute inset-0 bg-gradient-to-br from-[#30205F] to-[#56348D]"
                aria-hidden="true"
              >
                {!quoteImgErr && (
                  <img
                    src={LUNARA_ARTWORK.lotusAffirmation}
                    alt=""
                    referrerPolicy="no-referrer"
                    onError={() => setQuoteImgErr(true)}
                    className="w-full h-full object-cover opacity-80"
                  />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#11163D]/90 via-[#30205F]/65 to-[#1B2056]/45" />
              </div>
              <div className="relative z-10">
                <div className="text-[11px] font-medium text-[#F4CFE0]">Quiet note</div>
                <p className="mt-1 font-display text-xs leading-relaxed text-white line-clamp-3">
                  &ldquo;{sidebarQuote}&rdquo;
                </p>
              </div>
            </div>

            <div className="hidden lg:block">
              <PWAInstallButton />
            </div>
            <div className="flex lg:hidden justify-center">
              <PWAInstallButton compact />
            </div>

            <div className="flex flex-col lg:flex-row items-center justify-between gap-2">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex items-center justify-center lg:justify-start gap-2.5 w-full min-h-[42px] px-2 lg:px-3 rounded-[13px] bg-[var(--surface-main)]/75 hover:bg-[var(--surface-main)] border border-[var(--border-subtle)] text-xs font-medium text-[var(--text-primary)] transition-colors cursor-pointer"
                aria-label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              >
                {resolvedTheme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-[#E5B26F] shrink-0" />
                    <span className="hidden lg:inline whitespace-nowrap">Light mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-[#56348D] shrink-0" />
                    <span className="hidden lg:inline whitespace-nowrap">Dark mode</span>
                  </>
                )}
              </button>

              <IconButton label="Sign out" size="sm" variant="surface" onClick={handleLogout}>
                <LogOut className="w-4 h-4 text-[var(--text-muted)]" />
              </IconButton>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Column */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Desktop & Tablet Top Utility Header (Search + Notifications + Profile) */}
        <header className="hidden md:flex items-center justify-between gap-4 px-6 lg:px-10 pt-5 pb-2 relative z-20">
          <div ref={searchBoxRef} className="relative flex-1 max-w-md">
            <Search
              className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
              aria-hidden="true"
            />
            <input
              type="search"
              value={searchQuery}
              onFocus={() => setSearchFocused(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSearchFocused(true);
              }}
              placeholder="Search journal, wisdom verses, or check-ins..."
              aria-label="Search Lunara"
              className="w-full min-h-[42px] rounded-[14px] lunara-glass border border-[var(--border-subtle)] pl-10 pr-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-2 focus:outline-[#9B70DC]"
            />

            {searchFocused && searchQuery.trim().length > 0 && (
              <div className="absolute left-0 right-0 mt-2 rounded-[18px] bg-[var(--surface-main)] border border-[var(--border-medium)] shadow-2xl overflow-hidden z-40">
                {searchResults.length === 0 ? (
                  <div className="p-4 text-xs text-[var(--text-muted)]">
                    No matching reflections or wisdom passages.
                  </div>
                ) : (
                  <div className="divide-y divide-[var(--border-subtle)] max-h-[320px] overflow-y-auto">
                    {searchResults.map((res) => (
                      <button
                        key={res.id}
                        type="button"
                        onClick={() => {
                          navigate(res.to);
                          setSearchQuery('');
                          setSearchFocused(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-[var(--surface-lavender)]/45 transition-colors cursor-pointer"
                      >
                        <div className="flex items-center justify-between gap-2 text-xs">
                          <span className="font-medium text-[var(--text-primary)] truncate">
                            {res.title}
                          </span>
                          <span className="text-[11px] text-[var(--lavender-strong)] shrink-0">
                            {res.kind}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-[var(--text-muted)] truncate">{res.sub}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <NavLink
              to="/notifications"
              aria-label={`Notifications${unreadNotificationCount > 0 ? ` (${unreadNotificationCount} unread)` : ''}`}
              className={({ isActive }) =>
                `relative inline-flex items-center justify-center w-11 h-11 rounded-[14px] border transition-colors ${
                  isActive
                    ? 'bg-[var(--surface-lavender)] border-[#9B70DC]/50 text-[var(--lavender-strong)]'
                    : 'lunara-glass border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-main)]'
                }`
              }
            >
              <Bell className="w-[18px] h-[18px]" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-[#9B70DC] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                  {unreadNotificationCount}
                </span>
              )}
            </NavLink>

            <div ref={profileBoxRef} className="relative">
              <button
                type="button"
                onClick={() => setProfileMenuOpen((v) => !v)}
                aria-expanded={profileMenuOpen}
                aria-label="Open profile menu"
                className="inline-flex items-center gap-2.5 min-h-[44px] pl-1.5 pr-3 rounded-[14px] lunara-glass border border-[var(--border-subtle)] hover:bg-[var(--surface-main)] transition-colors cursor-pointer"
              >
                <span className="w-8 h-8 rounded-[10px] bg-gradient-to-br from-[#56348D] to-[#9B70DC] text-white flex items-center justify-center font-display text-sm font-medium">
                  {displayName.slice(0, 1).toUpperCase()}
                </span>
                <span className="text-xs font-medium text-[var(--text-primary)] max-w-[110px] truncate">
                  {displayName}
                </span>
              </button>

              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-[18px] bg-[var(--surface-main)] border border-[var(--border-medium)] shadow-2xl p-2 z-40 space-y-1">
                  <div className="px-3 py-2 border-b border-[var(--border-subtle)]">
                    <div className="text-xs font-medium text-[var(--text-primary)] truncate">
                      {displayName}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)] truncate">
                      {user?.email || 'Local device'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('/settings')}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-[11px] text-xs font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-secondary)] cursor-pointer"
                  >
                    <Settings className="w-3.5 h-3.5" />
                    <span>Settings &amp; preferences</span>
                  </button>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => navigate('/admin')}
                      className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-[11px] text-xs font-medium text-[var(--blue-strong)] hover:bg-[var(--surface-blue)]/60 cursor-pointer"
                    >
                      <Shield className="w-3.5 h-3.5" />
                      <span>Admin Console</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="w-full text-left flex items-center gap-2.5 px-3 py-2 rounded-[11px] text-xs font-medium text-[var(--coral-strong)] hover:bg-[var(--surface-coral)]/50 cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Sign out</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Mobile Compact Header */}
        <header className="md:hidden sticky top-0 z-30 lunara-glass border-b border-[var(--border-subtle)] px-4 h-14 flex items-center justify-between gap-2">
          <NavLink to="/" className="flex items-center gap-2 min-w-0">
            <LunaraMark className="w-8 h-8 shrink-0" />
            <span className="font-display text-lg font-medium tracking-tight text-[var(--text-primary)] whitespace-nowrap">
              Lunara
            </span>
          </NavLink>

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Search Lunara"
              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-[11px] bg-[var(--surface-main)]/75 border border-[var(--border-subtle)] text-[var(--text-secondary)] cursor-pointer"
            >
              <Search className="w-4 h-4" />
            </button>

            <NavLink
              to="/notifications"
              aria-label={`Notifications${unreadNotificationCount > 0 ? ` (${unreadNotificationCount} unread)` : ''}`}
              className="relative inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-[11px] bg-[var(--surface-main)]/75 border border-[var(--border-subtle)] text-[var(--text-secondary)]"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-[#9B70DC] text-white text-[10px] font-semibold flex items-center justify-center tabular-nums">
                  {unreadNotificationCount}
                </span>
              )}
            </NavLink>

            <NavLink
              to="/settings"
              aria-label="Profile and settings"
              className="inline-flex items-center justify-center min-h-[40px] min-w-[40px] rounded-[11px] bg-gradient-to-br from-[#56348D] to-[#9B70DC] text-white font-display text-sm font-medium"
            >
              {displayName.slice(0, 1).toUpperCase()}
            </NavLink>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 min-w-0 pb-24 md:pb-12">
          {adminConfig.maintenanceNotice.trim() && (
            <div className="bg-[var(--surface-blue)] border-b border-[#78A6E7]/25 px-4 sm:px-6 lg:px-10 py-2.5 text-xs sm:text-sm text-[var(--blue-strong)]">
              <div className="mx-auto max-w-[1200px]">{adminConfig.maintenanceNotice}</div>
            </div>
          )}
          <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-10 pt-4 md:pt-4">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Mobile Bottom Navigation: Home, Check-in, Journal, Wisdom, More */}
      <nav
        aria-label="Mobile navigation"
        className="md:hidden fixed bottom-0 inset-x-0 z-40 px-2 pb-safe pt-1.5 bg-[var(--bg-sidebar)]/95 backdrop-blur-md border-t border-[var(--border-subtle)]"
      >
        <div className="grid grid-cols-5 items-center gap-1 max-w-lg mx-auto">
          {MOBILE_BOTTOM_TABS.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex flex-col items-center justify-center min-h-[48px] px-1 py-1 rounded-[14px] transition-all duration-150 ${
                    isActive
                      ? 'bg-gradient-to-br from-[#56348D] to-[#9B70DC] text-white shadow-xs'
                      : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon className="w-[19px] h-[19px]" strokeWidth={isActive ? 2.2 : 1.75} />
                    <span className="mt-1 text-[10px] font-medium leading-none whitespace-nowrap">
                      {item.label}
                    </span>
                  </>
                )}
              </NavLink>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreDrawerOpen(true)}
            aria-expanded={moreDrawerOpen}
            className={`relative flex flex-col items-center justify-center min-h-[48px] px-1 py-1 rounded-[14px] transition-all duration-150 cursor-pointer ${
              isMoreRouteActive || moreDrawerOpen
                ? 'bg-gradient-to-br from-[#56348D] to-[#9B70DC] text-white shadow-xs'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Menu className="w-[19px] h-[19px]" strokeWidth={1.9} />
            <span className="mt-1 text-[10px] font-medium leading-none whitespace-nowrap">More</span>
            {unreadNotificationCount > 0 && (
              <span className="absolute top-1.5 right-2.5 w-2 h-2 rounded-full bg-[#E5B26F]" />
            )}
          </button>
        </div>
      </nav>

      {/* Mobile Search Modal */}
      {mobileSearchOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Search Lunara"
          className="md:hidden fixed inset-0 z-50 bg-black/60 backdrop-blur-xs p-4 flex flex-col"
          onClick={() => setMobileSearchOpen(false)}
        >
          <div
            className="rounded-[24px] bg-[var(--surface-main)] border border-[var(--border-medium)] p-4 space-y-3 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
              <input
                type="search"
                autoFocus
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search journal, wisdom, check-ins..."
                className="flex-1 min-h-[42px] bg-transparent text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none"
              />
              <button
                type="button"
                onClick={() => setMobileSearchOpen(false)}
                aria-label="Close search"
                className="w-9 h-9 rounded-[10px] bg-[var(--surface-secondary)] flex items-center justify-center text-[var(--text-secondary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {searchQuery.trim().length > 0 && (
              <div className="divide-y divide-[var(--border-subtle)] max-h-[60vh] overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="py-4 text-xs text-center text-[var(--text-muted)]">
                    No matching results.
                  </p>
                ) : (
                  searchResults.map((res) => (
                    <button
                      key={res.id}
                      type="button"
                      onClick={() => {
                        navigate(res.to);
                        setSearchQuery('');
                        setMobileSearchOpen(false);
                      }}
                      className="w-full text-left py-3 px-1"
                    >
                      <div className="text-xs font-medium text-[var(--text-primary)]">{res.title}</div>
                      <div className="text-[11px] text-[var(--text-muted)]">
                        {res.kind} · {res.sub}
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Mobile "More" Bottom Sheet */}
      {moreDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="More spaces"
          className="md:hidden fixed inset-0 z-50 bg-black/55 backdrop-blur-xs flex items-end"
          onClick={() => setMoreDrawerOpen(false)}
        >
          <div
            className="w-full rounded-t-[28px] bg-[var(--surface-main)] border-t border-[var(--border-medium)] p-5 pb-safe space-y-4 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="w-10 h-1.5 rounded-full bg-[var(--border-medium)] mx-auto" />

            <div className="flex items-center justify-between">
              <span className="font-display text-lg font-medium text-[var(--text-primary)]">
                Explore Lunara
              </span>
              <button
                type="button"
                onClick={() => setMoreDrawerOpen(false)}
                aria-label="Close menu"
                className="w-9 h-9 rounded-[10px] bg-[var(--surface-secondary)] flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              {[
                { to: '/calendar', label: 'Calendar', icon: CalendarDays, bg: 'bg-[var(--surface-blue)]', text: 'text-[var(--blue-strong)]' },
                { to: '/insights', label: 'Insights', icon: BarChart3, bg: 'bg-[var(--surface-teal)]', text: 'text-[var(--teal-strong)]' },
                {
                  to: '/notifications',
                  label: unreadNotificationCount > 0 ? `Inbox (${unreadNotificationCount})` : 'Notifications',
                  icon: Bell,
                  bg: 'bg-[var(--surface-lavender)]',
                  text: 'text-[var(--lavender-strong)]',
                },
                { to: '/settings', label: 'Settings', icon: Settings, bg: 'bg-[var(--surface-rose)]', text: 'text-[var(--rose-strong)]' },
              ].map((dest) => {
                const Icon = dest.icon;
                return (
                  <NavLink
                    key={dest.to}
                    to={dest.to}
                    className={`flex items-center gap-2.5 min-h-[48px] px-3.5 rounded-[14px] ${dest.bg} ${dest.text} text-sm font-medium`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{dest.label}</span>
                  </NavLink>
                );
              })}
            </div>

            {isAdmin && (
              <NavLink
                to="/admin"
                className="flex items-center justify-center gap-2 min-h-[46px] rounded-[14px] bg-[var(--surface-blue)] text-[var(--blue-strong)] text-sm font-medium"
              >
                <Shield className="w-4 h-4" />
                <span>Open Admin Console</span>
              </NavLink>
            )}

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={toggleTheme}
                className="flex-1 flex items-center justify-center gap-2 min-h-[44px] rounded-[12px] bg-[var(--surface-secondary)] text-xs font-medium text-[var(--text-primary)]"
              >
                {resolvedTheme === 'dark' ? (
                  <>
                    <Sun className="w-4 h-4 text-[#E5B26F]" />
                    <span>Light mode</span>
                  </>
                ) : (
                  <>
                    <Moon className="w-4 h-4 text-[#56348D]" />
                    <span>Dark mode</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-[12px] bg-[var(--surface-coral)] text-xs font-medium text-[var(--coral-strong)]"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign out</span>
              </button>
            </div>

            <PWAInstallButton />
          </div>
        </div>
      )}

      <OfflineIndicator />
    </div>
  );
};
