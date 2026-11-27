import React, { useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Eye,
  EyeOff,
  Info,
  Moon,
  Sun,
  User,
} from 'lucide-react';
import { TwilightMoonIllustration } from '../components/graphics/LunarArtwork';
import { Button, IconButton } from '../components/ui/Button';
import { LunaraMark } from '../components/ui/LunaraMark';
import { LUNARA_ARTWORK } from '../lib/atmosphere';
import { useAuth } from '../providers/AuthProvider';
import { useLunara } from '../providers/LunaraProvider';

type AuthViewMode = 'signin' | 'signup' | 'forgot';

export const LoginPage: React.FC = () => {
  const {
    isAuthenticated,
    isAdmin,
    isLoading,
    isSupabaseEnabled,
    signIn,
    signUp,
    resetPassword,
    signInPreview,
    rememberedEmail,
  } = useAuth();
  const { resolvedTheme, toggleTheme, updateProfile, showToast } = useLunara();
  const navigate = useNavigate();
  const location = useLocation();

  const rawIntended = (location.state as { from?: string } | null)?.from || '/';
  const intendedDestination = rawIntended.startsWith('/login') ? '/' : rawIntended;

  const [viewMode, setViewMode] = useState<AuthViewMode>('signin');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState(rememberedEmail || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(Boolean(rememberedEmail));
  const [submitting, setSubmitting] = useState(false);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [signupNotice, setSignupNotice] = useState('');
  const [resetEmail, setResetEmail] = useState(rememberedEmail || '');
  const [resetSubmitting, setResetSubmitting] = useState(false);
  const [resetError, setResetError] = useState('');
  const [resetNoticeVisible, setResetNoticeVisible] = useState(false);
  const [bgImgError, setBgImgError] = useState(false);

  if (isLoading) {
    return (
      <div
        className="lunara-atmosphere min-h-dvh"
        aria-busy="true"
        aria-label="Checking session"
      />
    );
  }

  if (isAuthenticated) {
    const safeDestination =
      !isAdmin && intendedDestination.startsWith('/admin')
        ? '/'
        : intendedDestination;
    return <Navigate to={safeDestination} replace />;
  }

  const switchMode = (nextMode: AuthViewMode) => {
    setViewMode(nextMode);
    setErrorMessage('');
    setSignupNotice('');
    setResetError('');
    setResetNoticeVisible(false);
  };

  const handleSignInSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMessage('');
    setSubmitting(true);

    const result = await signIn(email, password, rememberMe);
    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error || 'Please check your email and password.');
      return;
    }

    if (!isSupabaseEnabled) {
      const derivedName = email.split('@')[0]?.replace(/[._-]+/g, ' ').trim();
      if (derivedName) {
        const formatted = derivedName.charAt(0).toUpperCase() + derivedName.slice(1);
        updateProfile({ displayName: formatted });
      }
    }

    showToast('Welcome back to your space.', 'lavender');
  };

  const handleSignUpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setErrorMessage('');
    setSignupNotice('');

    if (!password || password.length < 6) {
      setErrorMessage('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    setSubmitting(true);
    const result = await signUp(email, password, displayName);
    setSubmitting(false);

    if (!result.ok) {
      setErrorMessage(result.error || 'Could not create your account. Please try again.');
      return;
    }

    if (result.requiresEmailConfirmation) {
      setPassword('');
      setConfirmPassword('');
      setSignupNotice(
        'Your account has been created. Please check your email to confirm your address before signing in.'
      );
      return;
    }

    showToast('Welcome to Lunara.', 'lavender');
  };

  const handlePreviewSignIn = async () => {
    if (previewLoading || submitting) return;

    setErrorMessage('');
    setPreviewLoading(true);
    const result = await signInPreview();
    setPreviewLoading(false);

    if (!result.ok) {
      setErrorMessage(result.error || 'Preview mode is unavailable right now.');
      return;
    }

    updateProfile({ displayName: 'Sora' });
    showToast('Entered as Member preview.', 'lavender');
    navigate(intendedDestination.startsWith('/admin') ? '/' : intendedDestination, {
      replace: true,
    });
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resetSubmitting) return;

    setResetError('');
    setResetNoticeVisible(false);

    if (!isSupabaseEnabled) {
      setResetNoticeVisible(true);
      return;
    }

    const trimmedEmail = resetEmail.trim();
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setResetError('Please enter a valid email address.');
      return;
    }

    setResetSubmitting(true);
    await resetPassword(trimmedEmail);
    setResetSubmitting(false);

    // Always display a generic confirmation message without revealing account existence.
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

          {viewMode === 'signin' ? (
            <>
              <div>
                <h1 className="font-display text-3xl sm:text-[34px] font-medium text-[var(--text-primary)] tracking-tight">
                  Welcome back.
                </h1>
                <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)]">
                  Your space to pause, reflect, and reconnect.
                </p>
              </div>

              <form onSubmit={handleSignInSubmit} className="mt-7 space-y-4" noValidate>
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
                        switchMode('forgot');
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
                  disabled={submitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full mt-2"
                >
                  Sign in to Lunara
                </Button>
              </form>

              {isSupabaseEnabled && (
                <p className="mt-5 text-center text-xs sm:text-sm text-[var(--text-secondary)]">
                  New to Lunara?{' '}
                  <button
                    type="button"
                    onClick={() => switchMode('signup')}
                    className="font-medium text-[var(--blue-strong)] hover:underline cursor-pointer"
                  >
                    Create an account
                  </button>
                </p>
              )}

              {/* Clearly isolated Preview Member launcher */}
              <div className="mt-8 rounded-[20px] bg-[var(--surface-blue)]/80 p-4 sm:p-5 space-y-3">
                <div className="flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-[var(--blue-strong)] shrink-0 mt-0.5" />
                  <div className="text-xs leading-relaxed text-[var(--text-secondary)]">
                    {isSupabaseEnabled ? (
                      <>
                        <strong className="text-[var(--text-primary)]">Preview mode:</strong> Explore Lunara using local browser demo data, completely separate from real cloud accounts.
                      </>
                    ) : (
                      <>
                        <strong className="text-[var(--text-primary)]">Preview authentication:</strong> Backend auth is not connected yet. Sign in above or explore as a preview member below.
                      </>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  loading={previewLoading}
                  disabled={previewLoading || submitting}
                  onClick={handlePreviewSignIn}
                  leftIcon={<User className="w-3.5 h-3.5" />}
                  className="w-full bg-[var(--surface-main)]/75"
                >
                  Preview Member
                </Button>
              </div>
            </>
          ) : viewMode === 'signup' ? (
            <>
              <div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => switchMode('signin')}
                  leftIcon={<ArrowLeft className="w-4 h-4" />}
                  className="-ml-2 mb-4"
                >
                  Back to sign in
                </Button>

                <h1 className="font-display text-3xl sm:text-[34px] font-medium text-[var(--text-primary)] tracking-tight">
                  Create your space.
                </h1>
                <p className="mt-2 text-sm sm:text-base text-[var(--text-secondary)]">
                  Begin your quiet daily reflection practice.
                </p>
              </div>

              <form onSubmit={handleSignUpSubmit} className="mt-7 space-y-4" noValidate>
                <div>
                  <label
                    htmlFor="signup-name"
                    className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                  >
                    Display name
                  </label>
                  <input
                    id="signup-name"
                    type="text"
                    autoComplete="name"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="How you'd like to be greeted"
                    className="w-full min-h-[48px] rounded-[14px] bg-[var(--surface-main)] border border-[var(--border-medium)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-2 focus:outline-[#B18ACD]"
                  />
                </div>

                <div>
                  <label
                    htmlFor="signup-email"
                    className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                  >
                    Email address
                  </label>
                  <input
                    id="signup-email"
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
                  <label
                    htmlFor="signup-password"
                    className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="signup-password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 6 characters"
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

                <div>
                  <label
                    htmlFor="signup-confirm-password"
                    className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5"
                  >
                    Confirm password
                  </label>
                  <input
                    id="signup-confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your password"
                    className="w-full min-h-[48px] rounded-[14px] bg-[var(--surface-main)] border border-[var(--border-medium)] px-4 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-2 focus:outline-[#B18ACD]"
                  />
                </div>

                {errorMessage && (
                  <div
                    role="alert"
                    className="rounded-[14px] bg-[var(--surface-coral)] px-4 py-3 text-xs sm:text-sm text-[var(--coral-strong)]"
                  >
                    {errorMessage}
                  </div>
                )}

                {signupNotice && (
                  <div
                    role="status"
                    className="rounded-[14px] bg-[var(--surface-teal)] px-4 py-3 text-xs sm:text-sm text-[var(--teal-strong)] leading-relaxed"
                  >
                    {signupNotice}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  loading={submitting}
                  disabled={submitting}
                  rightIcon={<ArrowRight className="w-4 h-4" />}
                  className="w-full mt-2"
                >
                  Create account
                </Button>
              </form>
            </>
          ) : (
            /* Forgot Password Request flow */
            <div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => switchMode('signin')}
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                className="-ml-2 mb-4"
              >
                Back to sign in
              </Button>

              <h1 className="font-display text-3xl font-medium text-[var(--text-primary)]">
                Reset password
              </h1>
              <p className="mt-2 text-sm text-[var(--text-secondary)] leading-relaxed">
                {isSupabaseEnabled
                  ? 'Enter your email address and we will send you a link to reset your password.'
                  : 'Enter your account email below to check password recovery availability.'}
              </p>

              <form onSubmit={handleForgotSubmit} className="mt-6 space-y-4" noValidate>
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

                {resetError && (
                  <div
                    role="alert"
                    className="rounded-[14px] bg-[var(--surface-coral)] px-4 py-3 text-xs sm:text-sm text-[var(--coral-strong)]"
                  >
                    {resetError}
                  </div>
                )}

                <Button
                  type="submit"
                  variant="secondary"
                  size="lg"
                  loading={resetSubmitting}
                  disabled={resetSubmitting}
                  className="w-full"
                >
                  {isSupabaseEnabled ? 'Send reset link' : 'Continue'}
                </Button>
              </form>

              {resetNoticeVisible && (
                <div
                  role="status"
                  className={`mt-5 rounded-[16px] p-4 text-sm leading-relaxed ${
                    isSupabaseEnabled
                      ? 'bg-[var(--surface-teal)] text-[var(--teal-strong)]'
                      : 'bg-[var(--surface-amber)] text-[var(--amber-strong)]'
                  }`}
                >
                  {isSupabaseEnabled
                    ? 'If an account exists for that email address, a password reset link has been sent.'
                    : 'Password recovery emails require backend authentication (planned with Supabase Auth) and are not active in this local preview. Return to Sign in to continue exploring Lunara.'}
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
