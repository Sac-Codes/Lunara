import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  Moon,
  Shield,
  Sun,
  User,
} from 'lucide-react';
import { TwilightMoonIllustration } from '../components/graphics/LunarArtwork';
import { Button, IconButton } from '../components/ui/Button';
import { LunaraMark } from '../components/ui/LunaraMark';
import { LUNARA_ARTWORK } from '../lib/atmosphere';
import { useAuth } from '../providers/AuthProvider';
import { useLunara } from '../providers/LunaraProvider';

export const LoginPage: React.FC = () => {
  const { signIn, signInPreview, rememberedEmail } = useAuth();
  const { resolvedTheme, toggleTheme, updateProfile, showToast } = useLunara();
  const navigate = useNavigate();
  const location = useLocation();

  const intendedDestination =
    (location.state as { from?: string } | null)?.from || '/';

  const [email, setEmail] = useState(rememberedEmail || '');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedEmail));
  const [submitting, setSubmitting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState<'user' | 'admin' | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [forgotMode, setForgotMode] = useState(false);
  const [resetEmail, setResetEmail] = useState(rememberedEmail || '');
  const [resetNoticeVisible, setResetNoticeVisible] = useState(false);
  const [bgImgError, setBgImgError] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSubmitting(true);

    const result = await signIn(email, password, rememberMe);
    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error || 'Please check your email and password.');
      return;
    }

    const derivedName = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
    if (derivedName) {
      const formatted = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
      updateProfile({ displayName: formatted });
    }
    showToast('Welcome back to your space.', 'lavender');
    navigate(intendedDestination.startsWith('/admin') ? '/' : intendedDestination, {
      replace: true,
    });
  };

  const handlePreviewSignIn = async (role: 'user' | 'admin') => {
    setErrorMessage('');
    setPreviewLoading(role);
    await signInPreview(role);
    setPreviewLoading(null);

    if (role === 'admin') {
      updateProfile({ displayName: 'Clara' });
      showToast('Entered as Admin preview.', 'blue');
      navigate(intendedDestination.startsWith('/admin') ? intendedDestination : '/admin', {
        replace: true,
      });
    } else {
      updateProfile({ displayName: 'Sora' });
      showToast('Entered as Member preview.', 'lavender');
      navigate(intendedDestination.startsWith('/admin') ? '/' : intendedDestination, {
        replace: true,
      });
    }
  };

  const handleForgotSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetNoticeVisible(true);
  };

  return (
    <div className="lunara-atmosphere min-h-dvh flex flex-col lg:grid lg:grid-cols-12">
      {/* Desktop Left Visual Composition */}
      <section className="hidden lg:flex lg:col-span-6 xl:col-span-7 relative overflow-hidden bg-[#11163D] text-[#F2ECF7] p-10 xl:p-14 flex-col justify-between">
        {!bgImgError ? (
          <img
            src={LUNARA_ARTWORK.night}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBgImgError(true)}
            className="absolute inset-0 w-full h-full object-cover scale-110 opacity-75"
            aria-hidden="true"
          />
        ) : null}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(155deg, rgba(17, 22, 61, 0.86) 0%, rgba(48, 32, 95, 0.72) 52%, rgba(27, 32, 86, 0.88) 100%)',
          }}
          aria-hidden="true"
        />

        {/* Top Brand Row */}
        <div className="relative z-10 flex items-center gap-3.5">
          <LunaraMark className="w-11 h-11 shadow-md" />
          <div>
            <div className="font-display text-2xl font-medium tracking-tight text-white">
              Lunara
            </div>
            <div className="text-xs text-[#C4A2F2]">
              A little more thoughtful, every day.
            </div>
          </div>
        </div>

        {/* Center Artwork & Editorial Copy */}
        <div className="relative z-10 my-auto py-8 max-w-xl">
          <div className="rounded-[28px] bg-[#11163D]/55 border border-white/15 p-4 sm:p-6 backdrop-blur-md shadow-xl">
            <TwilightMoonIllustration className="w-full h-auto max-h-[260px]" />
          </div>

          <h2 className="mt-8 font-display text-3xl xl:text-4xl font-medium leading-tight text-white">
            A quiet place to notice how your days feel.
          </h2>
          <p className="mt-3 text-base leading-relaxed text-[#E3D4F7]/90 max-w-md">
            Check in without pressure, write freely in your journal, and revisit your patterns over time.
          </p>
        </div>

        {/* Subtle bottom color spectrum bar */}
        <div className="relative z-10 flex items-center gap-3 text-xs text-[#C9DCF8]/85">
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#C4A2F2]" /> Reflection
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#78A6E7]" /> Clarity
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D99EBB]" /> Expression
          </span>
          <span aria-hidden="true">·</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#76BBAA]" /> Balance
          </span>
        </div>
      </section>

      {/* Right / Mobile Login Surface */}
      <section className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between p-5 sm:p-8 lg:p-12">
        {/* Top bar with mobile brand + theme control */}
        <div className="flex items-center justify-between gap-4">
          <div className="flex lg:hidden items-center gap-2.5">
            <LunaraMark className="w-9 h-9" />
            <span className="font-display text-xl font-medium text-[var(--text-primary)]">
              Lunara
            </span>
          </div>
          <div className="hidden lg:block" />

          <IconButton
            label={resolvedTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            variant="surface"
            size="sm"
            onClick={toggleTheme}
          >
            {resolvedTheme === 'dark' ? (
              <Sun className="w-4 h-4 text-[#E5B26F]" />
            ) : (
              <Moon className="w-4 h-4 text-[#795D96]" />
            )}
          </IconButton>
        </div>

        {/* Main Centered Form */}
        <div className="my-auto py-6 sm:py-10 w-full max-w-md mx-auto">
          {/* Mobile decorative horizon banner */}
          <div className="lg:hidden relative mb-6 rounded-[22px] bg-[#11163D] p-4 flex items-center justify-between gap-4 text-white overflow-hidden">
            {!bgImgError && (
              <img
                src={LUNARA_ARTWORK.night}
                alt=""
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-cover scale-125 opacity-55"
                aria-hidden="true"
              />
            )}
            <div className="relative z-10 min-w-0">
              <p className="text-xs text-[#C4A2F2]">Personal sanctuary</p>
              <p className="font-display text-base font-medium leading-snug mt-0.5">
                A little more thoughtful, every day.
              </p>
            </div>
            <div className="relative z-10 w-24 shrink-0">
              <TwilightMoonIllustration className="w-full h-auto" />
            </div>
          </div>

          {!forgotMode ? (
            <>
              <div>
                <h1 className="font-display text-3xl sm:text-[34px] font-medium text-[var(--text-primary)] tracking-tight">
                  Welcome back.
                </h1>
                <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)]">
                  Your space to pause, reflect, and reconnect.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="mt-7 space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="login-email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full min-h-[48px] rounded-[14px] bg-[var(--surface-main)] border border-[var(--border-medium)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-2 focus:outline-[#B18ACD]"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label
                      htmlFor="login-password"
                      className="block text-xs font-medium text-[var(--text-secondary)]"
                    >
                      Password
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setResetEmail(email);
                        setResetNoticeVisible(false);
                        setForgotMode(true);
                      }}
                      className="text-xs font-medium text-[var(--blue-strong)] hover:underline cursor-pointer"
                    >
                      Forgot password?
                    </button>
                  </div>
                  <div className="relative">
                    <input
                      id="login-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full min-h-[48px] rounded-[14px] bg-[var(--surface-main)] border border-[var(--border-medium)] pl-4 pr-12 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-2 focus:outline-[#B18ACD]"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((prev) => !prev)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <label className="inline-flex items-center gap-2.5 text-xs sm:text-sm text-[var(--text-secondary)] cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      className="w-4 h-4 rounded accent-[#795D96] dark:accent-[#B18ACD]"
                    />
                    <span>Remember my email</span>
                  </label>
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-[14px] bg-[var(--surface-coral)] px-4 py-3 text-xs sm:text-sm text-[var(--coral-strong)]"
                  >
                    {errorMessage}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={submitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full mt-2"
                >
                  Sign in to Lunara
                </Button>
              </form>

              {/* Clearly isolated role preview launcher */}
              <div className="mt-8 rounded-[20px] bg-[var(--surface-blue)]/80 p-4 sm:p-5 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[var(--blue-strong)] shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    <strong className="text-[var(--text-primary)]">Preview authentication:</strong> Backend auth is not connected yet. Sign in above as a member or preview either role below.
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    loading={previewLoading === 'user'}
                    onClick={() => handlePreviewSignIn('user')}
                    leftIcon={<User className="w-3.5 h-3.5" />}
                    className="bg-[var(--surface-main)]/75"
                  >
                    Preview Member
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    loading={previewLoading === 'admin'}
                    onClick={() => handlePreviewSignIn('admin')}
                    leftIcon={<Shield className="w-3.5 h-3.5" />}
                  >
                    Preview Admin
                  </Button>
                </div>
              </div>
            </>
          ) : (
            /* Honest Forgot Password UI flow */
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setForgotMode(false)}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="-ml-2 mb-4"
              >
                Back to sign in
              </Button>

              <h1 className="font-display text-3xl font-medium text-[var(--text-primary)]">
                Reset password
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                Enter your account email below to check password recovery availability.
              </p>

              <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4">
                <div>
                  <label
                    htmlFor="reset-email"
                    className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="reset-email"
                    type="email"
                    required
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full min-h-[48px] rounded-[14px] bg-[var(--surface-main)] border border-[var(--border-medium)] px-4 text-sm text-[var(--text-primary)] focus:outline-2 focus:outline-[#78A6E7]"
                  />
                </div>

                <Button type="submit" variant="secondary" size="lg" className="w-full">
                  Continue
                </Button>
              </form>

              {resetNoticeVisible && (
                <div className="mt-5 rounded-[16px] bg-[var(--surface-amber)] p-4 text-sm text-[var(--amber-strong)] leading-relaxed">
                  Password recovery emails require backend authentication (planned with Supabase Auth) and are not active in this local preview. Return to Sign in to continue exploring Lunara.
                </div>
              )}
            </div>
          )}
        </div>

        <p className="text-center lg:text-left text-xs text-[var(--text-muted)]">
          Reflections created on this device stay in local browser storage.
        </p>
      </section>
    </div>
  );
};
