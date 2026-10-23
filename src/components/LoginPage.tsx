import React, { useState } from 'react';
import { Mail, Lock, User, Eye, EyeOff, Compass, Sparkles, ArrowRight, CheckCircle2, AlertCircle, ShieldCheck, Plane, MapPin, KeyRound, RefreshCw } from 'lucide-react';
import { api, setAuthToken } from '../lib/api';
import { User as UserType } from '../types/travel';

interface LoginPageProps {
  onAuthSuccess: (user: UserType) => void;
  onContinueAsGuest?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({
  onAuthSuccess,
  onContinueAsGuest,
}) => {
  const [mode, setMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Field-level validation errors
  const [nameError, setNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [tempCode, setTempCode] = useState<string | null>(null);

  const validate = (): boolean => {
    let isValid = true;
    setNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setServerError(null);

    const emailTrimmed = email.trim();
    if (!emailTrimmed) {
      setEmailError('Email address cannot be empty.');
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailTrimmed)) {
      setEmailError('Please enter a valid email address (e.g., alex@traveler.com).');
      isValid = false;
    }

    if (mode === 'signup') {
      if (!name.trim()) {
        setNameError('Full name is required.');
        isValid = false;
      } else if (name.trim().length < 2) {
        setNameError('Name must be at least 2 characters.');
        isValid = false;
      }

      if (!password) {
        setPasswordError('Password cannot be empty.');
        isValid = false;
      } else if (password.length < 6) {
        setPasswordError('Password must be at least 6 characters long.');
        isValid = false;
      }

      if (password !== confirmPassword) {
        setConfirmPasswordError('Passwords do not match.');
        isValid = false;
      }
    } else if (mode === 'login') {
      if (!password) {
        setPasswordError('Password is required to log in.');
        isValid = false;
      } else if (password.length < 4) {
        setPasswordError('Password is too short.');
        isValid = false;
      }
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setServerError(null);
    setSuccessNotice(null);

    try {
      if (mode === 'login') {
        const res = await api.login({ email: email.trim(), password });
        setAuthToken(res.token);
        onAuthSuccess(res.user);
      } else if (mode === 'signup') {
        const res = await api.signup({
          name: name.trim(),
          email: email.trim(),
          password,
        });
        setAuthToken(res.token);
        onAuthSuccess(res.user);
      } else if (mode === 'forgot') {
        const res = await api.forgotPassword(email.trim());
        setSuccessNotice(res.message);
        if (res.tempResetCode) {
          setTempCode(res.tempResetCode);
        }
      }
    } catch (err: any) {
      setServerError(err.message || 'Authentication failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickDemoLogin = async () => {
    setLoading(true);
    setServerError(null);
    try {
      const res = await api.login({
        email: 'alex@globetrotter.io',
        password: 'traveler123',
      });
      setAuthToken(res.token);
      onAuthSuccess(res.user);
    } catch (err: any) {
      setServerError(err.message || 'Demo login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col justify-center relative overflow-hidden py-12 px-4 sm:px-6 lg:px-8 selection:bg-amber-300 selection:text-amber-900">
      {/* Dynamic Background Image & Subtle Mesh Glow */}
      <div className="absolute inset-0 z-0">
        <img
          src="https://images.unsplash.com/photo-1488646953014-85cb44e25828?auto=format&fit=crop&w=2000&q=80"
          alt="Travel Horizon"
          className="w-full h-full object-cover opacity-25 scale-105 filter blur-[1px]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-900/80 to-slate-900/60" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      <div className="relative z-10 sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-sky-500 via-indigo-600 to-amber-500 p-0.5 shadow-xl shadow-sky-500/20 mb-3 group hover:scale-105 transition-transform duration-300">
            <div className="w-full h-full bg-slate-900 rounded-[14px] flex items-center justify-center">
              <Compass className="w-7 h-7 text-sky-400 group-hover:rotate-45 transition-transform duration-500" />
            </div>
          </div>
          <h1 className="text-3xl font-extrabold text-white tracking-tight">
            Globe<span className="text-sky-400">Trotter</span>
          </h1>
          <p className="mt-1 text-sm text-slate-300">
            Intelligent Multi-City Itinerary, Travel Bookings & Budget Manager
          </p>
        </div>

        {/* Main Authentication Card */}
        <div className="bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-7 sm:p-9 transition-all">
          {/* Mode Switcher Tabs */}
          {mode !== 'forgot' && (
            <div className="flex rounded-2xl bg-slate-100 p-1 mb-6 border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setServerError(null);
                  setSuccessNotice(null);
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                  mode === 'login'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setServerError(null);
                  setSuccessNotice(null);
                }}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all duration-200 ${
                  mode === 'signup'
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Create Account
              </button>
            </div>
          )}

          {/* Title based on state */}
          <div className="mb-6">
            <h2 className="text-xl font-bold text-slate-900">
              {mode === 'login' && 'Welcome Back, Traveler'}
              {mode === 'signup' && 'Create Your Free Account'}
              {mode === 'forgot' && 'Reset Your Password'}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {mode === 'login' && 'Enter your email & password to access your trips and bookings.'}
              {mode === 'signup' && 'Start organizing multi-destination trips with smart budgeting.'}
              {mode === 'forgot' && 'Enter your registered email address to receive password instructions.'}
            </p>
          </div>

          {/* Server Error Alert */}
          {serverError && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start space-x-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
              <div className="flex-1 font-medium">{serverError}</div>
            </div>
          )}

          {/* Success / Recovery Alert */}
          {successNotice && (
            <div className="mb-5 p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs space-y-1.5 animate-in fade-in duration-200">
              <div className="flex items-center space-x-2 font-bold text-emerald-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Recovery Instructions Dispatched</span>
              </div>
              <p>{successNotice}</p>
              {tempCode && (
                <div className="mt-2 p-2 bg-emerald-100 rounded-lg text-emerald-900 font-mono text-xs flex items-center justify-between">
                  <span>Code: <strong>{tempCode}</strong></span>
                  <span className="text-[10px] text-emerald-700">Demo Reset</span>
                </div>
              )}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Full Name (Sign Up only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameError) setNameError(null);
                    }}
                    placeholder="e.g. Alex Morgan"
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${
                      nameError
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500'
                    }`}
                  />
                </div>
                {nameError && (
                  <p className="mt-1 text-[11px] font-medium text-rose-500">{nameError}</p>
                )}
              </div>
            )}

            {/* Email Address */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (emailError) setEmailError(null);
                  }}
                  placeholder="name@example.com"
                  autoComplete="email"
                  className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${
                    emailError
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                      : 'border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500'
                  }`}
                />
              </div>
              {emailError && (
                <p className="mt-1 text-[11px] font-medium text-rose-500">{emailError}</p>
              )}
            </div>

            {/* Password Field (for Login and Signup) */}
            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-slate-700">
                    Password
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => {
                        setMode('forgot');
                        setServerError(null);
                        setSuccessNotice(null);
                      }}
                      className="text-[11px] font-medium text-sky-600 hover:text-sky-700 transition-colors"
                    >
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (passwordError) setPasswordError(null);
                    }}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                    autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
                    className={`w-full pl-10 pr-10 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${
                      passwordError
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {passwordError && (
                  <p className="mt-1 text-[11px] font-medium text-rose-500">{passwordError}</p>
                )}
              </div>
            )}

            {/* Confirm Password (Signup only) */}
            {mode === 'signup' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Confirm Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => {
                      setConfirmPassword(e.target.value);
                      if (confirmPasswordError) setConfirmPasswordError(null);
                    }}
                    placeholder="Repeat your password"
                    className={`w-full pl-10 pr-4 py-2.5 bg-slate-50 border rounded-xl text-sm text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none transition-all ${
                      confirmPasswordError
                        ? 'border-rose-400 focus:ring-2 focus:ring-rose-200'
                        : 'border-slate-200 focus:ring-2 focus:ring-sky-500/20 focus:border-sky-500'
                    }`}
                  />
                </div>
                {confirmPasswordError && (
                  <p className="mt-1 text-[11px] font-medium text-rose-500">{confirmPasswordError}</p>
                )}
              </div>
            )}

            {/* Primary Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-sky-600 via-indigo-600 to-sky-700 hover:from-sky-500 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-sky-600/25 active:scale-[0.99] transition-all flex items-center justify-center space-x-2 disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Sign In to Dashboard'}
                    {mode === 'signup' && 'Create Account & Start Planning'}
                    {mode === 'forgot' && 'Send Reset Instructions'}
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle / Secondary options */}
          <div className="mt-6 pt-5 border-t border-slate-100 space-y-3">
            {mode === 'login' ? (
              <div className="text-center">
                <span className="text-xs text-slate-500">Don't have an account yet? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('signup');
                    setServerError(null);
                  }}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
                >
                  Create New Account
                </button>
              </div>
            ) : mode === 'signup' ? (
              <div className="text-center">
                <span className="text-xs text-slate-500">Already have an account? </span>
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setServerError(null);
                  }}
                  className="text-xs font-bold text-sky-600 hover:text-sky-700 transition-colors"
                >
                  Sign In
                </button>
              </div>
            ) : (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setServerError(null);
                    setSuccessNotice(null);
                  }}
                  className="text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            )}

            {/* Quick Demo Traveler Button for 1-Click Evaluation */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleQuickDemoLogin}
                disabled={loading}
                className="w-full py-2.5 px-3 rounded-xl bg-amber-50 hover:bg-amber-100/80 border border-amber-200/80 text-amber-900 text-xs font-semibold transition-all flex items-center justify-between group cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-700">
                    <Sparkles className="w-3.5 h-3.5" />
                  </div>
                  <div className="text-left">
                    <div className="font-bold leading-tight">Instant Demo Access</div>
                    <div className="text-[10px] text-amber-700">Alex Morgan (Europe & Japan trips)</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold text-amber-700 group-hover:translate-x-0.5 transition-transform">
                  1-Click Login →
                </span>
              </button>
            </div>

            {/* Optional Guest Explorer */}
            {onContinueAsGuest && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={onContinueAsGuest}
                  className="text-[11px] text-slate-600 hover:text-slate-800 font-medium transition-colors"
                >
                  Or preview destinations as Guest
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Feature Badges below card */}
        <div className="mt-8 grid grid-cols-3 gap-3 text-center">
          <div className="p-2.5 rounded-xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 text-slate-300">
            <Plane className="w-4 h-4 mx-auto text-sky-400 mb-1" />
            <p className="text-[11px] font-semibold">Multi-City Routes</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 text-slate-300">
            <Sparkles className="w-4 h-4 mx-auto text-amber-400 mb-1" />
            <p className="text-[11px] font-semibold">Rupee Budgets</p>
          </div>
          <div className="p-2.5 rounded-xl bg-slate-800/60 backdrop-blur-sm border border-slate-700/50 text-slate-300">
            <ShieldCheck className="w-4 h-4 mx-auto text-emerald-400 mb-1" />
            <p className="text-[11px] font-semibold">Verified Bookings</p>
          </div>
        </div>
      </div>
    </div>
  );
};
